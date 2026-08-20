import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { exigirSesion } from '../_shared/auth.js';
import { crearBloqueoCalendario, borrarEventoCalendario } from '../calendar/_lib.js';

const sql = neon(process.env.DATABASE_URL!);

/**
 * Bloqueos de agenda hechos desde el panel.
 *
 * Cada bloqueo se espeja como evento en Google Calendar y viceversa: los
 * eventos que Ignacia cree directamente en su calendario ya bloquean la web
 * desde `time-slots`. Así los dos lados quedan sincronizados sin que importe
 * dónde se hizo el bloqueo.
 *
 * GET ?date=  → bloqueos del día (con sesión)
 * POST        → crear bloqueo
 * DELETE ?id= → quitar bloqueo
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (await exigirSesion(req, res)) return;

  try {
    if (req.method === 'GET') {
      const { date } = req.query;
      if (!date) return res.status(400).json({ error: 'Falta la fecha' });

      const filas = await sql`
        SELECT id, date, time_start, time_end, reason
        FROM blocked_times
        WHERE date = ${date as string}
        ORDER BY time_start
      `;
      return res.status(200).json(filas);
    }

    if (req.method === 'POST') {
      const { date, timeStart, timeEnd, reason } = req.body || {};
      if (!date || !timeStart || !timeEnd) {
        return res.status(400).json({ error: 'Faltan fecha, hora de inicio o de término' });
      }
      if (String(timeStart) >= String(timeEnd)) {
        return res.status(400).json({ error: 'La hora de término debe ser posterior a la de inicio' });
      }

      // El espejo en Calendar puede fallar (permisos, caída de Google) y eso
      // no debe impedir el bloqueo: la web se rige por la tabla.
      const eventoId = await crearBloqueoCalendario({
        date,
        timeStart,
        timeEnd,
        motivo: reason || 'No disponible',
      });

      const [fila] = (await sql`
        INSERT INTO blocked_times (date, time_start, time_end, reason, calendar_event_id)
        VALUES (${date}, ${timeStart}, ${timeEnd}, ${reason || null}, ${eventoId})
        RETURNING id, date, time_start, time_end, reason
      `) as any[];

      return res.status(201).json({ ...fila, espejadoEnCalendario: Boolean(eventoId) });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Falta el id del bloqueo' });

      const [fila] = (await sql`
        DELETE FROM blocked_times WHERE id = ${id as string}
        RETURNING calendar_event_id
      `) as any[];

      if (!fila) return res.status(404).json({ error: 'Bloqueo no encontrado' });

      if (fila.calendar_event_id) await borrarEventoCalendario(fila.calendar_event_id);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error en /api/blocks:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
