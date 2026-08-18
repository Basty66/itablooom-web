import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { createCalendarEvent } from '../../calendar/_lib.js';
import { Resend } from 'resend';

const sql = neon(process.env.DATABASE_URL!);
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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
    const bookingId = payment.external_reference;

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
            payment_id = ${paymentId}
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
              await resend.emails.send({
                from: 'Itablooom <onboarding@resend.dev>',
                to: ownerEmail,
                subject: `🆕 Nueva reserva: ${booking.service_name} - ${booking.client_name}`,
                html: `
                  <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
                    <h2 style="color: #14100e;">Nueva cita agendada</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr><td style="padding: 8px 0; color: #7d7068;">Tratamiento</td><td style="padding: 8px 0; font-weight: 600;">${booking.service_name}</td></tr>
                      <tr><td style="padding: 8px 0; color: #7d7068;">Cliente</td><td style="padding: 8px 0; font-weight: 600;">${booking.client_name}</td></tr>
                      <tr><td style="padding: 8px 0; color: #7d7068;">Fecha</td><td style="padding: 8px 0; font-weight: 600;">${dateStr}</td></tr>
                      <tr><td style="padding: 8px 0; color: #7d7068;">Hora</td><td style="padding: 8px 0; font-weight: 600;">${timeStr}</td></tr>
                      <tr><td style="padding: 8px 0; color: #7d7068;">Teléfono</td><td style="padding: 8px 0; font-weight: 600;">${booking.client_phone}</td></tr>
                      <tr><td style="padding: 8px 0; color: #7d7068;">Email</td><td style="padding: 8px 0; font-weight: 600;">${booking.client_email}</td></tr>
                      <tr><td style="padding: 8px 0; color: #7d7068;">Pagado</td><td style="padding: 8px 0; font-weight: 600;">$${Number(booking.total_amount).toLocaleString('es-CL')}</td></tr>
                    </table>
                    <a href="https://itablooom-web.vercel.app/admin" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #14100e; color: #faf6ef; text-decoration: none; border-radius: 999px; font-weight: 500;">Ver en el panel</a>
                  </div>
                `,
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
