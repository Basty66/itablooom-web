import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET /api/bookings?id=xxx  → booking por ID
    // GET /api/bookings?date=xxx → bookings por fecha
    // PUT /api/bookings → actualizar estado
    if (req.method === 'GET') {
      const { id, date } = req.query;

      if (id) {
        const result = await sql`
          SELECT b.*, s.name as service_name, s.description as service_description
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
      const { id, status } = req.body;
      if (!id || !status) {
        return res.status(400).json({ error: 'Missing id or status' });
      }
      const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
      if (!validStatuses.includes(status)) {
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
