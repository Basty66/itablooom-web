import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { createCalendarEvent } from '../../calendar/_lib.js';

const sql = neon(process.env.DATABASE_URL!);

async function isPaymentProcessed(paymentId: string): Promise<boolean> {
  const result = await sql`SELECT id FROM bookings WHERE payment_id = ${paymentId} AND status = 'confirmed'`;
  return result.length > 0;
}

async function hasExistingPayment(bookingId: string): Promise<boolean> {
  const result = await sql`SELECT payment_id FROM bookings WHERE id = ${bookingId} AND payment_id IS NOT NULL`;
  return result.length > 0;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(200).end();
  }

  try {
    const { type, data } = req.body;

    if (type !== 'payment') {
      return res.status(200).end();
    }

    const paymentId = String(data?.id);
    if (!paymentId || paymentId === 'undefined') {
      return res.status(200).end();
    }

    const alreadyProcessed = await isPaymentProcessed(paymentId);
    if (alreadyProcessed) {
      return res.status(200).end();
    }

    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
      },
    });

    if (!paymentResponse.ok) {
      return res.status(200).end();
    }

    const payment = (await paymentResponse.json()) as any;
    const bookingId = payment.external_reference;

    if (!bookingId) {
      return res.status(200).end();
    }

    const alreadyHasPayment = await hasExistingPayment(bookingId);
    if (alreadyHasPayment) {
      return res.status(200).end();
    }

    if (payment.status === 'approved') {
      await sql`
        UPDATE bookings
        SET status = 'confirmed',
            deposit_paid = true,
            payment_id = ${paymentId}
        WHERE id = ${bookingId}
      `;

      // Crear evento en Google Calendar
      try {
        const bookings = await sql`
          SELECT b.*, s.name as service_name, s.duration_minutes
          FROM bookings b
          JOIN services s ON b.service_id = s.id
          WHERE b.id = ${bookingId}
        `;
        const booking = bookings[0] as any;

        if (booking) {
          const dateStr = typeof booking.booking_date === 'string'
            ? booking.booking_date.split('T')[0]
            : new Date(booking.booking_date).toISOString().split('T')[0];
          const timeStr = booking.booking_time ? booking.booking_time.slice(0, 5) : '10:00';

          const eventId = await createCalendarEvent({
            summary: `${booking.service_name} - ${booking.client_name}`,
            description: `Cita confirmada. Cliente: ${booking.client_name} | Email: ${booking.client_email} | Tel: ${booking.client_phone}`,
            date: dateStr,
            time: timeStr,
            durationMinutes: booking.duration_minutes || 60,
            clientEmail: booking.client_email,
            clientName: booking.client_name,
          });

          if (eventId) {
            await sql`UPDATE bookings SET calendar_event_id = ${eventId} WHERE id = ${bookingId}`;
            console.log(`📅 Calendar event created: ${eventId}`);
          }
        }
      } catch (calError) {
        console.error('Error creating calendar event:', calError);
      }

      console.log(`✅ Payment approved for booking ${bookingId}`);
    } else if (payment.status === 'pending') {
      await sql`
        UPDATE bookings
        SET payment_id = ${paymentId}
        WHERE id = ${bookingId}
      `;
    } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
      await sql`
        UPDATE bookings
        SET status = 'cancelled'
        WHERE id = ${bookingId}
      `;
    }

    return res.status(200).end();
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(200).end();
  }
}
