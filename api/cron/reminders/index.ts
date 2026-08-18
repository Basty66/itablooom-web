import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { Resend } from 'resend';

const sql = neon(process.env.DATABASE_URL!);
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * GET /api/cron/reminders
 * Ejecutado por Vercel Cron cada hora.
 * Envía recordatorios por email 24h antes de cada cita confirmada.
 *
 * Seguridad: solo acepta requests del cron de Vercel o con un token secreto.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Solo GET
  if (req.method !== 'GET') return res.status(405).end();

  // Verificar que sea un cron job de Vercel o tenga el token
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  const isVercelCron = req.headers['x-vercel-cron'] === '1';
  const hasValidToken = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isVercelCron && !hasValidToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!resend) {
    console.error('RESEND_API_KEY no configurado, no se pueden enviar recordatorios');
    return res.status(200).json({ sent: 0, error: 'Email service not configured' });
  }

  try {
    // Buscar citas confirmadas que son en las próximas 24-26 horas
    // La columna reminder_sent puede no existir aún, manejamos ambos casos
    let bookings: any[];
    try {
      bookings = await sql`
        SELECT b.id, b.client_name, b.client_email, b.client_phone, b.booking_date, b.booking_time,
               s.name as service_name
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        WHERE b.status = 'confirmed'
          AND b.deposit_paid = true
          AND b.booking_date >= CURRENT_DATE
          AND b.booking_date <= CURRENT_DATE + INTERVAL '2 days'
          AND (b.reminder_sent IS NULL OR b.reminder_sent = false)
      `;
    } catch {
      // Si la columna reminder_sent no existe, buscar sin ella
      bookings = await sql`
        SELECT b.id, b.client_name, b.client_email, b.client_phone, b.booking_date, b.booking_time,
               s.name as service_name
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        WHERE b.status = 'confirmed'
          AND b.deposit_paid = true
          AND b.booking_date >= CURRENT_DATE
          AND b.booking_date <= CURRENT_DATE + INTERVAL '2 days'
      `;
    }

    let sentCount = 0;

    for (const booking of bookings) {
      const rawDate = booking.booking_date;
      let dateStr: string;
      if (typeof rawDate === 'string') {
        dateStr = rawDate.split('T')[0];
      } else if (rawDate instanceof Date) {
        const y = rawDate.getFullYear();
        const m = String(rawDate.getMonth() + 1).padStart(2, '0');
        const d = String(rawDate.getDate()).padStart(2, '0');
        dateStr = `${y}-${m}-${d}`;
      } else {
        dateStr = String(rawDate).split('T')[0];
      }

      const citaFecha = new Date(`${dateStr}T${booking.booking_time?.slice(0, 5) || '10:00'}:00`);
      const ahora = new Date();
      const horasHasta = (citaFecha.getTime() - ahora.getTime()) / (1000 * 60 * 60);

      // Solo enviar si faltan entre 20 y 28 horas (ventana de seguridad)
      if (horasHasta < 20 || horasHasta > 28) continue;

      const hora = booking.booking_time ? String(booking.booking_time).slice(0, 5) : '';
      const [y, m, d] = dateStr.split('-');
      const fecha = new Date(Number(y), Number(m) - 1, Number(d));
      const nombresDias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
      const nombresMeses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
      const fechaLinda = `${nombresDias[fecha.getDay()]} ${fecha.getDate()} de ${nombresMeses[fecha.getMonth()]}`;

      try {
        const ownerEmail = process.env.OWNER_EMAIL || 'cristianbastian.dev@gmail.com';

        // Resend gratis solo permite enviar al email de la cuenta.
        // El dueño recibe el recordatorio y lo reenvía por WhatsApp si quiere.
        await resend.emails.send({
          from: 'Itablooom <onboarding@resend.dev>',
          to: ownerEmail,
          subject: `Recordatorio: ${booking.client_name} tiene cita mañana a las ${hora}`,
          html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#faf6ef;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf6ef;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#fdfbf7;border-radius:24px;border:1px solid rgba(20,16,14,0.08);overflow:hidden;box-shadow:0 20px 60px -40px rgba(20,16,14,0.5);">

        <tr><td style="background-color:#14100e;padding:32px 32px 28px;text-align:center;">
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#e9b4b9;font-weight:500;">Itablooom Studio</p>
          <h1 style="margin:0;font-size:20px;font-weight:600;color:#faf6ef;">Cita mañana 📅</h1>
        </td></tr>

        <tr><td style="padding:28px 32px;text-align:center;">
          <div style="background-color:#fae8e9;border-radius:16px;padding:20px;margin-bottom:16px;">
            <p style="margin:0 0 4px;font-size:11px;color:#a34a55;text-transform:uppercase;letter-spacing:0.08em;">Cliente</p>
            <p style="margin:0;font-size:16px;font-weight:600;color:#14100e;">${booking.client_name}</p>
          </div>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:10px 0;text-align:center;border-bottom:1px solid rgba(20,16,14,0.06);">
                <p style="margin:0 0 2px;font-size:11px;color:#9a8d84;text-transform:uppercase;letter-spacing:0.08em;">Tratamiento</p>
                <p style="margin:0;font-size:14px;font-weight:600;color:#14100e;">${booking.service_name}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;text-align:center;border-bottom:1px solid rgba(20,16,14,0.06);">
                <p style="margin:0 0 2px;font-size:11px;color:#9a8d84;text-transform:uppercase;letter-spacing:0.08em;">Fecha</p>
                <p style="margin:0;font-size:14px;font-weight:600;color:#14100e;text-transform:capitalize;">${fechaLinda}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;text-align:center;">
                <p style="margin:0 0 2px;font-size:11px;color:#9a8d84;text-transform:uppercase;letter-spacing:0.08em;">Hora</p>
                <p style="margin:0;font-size:14px;font-weight:600;color:#14100e;">${hora}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;text-align:center;">
                <p style="margin:0 0 2px;font-size:11px;color:#9a8d84;text-transform:uppercase;letter-spacing:0.08em;">Teléfono</p>
                <p style="margin:0;font-size:14px;font-weight:600;color:#14100e;">${booking.client_phone || 'No registrado'}</p>
              </td>
            </tr>
          </table>

          <p style="margin:20px 0 0;font-size:13px;color:#7d7068;">Podés enviarle un recordatorio por WhatsApp desde el panel de administración.</p>
        </td></tr>

      </table>
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
        <tr><td style="padding:20px 0;text-align:center;">
          <p style="margin:0;font-size:11px;color:#9a8d84;">Itablooom Studio · Santiago, Chile</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
        });

        // Marcar como enviado (puede fallar si la columna no existe aún)
        try {
          await sql`UPDATE bookings SET reminder_sent = true WHERE id = ${booking.id}`;
        } catch {
          // Columna no existe aún, ignorar
        }
        sentCount++;
        console.log(`📧 Reminder sent to ${booking.client_email} for booking ${booking.id}`);
      } catch (err: any) {
        console.error(`Error sending reminder for booking ${booking.id}:`, err?.message);
      }
    }

    return res.status(200).json({ sent: sentCount, total: bookings.length });
  } catch (error) {
    console.error('Cron reminders error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
