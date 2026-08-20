import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { RESERVA_TTL_MINUTOS, expirarReservasVencidas, HORARIO } from '../_shared/bookings.js';

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

    const { serviceId, clientName, clientEmail, clientPhone, clientRut, date, time, notes } = req.body;

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

    /*
     * El día y la hora se validan en el servidor y no solo en el formulario:
     * el frontend deshabilita domingos y horarios fuera de rango, pero la API
     * es alcanzable directamente y aceptaba cualquier fecha.
     */
    const [anio, mes, dia] = String(date).split('-').map(Number);
    const horario = HORARIO[new Date(anio, mes - 1, dia).getDay()];
    if (!horario) {
      return res.status(400).json({ error: 'Ese día no atendemos' });
    }

    const [hh, mm] = String(time).split(':').map(Number);
    const inicio = hh * 60 + mm;
    const duracion = Number((service as any).duration_minutes) || 60;
    if (inicio < horario.abre * 60 || inicio + duracion > horario.cierra * 60) {
      return res.status(400).json({ error: 'Ese horario está fuera de la atención de ese día' });
    }

    // Libera los cupos de quienes abandonaron el checkout antes de evaluar
    // si el horario sigue tomado.
    await expirarReservasVencidas(sql);

    const existingBooking = await sql`
      SELECT id FROM bookings
      WHERE booking_date = ${date} AND booking_time = ${time}
        AND (
          status = 'confirmed'
          OR (status = 'pending' AND created_at > NOW() - (${RESERVA_TTL_MINUTOS} * INTERVAL '1 minute'))
        )
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

    const paymentAmount = service.price;
    const paymentLabel = service.name;

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
        // La preferencia caduca junto con el cupo: si dejáramos 30 min, la
        // clienta podría pagar un horario que ya se liberó a los 10.
        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: new Date(Date.now() + RESERVA_TTL_MINUTOS * 60 * 1000).toISOString(),
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
