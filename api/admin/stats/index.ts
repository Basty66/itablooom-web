import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { exigirSesion } from '../../_shared/auth.js';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  if (await exigirSesion(req, res)) return;

  try {
    const hoy = new Date().toISOString().split('T')[0];

    // Ingresos de los últimos 7 días
    const ingresosSemana = await sql`
      SELECT booking_date as date,
             SUM(total_amount) as total,
             COUNT(*) as count
      FROM bookings
      WHERE status = 'confirmed'
        AND deposit_paid = true
        AND booking_date >= (CURRENT_DATE - INTERVAL '6 days')
      GROUP BY booking_date
      ORDER BY booking_date
    `;

    // Ingresos del mes actual
    const ingresosMes = await sql`
      SELECT COALESCE(SUM(total_amount), 0) as total,
             COUNT(*) as count
      FROM bookings
      WHERE status = 'confirmed'
        AND deposit_paid = true
        AND booking_date >= date_trunc('month', CURRENT_DATE)
        AND booking_date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
    `;

    // Servicios más solicitados (todos los tiempos)
    const serviciosTop = await sql`
      SELECT s.name, COUNT(*) as count, SUM(b.total_amount) as revenue
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      WHERE b.status = 'confirmed'
      GROUP BY s.name
      ORDER BY count DESC
      LIMIT 5
    `;

    // Citas de hoy
    const citasHoy = await sql`
      SELECT COUNT(*) as total,
             COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
             COUNT(*) FILTER (WHERE status = 'pending') as pending
      FROM bookings
      WHERE booking_date = ${hoy}
    `;

    // Total clientes únicos
    const clientes = await sql`
      SELECT COUNT(DISTINCT client_email) as total
      FROM bookings
      WHERE status = 'confirmed'
    `;

    return res.status(200).json({
      ingresosSemana,
      ingresosMes: ingresosMes[0],
      serviciosTop,
      citasHoy: citasHoy[0],
      clientesTotales: (clientes[0] as any)?.total || 0,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
