import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { RESERVA_TTL_MINUTOS } from '../_shared/bookings.js';
import { getCalendarEvents } from '../calendar/_lib.js';

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

    // Traemos la duración real de cada reserva: sin ella, un servicio de 240 min
    // solo bloquearía la primera hora y se podrían reservar las otras tres encima.
    // Una `pending` solo retiene el cupo durante la ventana de pago; pasada esa
    // ventana el horario vuelve a estar disponible aunque siga marcada así.
    const existingBookings = await sql`
      SELECT b.booking_time, s.duration_minutes
      FROM bookings b JOIN services s ON b.service_id = s.id
      WHERE b.booking_date = ${date as string}
        AND (
          b.status = 'confirmed'
          OR (b.status = 'pending' AND b.created_at > NOW() - (${RESERVA_TTL_MINUTOS} * INTERVAL '1 minute'))
        )
    `;

    const bookedRanges = existingBookings
      .map((b: Record<string, unknown>) => {
        const t = b.booking_time as string;
        if (!t) return null;
        const [bh, bm] = t.slice(0, 5).split(':').map(Number);
        const start = bh * 60 + bm;
        return { start, end: start + ((b.duration_minutes as number) || 60) };
      })
      .filter(Boolean) as { start: number; end: number }[];

    // Bloquear slots que tienen eventos en el Google Calendar del dueño
    const calendarEvents = await getCalendarEvents(date as string);
    const calendarRanges = calendarEvents.map((ev) => {
      const startDate = new Date(ev.start);
      const endDate = new Date(ev.end);
      const startMin = startDate.getHours() * 60 + startDate.getMinutes();
      const endMin = endDate.getHours() * 60 + endDate.getMinutes();
      return { start: startMin, end: endMin };
    });

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

        const isBooked = bookedRanges.some(
          (b) => slotStartMin < b.end && slotEndMin > b.start
        );

        const isBusyOnCalendar = calendarRanges.some(
          (c) => slotStartMin < c.end && slotEndMin > c.start
        );

        slots.push({
          time,
          available: !isBlocked && !isBooked && !isBusyOnCalendar,
        });
      }
    }

    return res.status(200).json(slots);
  } catch (error) {
    console.error('Error fetching time slots:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
