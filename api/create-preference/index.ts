import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60000;
  const maxRequests = 10;
  const requests = rateLimitMap.get(ip) || [];
  const recentRequests = requests.filter((t) => now - t < windowMs);
  if (recentRequests.length >= maxRequests) return false;
  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);
  return true;
}

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
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({ error: 'Demasiadas solicitudes. Intenta más tarde.' });
    }

    const { serviceId, clientName, clientEmail, clientPhone, clientRut, date, time, notes, paymentType } = req.body;

    if (!serviceId || !clientName || !clientEmail || !clientPhone || !date || !time) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const recentDuplicate = await sql`
      SELECT id FROM bookings
      WHERE client_email = ${clientEmail}
        AND booking_date = ${date}
        AND booking_time = ${time}
        AND created_at > NOW() - INTERVAL '5 minutes'
        AND status IN ('pending', 'confirmed')
    `;

    if (recentDuplicate.length > 0) {
      return res.status(409).json({
        error: 'Ya existe una reserva para esta fecha y hora',
        bookingId: (recentDuplicate[0] as any).id,
      });
    }

    const services = await sql`SELECT * FROM services WHERE id = ${serviceId}`;
    const service = services[0] as any;

    if (!service) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    const existingBooking = await sql`
      SELECT id FROM bookings
      WHERE booking_date = ${date} AND booking_time = ${time}
        AND status IN ('pending', 'confirmed')
    `;

    if (existingBooking.length > 0) {
      return res.status(409).json({ error: 'Este horario ya está reservado' });
    }

    const bookingResult = await sql`
      INSERT INTO bookings (service_id, client_name, client_email, client_phone, client_rut, booking_date, booking_time, deposit_amount, total_amount, notes, status)
      VALUES (${serviceId}, ${clientName}, ${clientEmail}, ${clientPhone}, ${clientRut || null}, ${date}, ${time}, ${service.deposit_amount}, ${service.price}, ${notes || null}, 'pending')
      RETURNING id
    `;

    const bookingId = (bookingResult[0] as any).id;

    const mpToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    const appUrl = process.env.APP_URL || 'https://itablooom-web.vercel.app';

    const isFullPayment = paymentType === 'full';
    const paymentAmount = isFullPayment ? service.price : service.deposit_amount;
    const paymentLabel = isFullPayment ? `Pago total - ${service.name}` : `Seña - ${service.name}`;

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mpToken}`,
      },
      body: JSON.stringify({
        items: [
          {
            id: bookingId,
            title: paymentLabel,
            description: `Reserva para ${date} a las ${time} - ${clientName}`,
            quantity: 1,
            unit_price: paymentAmount,
            currency_id: 'CLP',
          },
        ],
        external_reference: bookingId,
        back_urls: {
          success: `${appUrl}/confirmacion?status=approved&booking=${bookingId}`,
          failure: `${appUrl}/confirmacion?status=failure&booking=${bookingId}`,
          pending: `${appUrl}/confirmacion?status=pending&booking=${bookingId}`,
        },
        auto_return: 'approved',
        notification_url: `${appUrl}/api/webhooks/mercadopago`,
        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        payer: {
          name: clientName,
          email: clientEmail,
        },
      }),
    });

    if (!response.ok) {
      await sql`UPDATE bookings SET status = 'cancelled' WHERE id = ${bookingId}`;
      return res.status(500).json({ error: 'Error al crear el pago' });
    }

    const preference = await response.json();

    return res.status(200).json({
      id: preference.id,
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point,
      bookingId: bookingId,
    });
  } catch (error) {
    console.error('Error creating preference:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
