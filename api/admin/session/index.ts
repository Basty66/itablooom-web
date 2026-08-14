import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verificarPassword, crearToken, cookieSesion, cookieCierre, haySesion } from '../../_shared/auth.js';

/**
 * GET    -> ¿hay sesión activa?
 * POST   -> iniciar sesión con la contraseña
 * DELETE -> cerrar sesión
 *
 * La contraseña nunca vuelve al cliente y el token viaja solo en una cookie
 * HttpOnly, así que el JavaScript de la página jamás lo ve.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({ activa: await haySesion(req) });
  }

  if (req.method === 'POST') {
    try {
      const { password } = req.body || {};
      if (typeof password !== 'string' || password.length === 0) {
        return res.status(400).json({ error: 'Falta la contraseña' });
      }

      if (!verificarPassword(password)) {
        // Retraso corto: encarece la fuerza bruta sin molestar al uso normal.
        await new Promise((r) => setTimeout(r, 600));
        return res.status(401).json({ error: 'Contraseña incorrecta' });
      }

      res.setHeader('Set-Cookie', cookieSesion(await crearToken()));
      return res.status(200).json({ activa: true });
    } catch (error: any) {
      // Falta de configuración (SESSION_SECRET/ADMIN_PASSWORD): no es culpa del usuario.
      console.error('Error de login:', error?.message);
      return res.status(500).json({ error: 'Autenticación mal configurada en el servidor' });
    }
  }

  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', cookieCierre());
    return res.status(200).json({ activa: false });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
