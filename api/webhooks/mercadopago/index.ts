import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

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
  // Mercado Pago siempre debe recibir 200, sino reintenta
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

    // ANTI DOBLE PAGO: ya procesado?
    const alreadyProcessed = await isPaymentProcessed(paymentId);
    if (alreadyProcessed) {
      console.log(`Payment ${paymentId} already processed, skipping`);
      return res.status(200).end();
    }

    // Obtener detalles del pago
    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
      },
    });

    if (!paymentResponse.ok) {
      console.error('Failed to fetch payment details from Mercado Pago');
      return res.status(200).end();
    }

    const payment = (await paymentResponse.json()) as any;
    const bookingId = payment.external_reference;

    if (!bookingId) {
      console.error('No external_reference in payment');
      return res.status(200).end();
    }

    // ANTI DOBLE PAGO: reserva ya tiene pago?
    const alreadyHasPayment = await hasExistingPayment(bookingId);
    if (alreadyHasPayment) {
      console.log(`Booking ${bookingId} already has payment, skipping`);
      return res.status(200).end();
    }

    // Procesar según estado
    if (payment.status === 'approved') {
      await sql`
        UPDATE bookings
        SET status = 'confirmed',
            deposit_paid = true,
            payment_id = ${paymentId}
        WHERE id = ${bookingId}
      `;
      console.log(`✅ Payment approved for booking ${bookingId}`);
    } else if (payment.status === 'pending') {
      await sql`
        UPDATE bookings
        SET payment_id = ${paymentId}
        WHERE id = ${bookingId}
      `;
      console.log(`⏳ Payment pending for booking ${bookingId}`);
    } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
      await sql`
        UPDATE bookings
        SET status = 'cancelled'
        WHERE id = ${bookingId}
      `;
      console.log(`❌ Payment rejected for booking ${bookingId}`);
    }

    return res.status(200).end();
  } catch (error) {
    console.error('Webhook error:', error);
    // Siempre 200 para que MP no reintente en loop
    return res.status(200).end();
  }
}
