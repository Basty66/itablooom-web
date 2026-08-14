import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

/** Ruta pública de consulta: mismos campos acotados que `/api/bookings?id=`. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Missing booking id' });
    }

    // Sin SELECT *: esta ruta es accesible con solo conocer el id.
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
  } catch (error) {
    console.error('Error fetching booking:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
