import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Sesión de administración.
 *
 * El token es `payload.firma`, donde la firma es un HMAC-SHA256 del payload
 * con SESSION_SECRET. Sin el secreto no se puede fabricar uno válido, y como
 * la expiración va dentro del payload firmado, tampoco se puede extender.
 *
 * Usa WebCrypto global: sin dependencias y compatible con Node y Edge.
 */

const COOKIE = 'itb_admin';

/*
 * Duración de la sesión.
 *
 * Con 12 horas había que escribir la contraseña casi a diario, y el panel se
 * usa desde el teléfono varias veces al día —para cobrar un saldo o mirar la
 * agenda entre clienta y clienta—, así que esa fricción terminaba en una
 * contraseña más corta o anotada en cualquier parte.
 *
 * Treinta días es el equilibrio para un dispositivo personal con bloqueo de
 * pantalla. La cookie sigue siendo HttpOnly y firmada, y "Salir" la borra en
 * el acto si el teléfono se pierde.
 */
const DURACION_HORAS = 24 * 30;

function b64url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function desdeB64url(s: string): Uint8Array {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function utf8(texto: string): ArrayBuffer {
  const u8 = new TextEncoder().encode(texto);
  const out = new Uint8Array(new ArrayBuffer(u8.length));
  out.set(u8);
  return out.buffer;
}

function secreto(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error('SESSION_SECRET no configurado o demasiado corto (mínimo 32 caracteres).');
  }
  return s;
}

async function firmar(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    utf8(secreto()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const firma = await crypto.subtle.sign('HMAC', key, utf8(payload));
  return b64url(new Uint8Array(firma));
}

/**
 * Comparación en tiempo constante: comparar con === filtra información por el
 * tiempo de respuesta y permite adivinar la clave carácter a carácter.
 */
function igualdadSegura(a: string, b: string): boolean {
  const ba = new TextEncoder().encode(a);
  const bb = new TextEncoder().encode(b);
  if (ba.length !== bb.length) return false;
  let dif = 0;
  for (let i = 0; i < ba.length; i++) dif |= ba[i] ^ bb[i];
  return dif === 0;
}

export function verificarPassword(entrada: string): boolean {
  const esperada = process.env.ADMIN_PASSWORD;
  if (!esperada) throw new Error('ADMIN_PASSWORD no configurado.');
  return igualdadSegura(entrada, esperada);
}

export async function crearToken(): Promise<string> {
  const payload = b64url(
    new TextEncoder().encode(
      JSON.stringify({ exp: Date.now() + DURACION_HORAS * 3600_000 })
    )
  );
  return `${payload}.${await firmar(payload)}`;
}

async function tokenValido(token: string): Promise<boolean> {
  const [payload, firma] = token.split('.');
  if (!payload || !firma) return false;
  if (!igualdadSegura(firma, await firmar(payload))) return false;

  try {
    const { exp } = JSON.parse(new TextDecoder().decode(desdeB64url(payload)));
    return typeof exp === 'number' && Date.now() < exp;
  } catch {
    return false;
  }
}

export function cookieSesion(token: string): string {
  // HttpOnly: inaccesible desde JavaScript, así un XSS no puede robar la sesión.
  // SameSite=Strict: no viaja en peticiones desde otros sitios (anti-CSRF).
  return `${COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${DURACION_HORAS * 3600}`;
}

export function cookieCierre(): string {
  return `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

export async function haySesion(req: VercelRequest): Promise<boolean> {
  const cookies = req.headers.cookie || '';
  const encontrada = cookies
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE}=`));
  if (!encontrada) return false;
  return tokenValido(encontrada.slice(COOKIE.length + 1));
}

/**
 * Corta la petición con 401 si no hay sesión. Devuelve true si ya respondió,
 * para que el handler haga `if (await exigirSesion(req, res)) return;`.
 */
export async function exigirSesion(req: VercelRequest, res: VercelResponse): Promise<boolean> {
  if (await haySesion(req)) return false;
  res.status(401).json({ error: 'No autorizado' });
  return true;
}
