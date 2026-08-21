import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { exigirSesion } from '../../_shared/auth.js';

const sql = neon(process.env.DATABASE_URL!);

const CATEGORIAS_GASTO = ['materiales', 'arriendo', 'servicios', 'publicidad', 'otros'] as const;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (await exigirSesion(req, res)) return;

  /*
   * Los gastos comparten endpoint con las estadísticas a propósito: Vercel
   * Hobby permite 12 funciones y quedarnos sin margen ya nos costó romper el
   * checkout una vez. Se distinguen por método.
   */
  try {
    if (req.method === 'POST') {
      const { descripcion, monto, categoria, fecha } = req.body || {};
      if (!descripcion || !monto) {
        return res.status(400).json({ error: 'Falta la descripción o el monto' });
      }
      const valor = Math.round(Number(monto));
      if (!Number.isFinite(valor) || valor <= 0) {
        return res.status(400).json({ error: 'El monto debe ser un número mayor que cero' });
      }
      const cat = CATEGORIAS_GASTO.includes(categoria) ? categoria : 'materiales';

      const [fila] = (await sql`
        INSERT INTO expenses (descripcion, monto, categoria, fecha)
        VALUES (${String(descripcion).slice(0, 200)}, ${valor}, ${cat},
                ${fecha || new Date().toISOString().slice(0, 10)})
        RETURNING id, fecha, descripcion, monto, categoria
      `) as any[];
      return res.status(201).json(fila);
    }

    if (req.method === 'DELETE') {
      const { gastoId } = req.query;
      if (!gastoId) return res.status(400).json({ error: 'Falta el id del gasto' });
      const borrado = await sql`DELETE FROM expenses WHERE id = ${gastoId as string} RETURNING id`;
      if (!borrado.length) return res.status(404).json({ error: 'Gasto no encontrado' });
      return res.status(200).json({ ok: true });
    }
  } catch (error) {
    console.error('Error en gastos:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  /*
   * INGRESO REAL = lo que efectivamente entró a caja, no el precio del
   * servicio. Si la clienta solo abonó, entró el abono; el resto se cobra
   * el día de la cita. Sumar total_amount inflaba las cifras: dos abonos de
   * $5.000 sobre servicios de $16.000 y $20.000 se mostraban como $36.000.
   *
   * `status <> 'cancelled'` en vez de `= 'confirmed'`: una cita completada o
   * un no-show también dejaron dinero en caja.
   */
  const COBRADO = "CASE WHEN remaining_paid THEN total_amount ELSE deposit_amount END";

  try {
    const hoy = new Date().toISOString().split('T')[0];

    // Ingresos de los últimos 7 días
    const ingresosSemana = await sql.query(
      `SELECT booking_date AS date,
              SUM(${COBRADO}) AS total,
              COUNT(*) AS count
       FROM bookings
       WHERE deposit_paid = true
         AND status <> 'cancelled'
         AND booking_date >= (CURRENT_DATE - INTERVAL '6 days')
       GROUP BY booking_date
       ORDER BY booking_date`
    );

    // Ingresos del mes actual
    const ingresosMes = await sql.query(
      `SELECT COALESCE(SUM(${COBRADO}), 0) AS total,
              COUNT(*) AS count,
              COALESCE(SUM(CASE WHEN NOT remaining_paid AND status <> 'no_show' THEN total_amount - deposit_amount ELSE 0 END), 0) AS por_cobrar
       FROM bookings
       WHERE deposit_paid = true
         AND status <> 'cancelled'
         AND booking_date >= date_trunc('month', CURRENT_DATE)
         AND booking_date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'`
    );

    // Cómo entró la plata del mes: sirve para cuadrar caja.
    const porMetodo = await sql.query(
      `SELECT
         COALESCE(SUM(deposit_amount), 0) AS mercadopago,
         COALESCE(SUM(CASE WHEN remaining_paid_method = 'cash' THEN total_amount - deposit_amount ELSE 0 END), 0) AS efectivo,
         COALESCE(SUM(CASE WHEN remaining_paid_method = 'transfer' THEN total_amount - deposit_amount ELSE 0 END), 0) AS transferencia,
         COALESCE(SUM(CASE WHEN remaining_paid_method = 'mp' THEN total_amount - deposit_amount ELSE 0 END), 0) AS saldo_mp,
         COUNT(*) FILTER (WHERE status = 'no_show') AS no_shows
       FROM bookings
       WHERE deposit_paid = true
         AND status <> 'cancelled'
         AND booking_date >= date_trunc('month', CURRENT_DATE)
         AND booking_date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'`
    );

    // Servicios más solicitados (todos los tiempos)
    const serviciosTop = await sql.query(
      `SELECT s.name, COUNT(*) AS count,
              SUM(CASE WHEN b.remaining_paid THEN b.total_amount ELSE b.deposit_amount END) AS revenue
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       WHERE b.deposit_paid = true AND b.status <> 'cancelled'
       GROUP BY s.name
       ORDER BY count DESC
       LIMIT 5`
    );

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

    // Gastos del mes en curso, para calcular lo que queda de verdad.
    const gastosMes = await sql`
      SELECT COALESCE(SUM(monto), 0)::int AS total
      FROM expenses
      WHERE fecha >= date_trunc('month', CURRENT_DATE)
        AND fecha < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
    `;

    const gastos = await sql`
      SELECT id, fecha, descripcion, monto, categoria
      FROM expenses
      WHERE fecha >= date_trunc('month', CURRENT_DATE)
      ORDER BY fecha DESC, created_at DESC
      LIMIT 30
    `;

    return res.status(200).json({
      gastosMes: (gastosMes[0] as any).total,
      gastos,
      ingresosSemana,
      ingresosMes: ingresosMes[0],
      porMetodo: porMetodo[0],
      serviciosTop,
      citasHoy: citasHoy[0],
      clientesTotales: (clientes[0] as any)?.total || 0,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
