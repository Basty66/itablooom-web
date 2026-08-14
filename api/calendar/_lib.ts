import { google } from 'googleapis';

export function getCalendarClient() {
  const b64 = process.env.GOOGLE_SA_JSON_B64;

  if (!b64) {
    throw new Error('Missing GOOGLE_SA_JSON_B64');
  }

  const serviceAccount = JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'));

  const auth = new google.auth.JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  return google.calendar({ version: 'v3', auth });
}

export async function createCalendarEvent(data: {
  summary: string;
  description?: string;
  date: string;
  time: string;
  durationMinutes: number;
  clientEmail: string;
  clientName: string;
}) {
  const calendar = getCalendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

  const { summary, description, date, time, durationMinutes, clientEmail, clientName } = data;

  const startDate = new Date(`${date}T${time}:00`);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  const event = {
    summary,
    description: description || `Cita de ${clientName} - ${summary}`,
    start: {
      dateTime: startDate.toISOString(),
      timeZone: 'America/Santiago',
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: 'America/Santiago',
    },
    attendees: [
      { email: clientEmail },
    ],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 30 },
      ],
    },
  };

  try {
    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
    });
    return response.data.id || null;
  } catch (error: any) {
    console.error('Google Calendar API error:', error?.message, error?.response?.data);
    return null;
  }
}
