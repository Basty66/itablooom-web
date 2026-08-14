import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    const service = services[0] as Record<string, unknown>;

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const serviceDuration = (service.duration_minutes as number) || 60;

    const blocked = await sql`SELECT time_start, time_end FROM blocked_times WHERE date = ${date as string}`;

    const existingBookings = await sql`
      SELECT booking_time FROM bookings
      WHERE booking_date = ${date as string} AND status IN ('pending', 'confirmed')
    `;

    const bookedTimes = new Set(
      existingBookings.map((b: Record<string, unknown>) => {
        const t = b.booking_time as string;
        return t ? t.slice(0, 5) : null;
      }).filter(Boolean)
    );

    const slots = [];
    const startHour = 9;
    const endHour = 19;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const time = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
        const slotStartMin = hour * 60 + min;
        const slotEndMin = slotStartMin + serviceDuration;

        if (slotEndMin > endHour * 60) {
          slots.push({ time, available: false });
          continue;
        }

        const isBlocked = blocked.some((b: Record<string, unknown>) => {
          const start = b.time_start as string;
          const end = b.time_end as string;
          if (!start || !end) return false;
          const [sh, sm] = start.split(':').map(Number);
          const [eh, em] = end.split(':').map(Number);
          const blockStart = sh * 60 + sm;
          const blockEnd = eh * 60 + em;
          return slotStartMin < blockEnd && slotEndMin > blockStart;
        });

        let isBooked = false;
        for (const bTime of bookedTimes) {
          const [bh, bm] = (bTime as string).split(':').map(Number);
          const bookStart = bh * 60 + bm;
          const bookEnd = bookStart + 60;
          if (slotStartMin < bookEnd && slotEndMin > bookStart) {
            isBooked = true;
            break;
          }
        }

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
