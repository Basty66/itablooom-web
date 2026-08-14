import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createCalendarEvent } from './_lib.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const calendar = getCalendarClient();
      const cal = await calendar.calendarList.get({ calendarId: 'primary' });
      return res.status(200).json({ calendar: cal.data });
    } catch (error: any) {
      return res.status(500).json({ error: error?.message || 'Error' });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { summary, description, date, time, durationMinutes, clientEmail, clientName } = req.body;

    if (!summary || !date || !time || !clientEmail || !clientName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const eventId = await createCalendarEvent({
      summary,
      description,
      date,
      time,
      durationMinutes: durationMinutes || 60,
      clientEmail,
      clientName,
    });

    if (eventId) {
      return res.status(200).json({ eventId });
    } else {
      return res.status(500).json({ error: 'Failed to create calendar event', calendarId });
    }
  } catch (error: any) {
    console.error('Calendar API error:', error?.message || error);
    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
}
