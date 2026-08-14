import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bookingId } = req.query;

    if (!bookingId) {
      return res.status(400).json({ error: 'Missing bookingId' });
    }

    const result = await sql`
      SELECT id, status, deposit_paid, payment_id
      FROM bookings
      WHERE id = ${bookingId as string}
    `;

    if (!result[0]) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = result[0] as Record<string, unknown>;

    if (booking.payment_id && !booking.deposit_paid) {
      try {
        const paymentResponse = await fetch(
          `https://api.mercadopago.com/v1/payments/${booking.payment_id}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
            },
          }
        );

        if (paymentResponse.ok) {
          const payment = (await paymentResponse.json()) as Record<string, unknown>;

          if (payment.status === 'approved' && !booking.deposit_paid) {
            await sql`
              UPDATE bookings
              SET status = 'confirmed', deposit_paid = true
              WHERE id = ${bookingId as string} AND deposit_paid = false
            `;
            booking.status = 'confirmed';
            booking.deposit_paid = true;
          }
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
      }
    }

    return res.status(200).json(booking);
  } catch (error) {
    console.error('Error checking payment status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
