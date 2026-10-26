import { randomBytes } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { NeonQueryFunction } from '@neondatabase/serverless';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticatorTransportFuture,
} from '@simplewebauthn/server';
import { isoBase64URL, isoUint8Array } from '@simplewebauthn/server/helpers';
import {
  agregarCookie,
  cookieSegura,
  cookieSesion,
  crearToken,
  exigirSesion,
  leerCookie,
} from '../auth.js';

type Sql = NeonQueryFunction<false, false>;

/**
 * Face ID / huella para entrar al panel (WebAuthn).
 *
 *   GET                                   → llaves activadas (para Ajustes)
 *   POST { accion: 'opciones-registro' }  → desafío para activar en este teléfono
 *   POST { accion: 'registrar', respuesta, aparato }
 *   POST { accion: 'opciones-entrada' }   → desafío para entrar
 *   POST { accion: 'entrar', respuesta }  → abre la sesión
 *   POST { accion: 'quitar' }             → desactiva en este teléfono
 *   POST { accion: 'quitar-llave', id }   → quita la de otro aparato (uno perdido)
 *
 * La biometría nunca sale del teléfono: la cara o la huella desbloquean una
 * llave privada guardada en el propio aparato, que firma un desafío. Acá
 * llega solo la firma, y se comprueba con la llave pública guardada al
 * activarla. Activar exige estar ya dentro con la contraseña; entrar no.
 */

const NOMBRE_PANEL = 'Goddess Studio';
const ID_DUENA = isoUint8Array.fromUTF8String('goddess-ignacia');

/** Qué llave es la de ESTE teléfono: así se le ofrece Face ID solo al suyo. */
const COOKIE_HUELLA = 'itb_huella';
const COOKIE_DESAFIO = 'itb_desafio';
const UN_ANIO = 400 * 24 * 3600;

/**
 * Dominio y orígenes válidos, a partir de la petición. En el dominio propio
 * la llave se ata a goddessstudio.cl, que cubre también www: activada en uno,
 * sirve en el otro. En localhost y en las vistas previas de Vercel se ata a
 * ese host, así se puede probar sin tocar la llave de producción.
 */
function dominioYOrigen(req: VercelRequest): { rpID: string; origenes: string[] } {
  const host = String(req.headers['x-forwarded-host'] ?? req.headers.host ?? 'localhost');
  const sinPuerto = host.split(':')[0];
  if (sinPuerto === 'goddessstudio.cl' || sinPuerto.endsWith('.goddessstudio.cl')) {
    return {
      rpID: 'goddessstudio.cl',
      origenes: ['https://goddessstudio.cl', 'https://www.goddessstudio.cl'],
    };
  }
  const local = sinPuerto === 'localhost' || sinPuerto === '127.0.0.1';
  return { rpID: sinPuerto, origenes: [`${local ? 'http' : 'https'}://${host}`] };
}

/**
 * Guarda el desafío de una ceremonia. Vive cinco minutos y se usa una vez:
 * si se pudiera reutilizar, una respuesta grabada serviría para volver a
 * entrar.
 */
async function guardarDesafio(sql: Sql, res: VercelResponse, desafio: string): Promise<void> {
  const id = randomBytes(16).toString('base64url');
  await sql`DELETE FROM admin_desafios WHERE vence_en < now()`;
  await sql`INSERT INTO admin_desafios (id, desafio, vence_en) VALUES (${id}, ${desafio}, now() + INTERVAL '5 minutes')`;
  agregarCookie(res, cookieSegura(COOKIE_DESAFIO, id, 300));
}

/** Toma el desafío y lo borra en el mismo paso. */
async function tomarDesafio(sql: Sql, req: VercelRequest, res: VercelResponse): Promise<string | null> {
  const id = leerCookie(req, COOKIE_DESAFIO);
  agregarCookie(res, cookieSegura(COOKIE_DESAFIO, '', 0));
  if (!id) return null;
  const [fila] = (await sql`
    DELETE FROM admin_desafios WHERE id = ${id} AND vence_en > now() RETURNING desafio
  `) as { desafio: string }[];
  return fila?.desafio ?? null;
}

interface Llave {
  id: string;
  llave_publica: string;
  contador: number;
  transportes: string[] | null;
}

async function llavePorId(sql: Sql, id: string | null): Promise<Llave | null> {
  if (!id) return null;
  const [fila] = (await sql`
    SELECT id, llave_publica, contador::INT AS contador, transportes FROM admin_llaves WHERE id = ${id}
  `) as Llave[];
  return fila ?? null;
}

const transportes = (t: string[] | null) => (t ?? undefined) as AuthenticatorTransportFuture[] | undefined;

/**
 * ¿Este teléfono tiene Face ID activado? Lo usa la sesión para decidir qué
 * ofrecer en la pantalla de acceso. Si la tabla aún no existe, responde que
 * no en vez de romper el acceso con contraseña.
 */
export async function hayHuellaEnEsteAparato(sql: Sql, req: VercelRequest): Promise<boolean> {
  try {
    return Boolean(await llavePorId(sql, leerCookie(req, COOKIE_HUELLA)));
  } catch {
    return false;
  }
}

export default async function acceso(req: VercelRequest, res: VercelResponse, sql: Sql) {
  const { rpID, origenes } = dominioYOrigen(req);
  const deEsteAparato = leerCookie(req, COOKIE_HUELLA);

  try {
    if (req.method === 'GET') {
      if (await exigirSesion(req, res)) return;
      const llaves = (await sql`
        SELECT id, aparato, creado_en, ultimo_uso FROM admin_llaves ORDER BY creado_en
      `) as { id: string; aparato: string | null; creado_en: string; ultimo_uso: string | null }[];
      /* El id de la llave no es secreto —es un identificador público de
         WebAuthn— y hace falta para quitar la de un teléfono perdido. */
      return res.status(200).json({
        llaves: llaves.map((l) => ({ ...l, esta: l.id === deEsteAparato })),
      });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ error: 'Método no permitido.' });
    }

    const { accion, ...cuerpo } = req.body ?? {};

    switch (accion) {
      case 'opciones-registro': {
        if (await exigirSesion(req, res)) return;
        const existentes = (await sql`SELECT id, transportes FROM admin_llaves`) as {
          id: string;
          transportes: string[] | null;
        }[];
        const opciones = await generateRegistrationOptions({
          rpName: NOMBRE_PANEL,
          rpID,
          userID: ID_DUENA,
          userName: 'ignacia',
          userDisplayName: 'Ignacia · Goddess Studio',
          attestationType: 'none',
          // Un teléfono que ya tiene llave no crea otra.
          excludeCredentials: existentes.map((l) => ({ id: l.id, transports: transportes(l.transportes) })),
          authenticatorSelection: {
            // La del propio teléfono (Face ID, Touch ID, huella), no una llave USB.
            authenticatorAttachment: 'platform',
            residentKey: 'preferred',
            userVerification: 'required',
          },
        });
        await guardarDesafio(sql, res, opciones.challenge);
        return res.status(200).json(opciones);
      }

      case 'registrar': {
        if (await exigirSesion(req, res)) return;
        const desafio = await tomarDesafio(sql, req, res);
        if (!desafio) return res.status(400).json({ error: 'Se acabó el tiempo. Vuelve a intentarlo.' });
        const verificacion = await verifyRegistrationResponse({
          response: cuerpo.respuesta,
          expectedChallenge: desafio,
          expectedOrigin: origenes,
          expectedRPID: rpID,
          requireUserVerification: true,
        });
        if (!verificacion.verified || !verificacion.registrationInfo) {
          return res.status(400).json({ error: 'No se pudo comprobar Face ID.' });
        }
        const { credential } = verificacion.registrationInfo;
        await sql`
          INSERT INTO admin_llaves (id, llave_publica, contador, transportes, aparato)
          VALUES (${credential.id}, ${isoBase64URL.fromBuffer(credential.publicKey)}, ${credential.counter},
                  ${credential.transports ?? null}, ${String(cuerpo.aparato ?? '').slice(0, 40) || null})
          ON CONFLICT (id) DO UPDATE SET llave_publica = EXCLUDED.llave_publica, contador = EXCLUDED.contador
        `;
        agregarCookie(res, cookieSegura(COOKIE_HUELLA, credential.id, UN_ANIO));
        return res.status(200).json({ ok: true });
      }

      case 'opciones-entrada': {
        // Sin sesión también: Face ID de este teléfono sirve para entrar.
        const llave = await llavePorId(sql, deEsteAparato);
        if (!llave) return res.status(404).json({ error: 'Este teléfono no tiene Face ID activado.' });
        const opciones = await generateAuthenticationOptions({
          rpID,
          allowCredentials: [{ id: llave.id, transports: transportes(llave.transportes) }],
          userVerification: 'required',
        });
        await guardarDesafio(sql, res, opciones.challenge);
        return res.status(200).json(opciones);
      }

      case 'entrar': {
        const llave = await llavePorId(sql, deEsteAparato);
        const desafio = await tomarDesafio(sql, req, res);
        if (!llave || !desafio || cuerpo.respuesta?.id !== llave.id) {
          return res.status(401).json({ error: 'No se pudo comprobar Face ID. Usa tu contraseña.' });
        }
        const verificacion = await verifyAuthenticationResponse({
          response: cuerpo.respuesta,
          expectedChallenge: desafio,
          expectedOrigin: origenes,
          expectedRPID: rpID,
          credential: {
            id: llave.id,
            publicKey: isoBase64URL.toBuffer(llave.llave_publica),
            counter: llave.contador,
            transports: transportes(llave.transportes),
          },
          requireUserVerification: true,
        });
        if (!verificacion.verified) {
          return res.status(401).json({ error: 'No se pudo comprobar Face ID. Usa tu contraseña.' });
        }
        await sql`
          UPDATE admin_llaves SET contador = ${verificacion.authenticationInfo.newCounter}, ultimo_uso = now()
          WHERE id = ${llave.id}
        `;
        agregarCookie(res, cookieSesion(await crearToken()));
        return res.status(200).json({ ok: true });
      }

      case 'quitar': {
        if (await exigirSesion(req, res)) return;
        if (deEsteAparato) await sql`DELETE FROM admin_llaves WHERE id = ${deEsteAparato}`;
        agregarCookie(res, cookieSegura(COOKIE_HUELLA, '', 0));
        return res.status(200).json({ ok: true });
      }

      case 'quitar-llave': {
        if (await exigirSesion(req, res)) return;
        const id = String(cuerpo.id ?? '');
        if (!id) return res.status(400).json({ error: 'Falta el aparato.' });
        await sql`DELETE FROM admin_llaves WHERE id = ${id}`;
        if (id === deEsteAparato) agregarCookie(res, cookieSegura(COOKIE_HUELLA, '', 0));
        return res.status(200).json({ ok: true });
      }

      default:
        return res.status(400).json({ error: 'Acción no reconocida.' });
    }
  } catch (error) {
    console.error('Error en el acceso del panel:', error);
    return res.status(500).json({ error: 'No se pudo completar. Intenta de nuevo.' });
  }
}
