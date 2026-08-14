import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

async function getAccessToken(): Promise<string> {
  const email = "calendar-bot@i-woodland-498215-v8.iam.gserviceaccount.com";
  const key = "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCt4oHJWI0CKLLW\ne5DGAZjX+4uaGoqzIoe+fMa43amCyAw0zl+QDfFgaJbYeVfYa8V4JLirqty9P3FA\nflPCRt72Se3NuAfDzrh9vg9q2einyd7D1kv9NZm/RUGGlAVKXfT2JeUNrBVzTgQC\nyrQz/MGDirttB7H63loXCAIniC0By76oC9A18TvnocSSGp5tMdCuR4Qj+U/sOBod\nzyki4yrnekvAAt1TmCIvsbgJGpvUQKPoNgS71TSyuZ3pYOOWgJTX/eR2f1jyZihj\nc+ZVAtvtOxP/UO1NqqJ6+H6ZFSiMFzlELJ4WXs9dc6UR9E04CuY5XeYblXMNHKht\n9KlsZ/HfAgMBAAECggEATRSQ+uu9ijz3VfutiBCyK+AOmM/2NwVyDh9qyg08tMQw\nIQJwuz9rBhUm9SwJJF9VyHXixPp3Yo7qia/WOlNHR/8qotxW2NZc0yS62d9h8msa\nzE5FHigyEOdG7jzUgYxX5/uRZ3emhJgLUB+CNV9wevq3LdRQ8ce6QOZkahjD9ryb\nHdhHFpvqh4FbRMxXeRn0oo1TijBijkKb3pyp0F1IaVqdH/D9G8CbLRH3vjM2CALp\nzHkqoAeVphBKmQ/HyUs2mM9XDLJyOmPE5pHbz1KEDaMPB3MYdUOgwBaWM9NhXzL0\no4fVJe4ci6rG/5nOStglMJ+JYwoiaQLP7EHOZ4MUqQKBgQDXXZGzCG/f5Wh5RPI+\nAKAzNsm/2mC0yoc4SEqnHeH9mWwDZENsBKq0hRWe3NG3v/8WLERqCweZn3F3hoZG\n+oWYRbXlcSds4//N8k7jxvOhsYTg8v5oMm2SR0rNTCkNFga/QjRS7p1wcJ2DzHC3\ngFMVMavyktqvJWn4JlHp0fUgpwKBgQDOsV26FqkK8adqHYl7WFZUqZeF8oImqJZI\nPXMggsSJAnC5s5Is3SZ1ulH3E//bBdy86g1y+TfB15X9ICPM9tKbW6AxEoWQbmEk\nk3XbLVvbb/8ReX4J3AZ8hm2s+p9agojm5r3DW0tJYcScQaST4ilJnDkFRZh6e5P2\nQlwaCrVUCQKBgElSKdByBuSLDc57kp1ZSTEmbflLN7FVYkPfGMtceRwFp6hf8jRM\nQnHC/WFgfGW6j/XUjFYt+yBqEA9JVV3E3MbCtPKwW2PPG7/ZxtH1Yeyiq0KKd+Kx\niGxMqULLsw4peZKTz4yMgD1PmdDNQXK31ZFZn9it9pW6fyFkqm6YdIPxAoGBAIjV\n3UIEHHdVUksrMMhKzCSSffC8grOLKqq6m8wrJme6CNy36A7xfbO03Oyg/eKHOAKN\nRMgX+3TF/9MrAuh/gyA9AYlbRLdAi+lGAmFO3yAgPhHYh7uJQXYRHOzGotat0mpi\n2cBKYUY8hogX4RfSQxkrZoh58Z8szuDaP9Uxv6fZAoGBAKA10Vzv+KYCPHcLGy35\norTLlVIbqmOkP9x8L41k2HQXouPD9G0XOK5GES2sLDScU5zoD9y24BlGqvp59324\nH+hMOgSaoO5qBDoZpdOeYUQUN7NWQZnb1ved0a8xM/+IVJ7myJ9JuZpd7QYappDA\nrVarQc8Vq+00Ci7NsFHdyDnn\n-----END PRIVATE KEY-----\n";

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: email,
    sub: email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/calendar',
  };

  const header = { alg: 'RS256', typ: 'JWT' };
  const enc = (obj: object) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const headerB64 = enc(header);
  const payloadB64 = enc(payload);
  const signingInput = `${headerB64}.${payloadB64}`;

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signingInput);
  const signature = sign.sign(key, 'base64url');

  const jwt = `${signingInput}.${signature}`;

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const data = await resp.json() as any;
  if (!data.access_token) throw new Error('Failed to get access token: ' + JSON.stringify(data));
  return data.access_token;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { summary, description, date, time, durationMinutes, clientEmail, clientName } = req.body;
    if (!summary || !date || !time || !clientEmail || !clientName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const accessToken = await getAccessToken();
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    const dur = durationMinutes || 60;
    const startDate = new Date(`${date}T${time}:00`);
    const endDate = new Date(startDate.getTime() + dur * 60 * 1000);

    const event = {
      summary,
      description: description || `Cita de ${clientName} - ${summary}`,
      start: { dateTime: startDate.toISOString(), timeZone: 'America/Santiago' },
      end: { dateTime: endDate.toISOString(), timeZone: 'America/Santiago' },
      attendees: [{ email: clientEmail }],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
    };

    const calResp = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    const calData = await calResp.json() as any;

    if (!calResp.ok) {
      return res.status(500).json({ error: calData.error?.message || 'Calendar API error' });
    }

    return res.status(200).json({ eventId: calData.id });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || String(error) });
  }
}
