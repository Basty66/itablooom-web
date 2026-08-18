import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

/**
 * POST /api/reschedule
 * Body: { bookingId, email, newDate, newTime }
 *
 * Reglas:
 * - La reserva debe existir y estar confirmada
 * - El email debe coincidir con el del cliente
 * - Debe faltar mínimo 24h para la cita original
 * - El nuevo horario debe estar disponible
 * - No se puede reagendar a una fecha pasada
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { bookingId, email, newDate, newTime } = req.body || {};

    if (!bookingId || !email || !newDate || !newTime) {
      return res.status(400).json({ error: 'Faltan campos: bookingId, email, newDate, newTime' });
    }

    // Buscar la reserva
    const bookings = await sql`
      SELECT b.*, s.duration_minutes, s.name as service_name
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      WHERE b.id = ${bookingId}
    `;
    const booking = bookings[0] as Record<string, unknown> | undefined;

    if (!booking) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    // Verificar que el email coincida
    if (booking.client_email !== email) {
      return res.status(403).json({ error: 'El email no coincide con la reserva' });
    }

    // Solo se puede reagendar reservas confirmadas
    if (booking.status !== 'confirmed') {
      return res.status(400).json({ error: 'Solo se pueden reagendar reservas confirmadas' });
    }

    // Verificar anticipación mínima de 24h
    const originalDate = String(booking.booking_date).split('T')[0];
    const originalTime = String(booking.booking_time).slice(0, 5);
    const fechaOriginal = new Date(`${originalDate}T${originalTime}:00`);
    const ahora = new Date();
    const horasDeAnticipacion = (fechaOriginal.getTime() - ahora.getTime()) / (1000 * 60 * 60);

    if (horasDeAnticipacion < 24) {
      return res.status(400).json({
        error: 'Debés reagendar con al menos 24 horas de anticipación. Para este caso, contactanos por WhatsApp.',
      });
    }

    // Verificar que la nueva fecha no sea pasada
    const fechaNueva = new Date(`${newDate}T${newTime}:00`);
    if (fechaNueva <= ahora) {
      return res.status(400).json({ error: 'La nueva fecha no puede ser en el pasado' });
    }

    // Verificar que el nuevo horario esté disponible
    const duration = (booking.duration_minutes as number) || 60;
    const conflictos = await sql`
      SELECT b.id FROM bookings b
      WHERE b.booking_date = ${newDate}
        AND b.id != ${bookingId}
        AND b.status IN ('confirmed', 'pending')
        AND (
          (b.booking_time, (b.booking_time + (SELECT s.duration_minutes || ' minutes' FROM services s WHERE s.id = b.service_id)::interval))
          OVERLAPS
          (${newTime}::time, (${newTime}::time + ${duration} * INTERVAL '1 minute'))
        )
    `;

    if (conflictos.length > 0) {
      return res.status(409).json({ error: 'Ese horario ya está ocupado. Elegí otro.' });
    }

    // Actualizar la reserva
    await sql`
      UPDATE bookings
      SET booking_date = ${newDate}, booking_time = ${newTime}
      WHERE id = ${bookingId}
    `;

    return res.status(200).json({
      ok: true,
      message: 'Reserva reagendada exitosamente',
      newDate,
      newTime,
    });
  } catch (error) {
    console.error('Reschedule error:', error);
    return res.status(500).json({ error: 'Error al reagendar' });
  }
}
