/**
 * Cliente de Google Calendar sin la librería `googleapis`.
 *
 * `googleapis` pesa ~208 MB en node_modules y revienta el límite de 250 MB
 * de una función serverless en Vercel: la función muere al cargar el módulo
 * y devuelve 500 con body vacío (FUNCTION_INVOCATION_FAILED).
 *
 * Acá firmamos el JWT RS256 a mano con WebCrypto (`globalThis.crypto.subtle`,
 * disponible en Node 20+ y en Edge) y pegamos a la REST API con `fetch`.
 * Cero imports: ni `crypto`, ni `googleapis`, ni nada de Node.
 */

const SCOPE = 'https://www.googleapis.com/auth/calendar';
const TOKEN_URI = 'https://oauth2.googleapis.com/token';
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

export type ServiceAccount = {
  client_email: string;
  private_key: string;
};

/** Vercel a veces guarda los valores con comillas envolventes y \n escapados. */
function normalizeKey(key: string): string {
  return key.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
}

/**
 * Acepta varios formatos porque el PEM crudo en una env var se rompe fácil
 * (los saltos de línea no sobreviven al dashboard). El base64 del JSON completo
 * es el único que no da problemas: es una sola línea sin caracteres especiales.
 */
export function loadServiceAccount(): ServiceAccount {
  const b64 = process.env.GOOGLE_SA_JSON_B64;
  if (b64) {
    const parsed = JSON.parse(atob(b64.trim()));
    return { client_email: parsed.client_email, private_key: normalizeKey(parsed.private_key) };
  }

  const raw = process.env.GOOGLE_SA_JSON;
  if (raw) {
    const parsed = JSON.parse(raw);
    return { client_email: parsed.client_email, private_key: normalizeKey(parsed.private_key) };
  }

  const email = process.env.GOOGLE_SA_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;
  if (email && key) {
    return { client_email: email.trim(), private_key: normalizeKey(key) };
  }

  throw new Error(
    'Faltan las credenciales de Google. Definí GOOGLE_SA_JSON_B64 (base64 del JSON de la service account).'
  );
}

/**
 * Devolvemos ArrayBuffer y no Uint8Array a propósito: desde TS 5.7 `Uint8Array`
 * es genérico y `Uint8Array<ArrayBufferLike>` no es asignable a `BufferSource`,
 * así que WebCrypto lo rechaza en tiempo de compilación.
 */
function pemToPkcs8(pem: string): ArrayBuffer {
  const body = pem
    .replace(/-----BEGIN [^-]+-----/, '')
    .replace(/-----END [^-]+-----/, '')
    .replace(/\s+/g, '');
  const bin = atob(body);
  const buf = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

/** Igual que arriba: WebCrypto necesita un ArrayBuffer concreto. */
function utf8(text: string): ArrayBuffer {
  const u8 = new TextEncoder().encode(text);
  const out = new Uint8Array(new ArrayBuffer(u8.length));
  out.set(u8);
  return out.buffer;
}

function b64url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlText(text: string): string {
  return b64url(new TextEncoder().encode(text));
}

// El token vive 1h; lo cacheamos para no pedir uno nuevo en cada invocación warm.
let cachedToken: { value: string; expiresAt: number } | null = null;

export async function getAccessToken(sa: ServiceAccount = loadServiceAccount()): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.value;

  const now = Math.floor(Date.now() / 1000);
  const header = b64urlText(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64urlText(
    JSON.stringify({
      iss: sa.client_email,
      scope: SCOPE,
      aud: TOKEN_URI,
      iat: now,
      exp: now + 3600,
    })
  );
  const signingInput = `${header}.${claims}`;

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToPkcs8(sa.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, utf8(signingInput));
  const jwt = `${signingInput}.${b64url(new Uint8Array(signature))}`;

  const res = await fetch(TOKEN_URI, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const data = (await res.json()) as { access_token?: string; expires_in?: number; error_description?: string; error?: string };
  if (!res.ok || !data.access_token) {
    throw new Error(`OAuth falló (${res.status}): ${data.error_description || data.error || 'sin detalle'}`);
  }

  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 - 60_000,
  };
  return cachedToken.value;
}

/**
 * Devuelve "2026-08-20T10:00:00" (wall clock, sin offset). Google lo interpreta
 * con el `timeZone` que le mandamos al lado.
 *
 * Ojo: NO usar `new Date(...).toISOString()` acá. El server corre en UTC, así
 * que interpretaría "10:00" como UTC y la cita quedaría corrida 3-4 horas
 * respecto a Chile. Forzamos UTC con la `Z` y formateamos sin ella, así la
 * aritmética de minutos es exacta y el wall clock se mantiene.
 */
function wallClock(date: string, time: string, offsetMinutes = 0): string {
  const base = new Date(`${date}T${time}:00Z`);
  if (Number.isNaN(base.getTime())) throw new Error(`Fecha/hora inválida: ${date} ${time}`);
  return new Date(base.getTime() + offsetMinutes * 60_000).toISOString().slice(0, 19);
}

export type CalendarEventInput = {
  summary: string;
  description?: string;
  date: string;
  time: string;
  durationMinutes: number;
  clientEmail: string;
  clientName: string;
};

export async function createCalendarEvent(data: CalendarEventInput): Promise<string | null> {
  const { summary, description, date, time, durationMinutes, clientEmail, clientName } = data;
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'cristianbastian.dev@gmail.com';
  const timeZone = process.env.GOOGLE_CALENDAR_TZ || 'America/Santiago';

  const event = {
    summary,
    // Una service account sin Domain-Wide Delegation no puede invitar attendees
    // (Google devuelve 403), así que el mail del cliente va en la descripción.
    description: description || `Cita de ${clientName} (${clientEmail}) - ${summary}`,
    start: { dateTime: wallClock(date, time), timeZone },
    end: { dateTime: wallClock(date, time, durationMinutes), timeZone },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 30 },
      ],
    },
  };

  try {
    const token = await getAccessToken();
    const res = await fetch(`${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    const body = (await res.json()) as { id?: string; error?: { message?: string } };
    if (!res.ok) {
      console.error('Google Calendar API error:', res.status, body?.error?.message || body);
      return null;
    }
    return body.id || null;
  } catch (error: any) {
    console.error('Google Calendar error:', error?.message);
    return null;
  }
}
