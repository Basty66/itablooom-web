import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createCalendarEvent } from './_lib';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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
      return res.status(500).json({ error: 'Failed to create calendar event' });
    }
  } catch (error) {
    console.error('Calendar API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
