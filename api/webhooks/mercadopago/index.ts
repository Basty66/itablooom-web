import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { createCalendarEvent } from '../../calendar/_lib.js';
import { Resend } from 'resend';

const sql = neon(process.env.DATABASE_URL!);
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function isPaymentProcessed(paymentId: string): Promise<boolean> {
  const result = await sql`SELECT id FROM bookings WHERE payment_id = ${paymentId} AND status = 'confirmed'`;
  return result.length > 0;
}

async function hasExistingPayment(bookingId: string): Promise<boolean> {
  const result = await sql`SELECT payment_id FROM bookings WHERE id = ${bookingId} AND payment_id IS NOT NULL`;
  return result.length > 0;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(200).end();
  }

  try {
    const { type, data } = req.body;

    if (type !== 'payment') {
      return res.status(200).end();
    }

    const paymentId = String(data?.id);
    if (!paymentId || paymentId === 'undefined') {
      return res.status(200).end();
    }

    const alreadyProcessed = await isPaymentProcessed(paymentId);
    if (alreadyProcessed) {
      return res.status(200).end();
    }

    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
      },
    });

    if (!paymentResponse.ok) {
      return res.status(200).end();
    }

    const payment = (await paymentResponse.json()) as any;
    /*
     * El depósito y el saldo llegan por el mismo webhook. Se distinguen por el
     * sufijo `_remaining` que pone el link generado desde el panel: sin esto,
     * cobrar el saldo se registraba como si fuera la seña y la reserva volvía
     * a quedar "con saldo pendiente" para siempre.
     */
    const referencia = String(payment.external_reference || '');
    const esSaldo = referencia.endsWith('_remaining');
    const bookingId = esSaldo ? referencia.replace(/_remaining$/, '') : referencia;

    if (esSaldo) {
      if (payment.status === 'approved') {
        await sql`
          UPDATE bookings
          SET remaining_paid = true,
              remaining_paid_method = 'mp',
              remaining_paid_at = NOW(),
              status = 'completed',
              updated_at = NOW()
          WHERE id = ${bookingId} AND remaining_paid = false
        `;
        console.log(`Saldo pagado por Mercado Pago para ${bookingId}`);
      }
      return res.status(200).end();
    }

    if (!bookingId) {
      return res.status(200).end();
    }

    const alreadyHasPayment = await hasExistingPayment(bookingId);
    if (alreadyHasPayment) {
      return res.status(200).end();
    }

    if (payment.status === 'approved') {
      // El pago puede llegar después de que el cupo expiró y se reasignó.
      // No rechazamos (la plata entró), pero dejamos el conflicto visible.
      const conflicto = await sql`
        SELECT b2.id FROM bookings b1
        JOIN bookings b2
          ON b2.booking_date = b1.booking_date
         AND b2.booking_time = b1.booking_time
         AND b2.id <> b1.id
        WHERE b1.id = ${bookingId} AND b2.status = 'confirmed'
      `;

      await sql`
        UPDATE bookings
        SET status = 'confirmed',
            deposit_paid = true,
            deposit_paid_at = NOW(),
            payment_id = ${paymentId},
            -- Si abonó el total, no queda saldo que cobrar en el local.
            remaining_paid = (deposit_amount >= total_amount),
            remaining_paid_method = CASE WHEN deposit_amount >= total_amount THEN 'mp' ELSE remaining_paid_method END,
            remaining_paid_at = CASE WHEN deposit_amount >= total_amount THEN NOW() ELSE remaining_paid_at END,
            updated_at = NOW()
        WHERE id = ${bookingId}
      `;

      if (conflicto.length > 0) {
        console.error(
          `⚠️ CONFLICTO: la reserva ${bookingId} se pagó pero el horario ya estaba tomado por ${(conflicto[0] as any).id}. Requiere reagendar manualmente.`
        );
      }

      // Crear evento en Google Calendar
      try {
        const bookings = await sql`
          SELECT b.*, s.name as service_name, s.duration_minutes
          FROM bookings b
          JOIN services s ON b.service_id = s.id
          WHERE b.id = ${bookingId}
        `;
        const booking = bookings[0] as any;

        if (booking) {
          const raw = booking.booking_date;
          let dateStr: string;
          if (typeof raw === 'string') {
            dateStr = raw.split('T')[0];
          } else if (raw instanceof Date) {
            const y = raw.getFullYear();
            const m = String(raw.getMonth() + 1).padStart(2, '0');
            const d = String(raw.getDate()).padStart(2, '0');
            dateStr = `${y}-${m}-${d}`;
          } else {
            dateStr = String(raw).split('T')[0];
          }
          const timeStr = booking.booking_time ? booking.booking_time.slice(0, 5) : '10:00';

          const eventId = await createCalendarEvent({
            summary: `${booking.service_name} - ${booking.client_name}`,
            description: `Cita confirmada. Cliente: ${booking.client_name} | Email: ${booking.client_email} | Tel: ${booking.client_phone}`,
            date: dateStr,
            time: timeStr,
            durationMinutes: booking.duration_minutes || 60,
            clientEmail: booking.client_email,
            clientName: booking.client_name,
          });

          if (eventId) {
            await sql`UPDATE bookings SET calendar_event_id = ${eventId} WHERE id = ${bookingId}`;
            console.log(`📅 Calendar event created: ${eventId}`);
          }

          // Enviar email de notificación al dueño
          if (resend) {
            try {
              const ownerEmail = process.env.OWNER_EMAIL || 'cristianbastian.dev@gmail.com';

              // URL al calendario con la fecha de la cita
              const [y, m, d] = dateStr.split('-');
              const calEventUrl = `https://calendar.google.com/calendar/r/day/${y}/${m}/${d}`;

              /*
               * El correo decía "Monto pagado" y mostraba total_amount: con un
               * abono de $5.000 sobre un servicio de $16.000, anunciaba $16.000
               * como cobrados. Ahora muestra lo realmente pagado y, si queda
               * saldo, cuánto falta cobrar.
               */
              const pagado = Number(booking.deposit_amount) || 0;
              const totalServicio = Number(booking.total_amount) || 0;
              const saldoPendiente = Math.max(totalServicio - pagado, 0);

              await resend.emails.send({
                from: 'Goddess Studio <onboarding@resend.dev>',
                to: ownerEmail,
                subject: `Nueva reserva: ${esc(booking.service_name)} — ${esc(booking.client_name)}`,
                html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#faf6ef;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf6ef;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#fdfbf7;border-radius:24px;border:1px solid rgba(20,16,14,0.08);overflow:hidden;box-shadow:0 20px 60px -40px rgba(20,16,14,0.5);">

        <!-- Header -->
        <tr><td style="background-color:#14100e;padding:32px 32px 28px;text-align:center;">
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#e9cb6b;font-weight:500;">Goddess Studio</p>
          <h1 style="margin:0;font-size:22px;font-weight:600;color:#faf6ef;letter-spacing:-0.01em;">Nueva cita agendada</h1>
        </td></tr>

        <!-- Badge -->
        <tr><td style="padding:28px 32px 0;text-align:center;">
          <div style="display:inline-block;background-color:#fbf1cf;border-radius:999px;padding:8px 20px;">
            <span style="font-size:13px;font-weight:600;color:#6b5215;">${esc(booking.service_name)}</span>
          </div>
        </td></tr>

        <!-- Detalles -->
        <tr><td style="padding:24px 32px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(20,16,14,0.08);border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:14px 20px;background-color:#fdfbf7;border-bottom:1px solid rgba(20,16,14,0.06);">
                <span style="font-size:12px;color:#9a8d84;text-transform:uppercase;letter-spacing:0.08em;">Cliente</span><br>
                <span style="font-size:15px;font-weight:600;color:#14100e;">${esc(booking.client_name)}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 20px;background-color:#fdfbf7;border-bottom:1px solid rgba(20,16,14,0.06);">
                <span style="font-size:12px;color:#9a8d84;text-transform:uppercase;letter-spacing:0.08em;">Fecha</span><br>
                <span style="font-size:15px;font-weight:600;color:#14100e;">${esc(dateStr)}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 20px;background-color:#fdfbf7;border-bottom:1px solid rgba(20,16,14,0.06);">
                <span style="font-size:12px;color:#9a8d84;text-transform:uppercase;letter-spacing:0.08em;">Hora</span><br>
                <span style="font-size:15px;font-weight:600;color:#14100e;">${esc(timeStr)}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 20px;background-color:#fdfbf7;border-bottom:1px solid rgba(20,16,14,0.06);">
                <span style="font-size:12px;color:#9a8d84;text-transform:uppercase;letter-spacing:0.08em;">Teléfono</span><br>
                <a href="tel:${esc(booking.client_phone)}" style="font-size:15px;font-weight:600;color:#14100e;text-decoration:none;">${esc(booking.client_phone)}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 20px;background-color:#fdfbf7;">
                <span style="font-size:12px;color:#9a8d84;text-transform:uppercase;letter-spacing:0.08em;">Email</span><br>
                <a href="mailto:${esc(booking.client_email)}" style="font-size:15px;font-weight:600;color:#6b5215;text-decoration:none;">${esc(booking.client_email)}</a>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Monto -->
        <tr><td style="padding:20px 32px 0;text-align:center;">
          <div style="background-color:#fbf1cf;border-radius:16px;padding:20px;">
            <p style="margin:0 0 4px;font-size:12px;color:#6b5215;text-transform:uppercase;letter-spacing:0.08em;font-weight:500;">${saldoPendiente > 0 ? 'Abono recibido' : 'Pago total recibido'}</p>
            <p style="margin:0;font-size:28px;font-weight:700;color:#14100e;letter-spacing:-0.02em;">$${pagado.toLocaleString('es-CL')}</p>
            ${saldoPendiente > 0
              ? `<p style="margin:8px 0 0;font-size:13px;color:#5a4f47;">Saldo por cobrar en el local: <strong>$${saldoPendiente.toLocaleString('es-CL')}</strong> · Total $${totalServicio.toLocaleString('es-CL')}</p>`
              : ''}
          </div>
        </td></tr>

        <!-- Botón Calendar -->
        <tr><td style="padding:24px 32px 8px;text-align:center;">
          <a href="${calEventUrl}" style="display:inline-block;padding:14px 32px;background-color:#14100e;color:#faf6ef;text-decoration:none;border-radius:999px;font-size:14px;font-weight:500;letter-spacing:0.01em;">Ver en Google Calendar</a>
        </td></tr>

        <!-- Confirmación -->
        <tr><td style="padding:8px 32px 32px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9a8d84;">Evento agregado automáticamente a tu calendario</p>
        </td></tr>

      </table>

      <!-- Footer -->
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
        <tr><td style="padding:20px 0;text-align:center;">
          <p style="margin:0;font-size:11px;color:#9a8d84;letter-spacing:0.05em;">Goddess Studio · Melipilla, Chile</p>
        </td></tr>
      </table>

    </td></tr>
  </table>
</body>
</html>`,
              });
              console.log(`📧 Notification email sent to ${ownerEmail}`);
            } catch (emailError) {
              console.error('Error sending notification email:', emailError);
            }
          }
        }
      } catch (calError) {
        console.error('Error creating calendar event:', calError);
      }

      console.log(`✅ Payment approved for booking ${bookingId}`);
    } else if (payment.status === 'pending') {
      await sql`
        UPDATE bookings
        SET payment_id = ${paymentId}
        WHERE id = ${bookingId}
      `;
    } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
      await sql`
        UPDATE bookings
        SET status = 'cancelled'
        WHERE id = ${bookingId}
      `;
    }

    return res.status(200).end();
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(200).end();
  }
}
