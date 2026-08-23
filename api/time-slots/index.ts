import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { RESERVA_TTL_MINUTOS, HORARIO, PASO_MINUTOS, COLCHON_MINUTOS, minutosDesdeISO } from '../_shared/bookings.js';
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

    /*
     * Postgres lanza un error de casteo si el id no tiene forma de UUID, y eso
     * derribaba la función con un 500 en vez de un error legible. Validamos
     * antes de consultar.
     */
    const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID.test(String(serviceId))) {
      return res.status(400).json({ error: 'serviceId inválido' });
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
        // La cita ocupa su duración más el colchón: así la siguiente no
        // puede empezar en el minuto exacto en que termina la anterior.
        return { start, end: start + ((b.duration_minutes as number) || 60) + COLCHON_MINUTOS };
      })
      .filter(Boolean) as { start: number; end: number }[];

    // Bloquear slots que tienen eventos en el Google Calendar del dueño
    const calendarEvents = await getCalendarEvents(date as string);
    // Nada de new Date().getHours(): eso devolvía la hora en UTC del servidor
    // y desplazaba los bloqueos cuatro horas respecto de Chile.
    const calendarRanges = calendarEvents
      .map((ev) => {
        const start = minutosDesdeISO(ev.start);
        const end = minutosDesdeISO(ev.end);
        return start !== null && end !== null ? { start, end } : null;
      })
      .filter(Boolean) as { start: number; end: number }[];

    // El horario depende del día: sábado cierra antes y domingo no se atiende.
    // Sin esto la API aceptaba reservas de domingo aunque el calendario del
    // frontend las deshabilitara.
    const [anio, mes, dia] = (date as string).split('-').map(Number);
    const diaSemana = new Date(anio, mes - 1, dia).getDay();
    const horario = HORARIO[diaSemana];

    if (!horario) return res.status(200).json([]);

    const slots = [];
    const { abre: startHour, cierra: endHour } = horario;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let min = 0; min < 60; min += PASO_MINUTOS) {
        const time = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
        const slotStartMin = hour * 60 + min;
        // Para chocar con otras citas se cuenta el colchón; para el cierre no,
        // porque después de la última del día no hay a quién recibir.
        const slotEndMin = slotStartMin + serviceDuration;
        const slotEndConColchon = slotStartMin + serviceDuration + COLCHON_MINUTOS;

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
          (b) => slotStartMin < b.end && slotEndConColchon > b.start
        );

        const isBusyOnCalendar = calendarRanges.some(
          (c) => slotStartMin < c.end && slotEndConColchon > c.start
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
