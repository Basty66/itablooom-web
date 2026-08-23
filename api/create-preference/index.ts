import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { RESERVA_TTL_MINUTOS, expirarReservasVencidas, HORARIO, PASO_MINUTOS, COLCHON_MINUTOS } from '../_shared/bookings.js';

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

    const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID.test(String(serviceId))) {
      return res.status(400).json({ error: 'serviceId inválido' });
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
    if (!Number.isInteger(hh) || !Number.isInteger(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) {
      return res.status(400).json({ error: 'Hora inválida' });
    }
    const inicio = hh * 60 + mm;
    const duracion = Number((service as any).duration_minutes) || 60;
    if (inicio < horario.abre * 60 || inicio + duracion > horario.cierra * 60) {
      return res.status(400).json({ error: 'Ese horario está fuera de la atención de ese día' });
    }

    /*
     * Validaciones que solo existían en el formulario. La API se puede llamar
     * directamente, así que acá también: si no, entran reservas para fechas ya
     * pasadas, con correos a los que nunca llegará la confirmación, o a horas
     * fuera de la grilla como las 10:07.
     */
    if (mm % PASO_MINUTOS !== 0) {
      return res.status(400).json({ error: 'Esa hora no corresponde a un bloque de la agenda' });
    }

    const hoy = new Date();
    const inicioDelDiaDeHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    if (new Date(anio, mes - 1, dia) < inicioDelDiaDeHoy) {
      return res.status(400).json({ error: 'Esa fecha ya pasó' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(clientEmail))) {
      return res.status(400).json({ error: 'El correo no tiene un formato válido' });
    }

    if (paymentType !== undefined && paymentType !== 'deposit' && paymentType !== 'full') {
      return res.status(400).json({ error: 'Tipo de pago inválido' });
    }

    // Libera los cupos de quienes abandonaron el checkout antes de evaluar
    // si el horario sigue tomado.
    await expirarReservasVencidas(sql);

    /*
     * Solapamiento real, no coincidencia de hora exacta.
     *
     * Antes comparaba `booking_time = ${time}`: una cita de tres horas desde
     * las 10:00 no impedía reservar las 11:00, porque la hora de inicio era
     * distinta. El listado de horarios sí lo calculaba bien, así que el
     * formulario no ofrecía ese cupo — pero la API es alcanzable directamente
     * y dos clientas que reservaban a la vez podían quedar encima.
     *
     * Se cuenta también el colchón, para no dejar citas pegadas por esta vía.
     */
    const ocupado = await sql`
      SELECT b.id FROM bookings b
      WHERE b.booking_date = ${date}
        AND (
          b.status = 'confirmed'
          OR (b.status = 'pending' AND b.created_at > NOW() - (${RESERVA_TTL_MINUTOS} * INTERVAL '1 minute'))
        )
        AND (
          (
            b.booking_time,
            b.booking_time
              + (SELECT s.duration_minutes FROM services s WHERE s.id = b.service_id) * INTERVAL '1 minute'
              + ${COLCHON_MINUTOS} * INTERVAL '1 minute'
          )
          OVERLAPS
          (
            ${time}::time,
            ${time}::time + ${duracion} * INTERVAL '1 minute' + ${COLCHON_MINUTOS} * INTERVAL '1 minute'
          )
        )
    `;

    if (ocupado.length > 0) {
      return res.status(409).json({ error: 'Este horario ya está reservado' });
    }

    const bookingResult = await sql`
      INSERT INTO bookings (service_id, client_name, client_email, client_phone, client_rut, booking_date, booking_time, deposit_amount, total_amount, notes, status)
      VALUES (${serviceId}, ${clientName}, ${clientEmail}, ${clientPhone}, ${clientRut || null}, ${date}, ${time}, ${paymentType === 'full' ? service.price : service.deposit_amount}, ${service.price}, ${notes || null}, 'pending')
      RETURNING id
    `;

    const bookingId = (bookingResult[0] as any).id;

    const mpToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    const appUrl = process.env.APP_URL || 'https://goddessstudio.cl';

    /*
     * La clienta elige entre abonar o pagar todo. Antes se cobraba siempre
     * `service.price`, mientras la web anunciaba una reserva por el depósito:
     * quien reservaba el curso veía $5.000 y se le cobraban $32.000.
     */
    const pagaTodo = paymentType === 'full';
    const deposito = Number(service.deposit_amount) || 0;
    const total = Number(service.price) || 0;
    const paymentAmount = pagaTodo ? total : deposito;
    const paymentLabel = pagaTodo ? service.name : `${service.name} — Abono de reserva`;

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
