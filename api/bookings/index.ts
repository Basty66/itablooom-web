import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { exigirSesion } from '../_shared/auth.js';

const sql = neon(process.env.DATABASE_URL!);

/**
 * GET ?id=   → una reserva. Público: lo consulta la clienta al volver del pago.
 *              Devuelve solo los campos de la confirmación; el resto (RUT,
 *              teléfono, correo, payment_id) no sale de acá.
 * GET ?date= → agenda del día. Solo con sesión: son datos de terceros.
 * PUT        → cambiar estado. Solo con sesión.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const { id, date } = req.query;

      if (id) {
        // Sin SELECT *: evita filtrar datos personales por una ruta abierta.
        const result = await sql`
          SELECT b.id, b.booking_date, b.booking_time, b.status, b.deposit_paid,
                 b.deposit_amount, b.total_amount, b.client_name,
                 s.name as service_name, s.description as service_description,
                 s.duration_minutes
          FROM bookings b
          JOIN services s ON b.service_id = s.id
          WHERE b.id = ${id as string}
        `;
        if (!result[0]) {
          return res.status(404).json({ error: 'Booking not found' });
        }
        return res.status(200).json(result[0]);
      }

      if (date) {
        if (await exigirSesion(req, res)) return;
        const result = await sql`
          SELECT b.*, s.name as service_name
          FROM bookings b
          JOIN services s ON b.service_id = s.id
          WHERE b.booking_date = ${date as string}
          ORDER BY b.booking_time
        `;
        return res.status(200).json(result);
      }

      return res.status(400).json({ error: 'Missing id or date parameter' });
    }

    if (req.method === 'PUT') {
      if (await exigirSesion(req, res)) return;

      const { id, status } = req.body;
      if (!id || !status) {
        return res.status(400).json({ error: 'Missing id or status' });
      }
      const validos = ['pending', 'confirmed', 'cancelled', 'completed'];
      if (!validos.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      await sql`UPDATE bookings SET status = ${status} WHERE id = ${id}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Bookings error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
