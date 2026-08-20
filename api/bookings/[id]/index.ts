import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { exigirSesion } from '../../_shared/auth.js';

const sql = neon(process.env.DATABASE_URL!);

const METODOS_PAGO = ['mp', 'cash', 'transfer'] as const;
type MetodoPago = (typeof METODOS_PAGO)[number];

/**
 * GET               → consulta pública de la reserva (la usa la confirmación).
 * PUT ?action=...   → acciones de gestión, todas con sesión de administración.
 *
 * Las acciones van por query y no en archivos separados a propósito: Vercel
 * Hobby permite 12 funciones y ya estábamos en el tope. Cada acción nueva en
 * su propio archivo habría roto el deploy.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const id = req.query.id as string;
  if (!id) return res.status(400).json({ error: 'Falta el id de la reserva' });

  try {
    if (req.method === 'GET') {
      // Sin SELECT *: esta ruta es accesible con solo conocer el id.
      const result = await sql`
        SELECT b.id, b.booking_date, b.booking_time, b.status, b.deposit_paid,
               b.deposit_amount, b.total_amount, b.remaining_paid, b.client_name,
               s.name as service_name, s.description as service_description,
               s.duration_minutes
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        WHERE b.id = ${id}
      `;
      if (!result[0]) return res.status(404).json({ error: 'Booking not found' });
      return res.status(200).json(result[0]);
    }

    if (req.method === 'PUT') {
      if (await exigirSesion(req, res)) return;

      const accion = req.query.action as string;

      // ---- Registrar el pago del saldo pendiente ----
      if (accion === 'remaining-payment') {
        const { method } = req.body || {};
        if (!METODOS_PAGO.includes(method as MetodoPago)) {
          return res.status(400).json({ error: `Método inválido. Usa: ${METODOS_PAGO.join(', ')}` });
        }

        const [reserva] = (await sql`
          SELECT total_amount, deposit_amount, remaining_paid FROM bookings WHERE id = ${id}
        `) as any[];
        if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });
        if (reserva.remaining_paid) {
          return res.status(409).json({ error: 'El saldo ya figura como pagado' });
        }

        // El saldo se calcula, no se guarda: guardado se desincroniza si el
        // precio del servicio cambia después de la reserva.
        const saldo = Number(reserva.total_amount) - Number(reserva.deposit_amount);

        await sql`
          UPDATE bookings
          SET remaining_paid = true,
              remaining_paid_method = ${method},
              remaining_paid_at = NOW(),
              status = 'completed',
              updated_at = NOW()
          WHERE id = ${id}
        `;
        return res.status(200).json({ ok: true, saldoCobrado: saldo, metodo: method });
      }

      // ---- Marcar inasistencia ----
      if (accion === 'no-show') {
        const [reserva] = (await sql`SELECT status FROM bookings WHERE id = ${id}`) as any[];
        if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });
        if (reserva.status === 'completed') {
          return res.status(409).json({ error: 'La cita ya figura como completada' });
        }

        // El depósito no se devuelve: queda como ingreso y el horario se libera.
        await sql`
          UPDATE bookings
          SET status = 'no_show', no_show_at = NOW(), updated_at = NOW()
          WHERE id = ${id}
        `;
        return res.status(200).json({ ok: true });
      }

      // ---- Cambiar estado a mano ----
      if (accion === 'status') {
        const { status } = req.body || {};
        const validos = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'];
        if (!validos.includes(status)) {
          return res.status(400).json({ error: 'Estado inválido' });
        }
        await sql`UPDATE bookings SET status = ${status}, updated_at = NOW() WHERE id = ${id}`;
        return res.status(200).json({ ok: true });
      }

      return res.status(400).json({ error: 'Acción no reconocida' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error en /api/bookings/[id]:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
