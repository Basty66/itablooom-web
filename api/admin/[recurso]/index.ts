import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import sesion from '../../_shared/panel/sesion.js';
import estadisticas from '../../_shared/panel/estadisticas.js';
import acceso from '../../_shared/panel/acceso.js';
import avisos from '../../_shared/panel/avisos.js';
import { asegurarTablas } from '../../_shared/panel/tablas.js';

const sql = neon(process.env.DATABASE_URL!);

/**
 * Todo el panel en una sola función: /api/admin/session, /stats, /acceso y
 * /avisos.
 *
 * Vercel Hobby permite 12 funciones por despliegue y el sitio ya usaba las
 * 12. Sumar Face ID y avisos como funciones propias habría hecho fallar el
 * despliegue entero; juntas en una ruta dinámica, el sitio queda en 11 y las
 * URLs de siempre siguen funcionando.
 */
const RECURSOS = { session: sesion, stats: estadisticas, acceso, avisos };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  const recurso = String(req.query.recurso ?? '') as keyof typeof RECURSOS;
  const manejar = RECURSOS[recurso];
  if (!manejar) return res.status(404).json({ error: 'No existe.' });
  // Face ID y avisos usan tablas propias; la sesión también las consulta.
  if (recurso !== 'stats') {
    try {
      await asegurarTablas(sql);
    } catch (error) {
      console.error('No se pudieron preparar las tablas del panel:', error);
    }
  }
  return manejar(req, res, sql);
}
