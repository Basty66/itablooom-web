import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { NeonQueryFunction } from '@neondatabase/serverless';
import { exigirSesion } from '../auth.js';
import { HAY_AVISOS, LLAVE_PUBLICA, avisar } from '../avisos.js';

type Sql = NeonQueryFunction<false, false>;

/**
 * Avisos push del panel.
 *
 *   GET                                      → llave pública VAPID
 *   POST { accion: 'suscribir', suscripcion, aparato }
 *   POST { accion: 'quitar', endpoint }
 *   POST { accion: 'probar', endpoint }      → aviso de prueba a ese aparato
 *
 * La llave pública viaja desde acá y no en el build: así cambiarla en Vercel
 * no exige recompilar, y el panel se entera en la próxima apertura.
 */
export default async function avisos(req: VercelRequest, res: VercelResponse, sql: Sql) {
  if (await exigirSesion(req, res)) return;

  try {
    if (req.method === 'GET') {
      return res.status(200).json({ llave: LLAVE_PUBLICA, disponibles: HAY_AVISOS });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ error: 'Método no permitido.' });
    }

    const { accion, ...cuerpo } = req.body ?? {};

    switch (accion) {
      case 'suscribir': {
        const s = cuerpo.suscripcion as { endpoint?: string; keys?: { p256dh?: string; auth?: string } } | undefined;
        if (!s?.endpoint || !s.keys?.p256dh || !s.keys?.auth || !/^https:\/\//.test(s.endpoint)) {
          return res.status(400).json({ error: 'Suscripción incompleta.' });
        }
        await sql`
          INSERT INTO admin_suscripciones (endpoint, p256dh, auth, aparato)
          VALUES (${s.endpoint}, ${s.keys.p256dh}, ${s.keys.auth}, ${String(cuerpo.aparato ?? '').slice(0, 40) || null})
          ON CONFLICT (endpoint) DO UPDATE SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, aparato = EXCLUDED.aparato
        `;
        return res.status(200).json({ ok: true });
      }

      case 'quitar': {
        if (cuerpo.endpoint) await sql`DELETE FROM admin_suscripciones WHERE endpoint = ${String(cuerpo.endpoint)}`;
        return res.status(200).json({ ok: true });
      }

      case 'probar': {
        if (!cuerpo.endpoint) return res.status(400).json({ error: 'Falta el aparato.' });
        const resultado = await avisar(
          sql,
          {
            titulo: 'Avisos activados',
            cuerpo: 'Así te llegarán las reservas nuevas y el resumen de cada mañana.',
            tag: 'prueba',
          },
          String(cuerpo.endpoint)
        );
        return res.status(200).json(resultado);
      }

      default:
        return res.status(400).json({ error: 'Acción no reconocida.' });
    }
  } catch (error) {
    console.error('Error en los avisos del panel:', error);
    return res.status(500).json({ error: 'No se pudo completar. Intenta de nuevo.' });
  }
}
