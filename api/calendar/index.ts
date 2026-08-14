import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createCalendarEvent, getAccessToken, loadServiceAccount } from './_lib.js';

/**
 * GET  -> diagnóstico: confirma que la service account autentica y que tiene
 *         acceso al calendario. No expone credenciales.
 * POST -> crea un evento de prueba. Protegido: el flujo real de reservas entra
 *         por el webhook de Mercado Pago, no por acá.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const steps: Record<string, unknown> = {};
    try {
      const sa = loadServiceAccount();
      const source = process.env.GOOGLE_SA_JSON_B64
        ? 'GOOGLE_SA_JSON_B64'
        : process.env.GOOGLE_SA_JSON
          ? 'GOOGLE_SA_JSON'
          : process.env.GOOGLE_PRIVATE_KEY
            ? 'GOOGLE_PRIVATE_KEY'
            : 'ninguna';

      steps.credentials = {
        source,
        clientEmail: sa.client_email,
        privateKeyLooksValid: sa.private_key.includes('-----BEGIN PRIVATE KEY-----'),
      };

      const token = await getAccessToken(sa);
      steps.oauth = { ok: true, tokenLength: token.length };

      const calendarId = process.env.GOOGLE_CALENDAR_ID || 'cristianbastian.dev@gmail.com';
      const check = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const body = (await check.json()) as { summary?: string; timeZone?: string; error?: { message?: string } };

      steps.calendarAccess = check.ok
        ? { ok: true, calendarId, summary: body.summary, timeZone: body.timeZone }
        : { ok: false, calendarId, status: check.status, message: body?.error?.message };

      return res.status(check.ok ? 200 : 502).json({ ok: check.ok, steps });
    } catch (error: any) {
      return res.status(500).json({ ok: false, steps, error: error?.message || String(error) });
    }
  }

  if (req.method === 'POST') {
    const adminToken = process.env.CALENDAR_ADMIN_TOKEN;
    if (!adminToken) {
      return res.status(403).json({
        error: 'POST deshabilitado. Definí CALENDAR_ADMIN_TOKEN para habilitar la creación manual de eventos.',
      });
    }
    if (req.headers['x-calendar-token'] !== adminToken) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const { summary, description, date, time, durationMinutes, clientEmail, clientName } = req.body || {};
    if (!summary || !date || !time || !clientName) {
      return res.status(400).json({ error: 'Faltan campos: summary, date, time, clientName' });
    }

    const eventId = await createCalendarEvent({
      summary,
      description,
      date,
      time,
      durationMinutes: durationMinutes || 60,
      clientEmail: clientEmail || '',
      clientName,
    });

    return eventId
      ? res.status(200).json({ ok: true, eventId })
      : res.status(502).json({ ok: false, error: 'No se pudo crear el evento. Revisá los logs de la función.' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
