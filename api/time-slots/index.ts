import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { date, serviceId } = req.query;

    if (!date || !serviceId) {
      return res.status(400).json({ error: 'Missing date or serviceId' });
    }

    const services = await sql`SELECT * FROM services WHERE id = ${serviceId as string}`;
    const service = services[0] as any;

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const blocked = await sql`SELECT time_start, time_end FROM blocked_times WHERE date = ${date as string}`;

    const existingBookings = await sql`
      SELECT booking_time, duration_minutes FROM bookings
      WHERE booking_date = ${date as string} AND status IN ('pending', 'confirmed')
    `;

    const slots = [];
    const startHour = 9;
    const endHour = 19;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const time = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

        const isBlocked = blocked.some((b: any) => {
          if (!b.time_start || !b.time_end) return false;
          return time >= b.time_start.slice(0, 5) && time < b.time_end.slice(0, 5);
        });

        const isBooked = existingBookings.some((b: any) => {
          const bookingTime = b.booking_time.slice(0, 5);
          const bookingDuration = b.duration_minutes || 60;
          const bookingEndMin =
            parseInt(bookingTime.split(':')[0]) * 60 +
            parseInt(bookingTime.split(':')[1]) +
            bookingDuration;
          const slotMin = hour * 60 + min;
          const slotEndMin = slotMin + service.duration_minutes;
          const bookingStartMin =
            parseInt(bookingTime.split(':')[0]) * 60 + parseInt(bookingTime.split(':')[1]);
          return slotMin < bookingEndMin && slotEndMin > bookingStartMin;
        });

        slots.push({
          time,
          available: !isBlocked && !isBooked,
        });
      }
    }

    return res.status(200).json(slots);
  } catch (error) {
    console.error('Error fetching time slots:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
