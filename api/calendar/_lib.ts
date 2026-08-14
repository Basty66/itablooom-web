import { google } from 'googleapis';

export function getCalendarClient() {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!json) {
    throw new Error('Missing Google Calendar credentials');
  }

  const serviceAccount = JSON.parse(json);
  const key = serviceAccount.private_key.replace(/\\n/g, '\n');

  const auth = new google.auth.JWT({
    email: serviceAccount.client_email,
    key,
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
    console.error('Error creating calendar event:', error?.message || error);
    return null;
  }
}
