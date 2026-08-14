import type { VercelRequest, VercelResponse } from '@vercel/node';

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

    const { google } = await import('googleapis');

    const SERVICE_ACCOUNT = {
      type: "service_account",
      project_id: "i-woodland-498215-v8",
      private_key_id: "98ae07a84fbb5c1e413887a26f675ee9b810b290",
      private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCt4oHJWI0CKLLW\ne5DGAZjX+4uaGoqzIoe+fMa43amCyAw0zl+QDfFgaJbYeVfYa8V4JLirqty9P3FA\nflPCRt72Se3NuAfDzrh9vg9q2einyd7D1kv9NZm/RUGGlAVKXfT2JeUNrBVzTgQC\nyrQz/MGDirttB7H63loXCAIniC0By76oC9A18TvnocSSGp5tMdCuR4Qj+U/sOBod\nzyki4yrnekvAAt1TmCIvsbgJGpvUQKPoNgS71TSyuZ3pYOOWgJTX/eR2f1jyZihj\nc+ZVAtvtOxP/UO1NqqJ6+H6ZFSiMFzlELJ4WXs9dc6UR9E04CuY5XeYblXMNHKht\n9KlsZ/HfAgMBAAECggEATRSQ+uu9ijz3VfutiBCyK+AOmM/2NwVyDh9qyg08tMQw\nIQJwuz9rBhUm9SwJJF9VyHXixPp3Yo7qia/WOlNHR/8qotxW2NZc0yS62d9h8msa\nzE5FHigyEOdG7jzUgYxX5/uRZ3emhJgLUB+CNV9wevq3LdRQ8ce6QOZkahjD9ryb\nHdhHFpvqh4FbRMxXeRn0oo1TijBijkKb3pyp0F1IaVqdH/D9G8CbLRH3vjM2CALp\nzHkqoAeVphBKmQ/HyUs2mM9XDLJyOmPE5pHbz1KEDaMPB3MYdUOgwBaWM9NhXzL0\no4fVJe4ci6rG/5nOStglMJ+JYwoiaQLP7EHOZ4MUqQKBgQDXXZGzCG/f5Wh5RPI+\nAKAzNsm/2mC0yoc4SEqnHeH9mWwDZENsBKq0hRWe3NG3v/8WLERqCweZn3F3hoZG\n+oWYRbXlcSds4//N8k7jxvOhsYTg8v5oMm2SR0rNTCkNFga/QjRS7p1wcJ2DzHC3\ngFMVMavyktqvJWn4JlHp0fUgpwKBgQDOsV26FqkK8adqHYl7WFZUqZeF8oImqJZI\nPXMggsSJAnC5s5Is3SZ1ulH3E//bBdy86g1y+TfB15X9ICPM9tKbW6AxEoWQbmEk\nk3XbLVvbb/8ReX4J3AZ8hm2s+p9agojm5r3DW0tJYcScQaST4ilJnDkFRZh6e5P2\nQlwaCrVUCQKBgElSKdByBuSLDc57kp1ZSTEmbflLN7FVYkPfGMtceRwFp6hf8jRM\nQnHC/WFgfGW6j/XUjFYt+yBqEA9JVV3E3MbCtPKwW2PPG7/ZxtH1Yeyiq0KKd+Kx\niGxMqULLsw4peZKTz4yMgD1PmdDNQXK31ZFZn9it9pW6fyFkqm6YdIPxAoGBAIjV\n3UIEHHdVUksrMMhKzCSSffC8grOLKqq6m8wrJme6CNy36A7xfbO03Oyg/eKHOAKN\nRMgX+3TF/9MrAuh/gyA9AYlbRLdAi+lGAmFO3yAgPhHYh7uJQXYRHOzGotat0mpi\n2cBKYUY8hogX4RfSQxkrZoh58Z8szuDaP9Uxv6fZAoGBAKA10Vzv+KYCPHcLGy35\norTLlVIbqmOkP9x8L41k2HQXouPD9G0XOK5GES2sLDScU5zoD9y24BlGqvp59324\nH+hMOgSaoO5qBDoZpdOeYUQUN7NWQZnb1ved0a8xM/+IVJ7myJ9JuZpd7QYappDA\nrVarQc8Vq+00Ci7NsFHdyDnn\n-----END PRIVATE KEY-----\n",
      client_email: "calendar-bot@i-woodland-498215-v8.iam.gserviceaccount.com",
      client_id: "103334786180065517565",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/calendar-bot%40i-woodland-498215-v8.iam.gserviceaccount.com",
      universe_domain: "googleapis.com"
    };

    const auth = new google.auth.JWT({
      email: SERVICE_ACCOUNT.client_email,
      key: SERVICE_ACCOUNT.private_key,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const calendar = google.calendar({ version: 'v3', auth });
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    const dur = durationMinutes || 60;
    const startDate = new Date(`${date}T${time}:00`);
    const endDate = new Date(startDate.getTime() + dur * 60 * 1000);

    const response = await calendar.events.insert({
      calendarId,
      requestBody: {
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
      },
    });

    return res.status(200).json({ eventId: response.data.id });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || String(error) });
  }
}
