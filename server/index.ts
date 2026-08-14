import express from 'express';
import cors from 'cors';
import { neon } from '@neondatabase/serverless';

const app = express();
const sql = neon(process.env.DATABASE_URL!);

app.use(cors());
app.use(express.json());

// ============================================
// UTILIDADES DE SEGURIDAD
// ============================================

// Verificar si el pago ya fue procesado (anti doble pago)
async function isPaymentProcessed(paymentId: string): Promise<boolean> {
  const result = await sql`
    SELECT id FROM bookings WHERE payment_id = ${paymentId} AND status = 'confirmed'
  `;
  return result.length > 0;
}

// Verificar si la reserva ya tiene un pago asociado
async function hasExistingPayment(bookingId: string): Promise<boolean> {
  const result = await sql`
    SELECT payment_id FROM bookings WHERE id = ${bookingId} AND payment_id IS NOT NULL
  `;
  return result.length > 0;
}

// Rate limiting simple
const rateLimitMap = new Map<string, number[]>();
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60000; // 1 minuto
  const maxRequests = 10;
  
  const requests = rateLimitMap.get(ip) || [];
  const recentRequests = requests.filter(time => now - time < windowMs);
  
  if (recentRequests.length >= maxRequests) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);
  return true;
}

// ============================================
// CREAR PREFERENCIA DE PAGO (CHECKOUT PRO)
// ============================================

app.post('/api/create-preference', async (req, res) => {
  try {
    // Rate limiting
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({ error: 'Demasiadas solicitudes. Intenta más tarde.' });
    }

    const { serviceId, clientName, clientEmail, clientPhone, clientRut, date, time, notes } = req.body;
    
    // Validaciones
    if (!serviceId || !clientName || !clientEmail || !clientPhone || !date || !time) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // Verificar que no exista una reserva duplicada en los últimos 5 minutos
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
        bookingId: (recentDuplicate[0] as any).id
      });
    }

    // Obtener servicio
    const services = await sql`SELECT * FROM services WHERE id = ${serviceId}`;
    const service = services[0] as any;
    
    if (!service) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    // Verificar disponibilidad de horario
    const existingBooking = await sql`
      SELECT id FROM bookings 
      WHERE booking_date = ${date} 
        AND booking_time = ${time}
        AND status IN ('pending', 'confirmed')
    `;
    
    if (existingBooking.length > 0) {
      return res.status(409).json({ error: 'Este horario ya está reservado' });
    }
    
    // Crear reserva
    const bookingResult = await sql`
      INSERT INTO bookings (service_id, client_name, client_email, client_phone, client_rut, booking_date, booking_time, deposit_amount, total_amount, notes, status)
      VALUES (${serviceId}, ${clientName}, ${clientEmail}, ${clientPhone}, ${clientRut || null}, ${date}, ${time}, ${service.deposit_amount}, ${service.price}, ${notes || null}, 'pending')
      RETURNING id
    `;
    
    const bookingId = (bookingResult[0] as any).id;
    
    // Crear preferencia de Mercado Pago
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        items: [{
          id: bookingId,
          title: `Seña - ${service.name}`,
          description: `Reserva para ${date} a las ${time} - ${clientName}`,
          quantity: 1,
          unit_price: service.deposit_amount,
          currency_id: 'CLP',
        }],
        external_reference: bookingId,
        back_urls: {
          success: `${process.env.APP_URL}/confirmacion?status=approved&booking=${bookingId}`,
          failure: `${process.env.APP_URL}/confirmacion?status=failure&booking=${bookingId}`,
          pending: `${process.env.APP_URL}/confirmacion?status=pending&booking=${bookingId}`,
        },
        auto_return: 'approved',
        notification_url: `${process.env.APP_URL}/api/webhooks/mercadopago`,
        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutos para pagar
        payer: {
          name: clientName,
          email: clientEmail,
        },
      }),
    });
    
    if (!response.ok) {
      // Si falla la creación de preferencia, marcar la reserva como cancelada
      await sql`UPDATE bookings SET status = 'cancelled' WHERE id = ${bookingId}`;
      return res.status(500).json({ error: 'Error al crear el pago' });
    }
    
    const preference = await response.json();
    
    res.json({
      id: preference.id,
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point,
      bookingId: bookingId,
    });
    
  } catch (error) {
    console.error('Error creating preference:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============================================
// WEBHOOK DE MERCADO PAGO (CONFIRMACIÓN DE PAGO)
// ============================================

app.post('/api/webhooks/mercadopago', async (req, res) => {
  try {
    const { type, data } = req.body;
    
    // Solo procesar eventos de pago
    if (type !== 'payment') {
      return res.sendStatus(200);
    }
    
    const paymentId = data.id;
    
    // VERIFICACIÓN ANTI DOBLE PAGO
    const alreadyProcessed = await isPaymentProcessed(String(paymentId));
    if (alreadyProcessed) {
      console.log(`Payment ${paymentId} already processed, skipping`);
      return res.sendStatus(200);
    }
    
    // Obtener detalles del pago de Mercado Pago
    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
      },
    });
    
    if (!paymentResponse.ok) {
      console.error('Failed to fetch payment details');
      return res.status(500).json({ error: 'Failed to fetch payment' });
    }
    
    const payment = await paymentResponse.json() as any;
    const bookingId = payment.external_reference;
    
    if (!bookingId) {
      console.error('No external_reference in payment');
      return res.sendStatus(200);
    }
    
    // Verificar si la reserva ya tiene un pago (doble pago)
    const existingPayment = await hasExistingPayment(bookingId);
    if (existingPayment) {
      console.log(`Booking ${bookingId} already has payment, skipping`);
      return res.sendStatus(200);
    }
    
    // Procesar según estado del pago
    if (payment.status === 'approved') {
      // PAGO APROBADO - Confirmar reserva
      await sql`
        UPDATE bookings 
        SET status = 'confirmed', 
            deposit_paid = true, 
            payment_id = ${String(paymentId)}
        WHERE id = ${bookingId}
      `;
      console.log(`✅ Payment approved for booking ${bookingId}`);
      
    } else if (payment.status === 'pending') {
      // PAGO PENDIENTE (ej: transferencia bancaria)
      await sql`
        UPDATE bookings 
        SET payment_id = ${String(paymentId)}
        WHERE id = ${bookingId}
      `;
      console.log(`⏳ Payment pending for booking ${bookingId}`);
      
    } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
      // PAGO RECHAZADO - Cancelar reserva
      await sql`
        UPDATE bookings 
        SET status = 'cancelled'
        WHERE id = ${bookingId}
      `;
      console.log(`❌ Payment rejected for booking ${bookingId}`);
    }
    
    res.sendStatus(200);
    
  } catch (error) {
    console.error('Webhook error:', error);
    // Siempre devolver 200 para que Mercado Pago no reintente
    res.sendStatus(200);
  }
});

// ============================================
// VERIFICAR ESTADO DE PAGO (PARA EL FRONTEND)
// ============================================

app.get('/api/payment-status/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const result = await sql`
      SELECT id, status, deposit_paid, payment_id 
      FROM bookings 
      WHERE id = ${bookingId}
    `;
    
    if (!result[0]) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const booking = result[0] as any;
    
    // Si tiene payment_id, verificar estado actual en Mercado Pago
    if (booking.payment_id && !booking.deposit_paid) {
      try {
        const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${booking.payment_id}`, {
          headers: {
            'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
          },
        });
        
        if (paymentResponse.ok) {
          const payment = await paymentResponse.json() as any;
          
          if (payment.status === 'approved' && !booking.deposit_paid) {
            // Sincronizar estado
            await sql`
              UPDATE bookings 
              SET status = 'confirmed', deposit_paid = true
              WHERE id = ${bookingId} AND deposit_paid = false
            `;
            booking.status = 'confirmed';
            booking.deposit_paid = true;
          }
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
      }
    }
    
    res.json(booking);
    
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// OBTENER SLOTS DISPONIBLES
// ============================================

app.get('/api/time-slots', async (req, res) => {
  try {
    const { date, serviceId } = req.query;
    
    if (!date || !serviceId) {
      return res.status(400).json({ error: 'Missing date or serviceId' });
    }
    
    const service = await sql`SELECT * FROM services WHERE id = ${serviceId}` as any[];
    
    if (!service[0]) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    const blocked = await sql`SELECT time_start, time_end FROM blocked_times WHERE date = ${date}`;
    
    const existingBookings = await sql`
      SELECT booking_time, duration_minutes FROM bookings 
      WHERE booking_date = ${date} AND status IN ('pending', 'confirmed')
    `;
    
    const slots = [];
    const startHour = 9;
    const endHour = 19;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const time = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
        
        const isBlocked = blocked.some((b: any) => {
          if (!b.time_start || !b.time_end) return false;
          return time >= b.time_start.slice(0, 5) && time < b.time_end.slice(0, 5);
        });
        
        const isBooked = existingBookings.some((b: any) => {
          const bookingTime = b.booking_time.slice(0, 5);
          const bookingDuration = b.duration_minutes || 60;
          const bookingEndMin = parseInt(bookingTime.split(':')[0]) * 60 + parseInt(bookingTime.split(':')[1]) + bookingDuration;
          const slotMin = hour * 60 + min;
          const slotEndMin = slotMin + service[0].duration_minutes;
          return slotMin < bookingEndMin && slotEndMin > parseInt(bookingTime.split(':')[0]) * 60 + parseInt(bookingTime.split(':')[1]);
        });
        
        slots.push({
          time,
          available: !isBlocked && !isBooked,
        });
      }
    }
    
    res.json(slots);
  } catch (error) {
    console.error('Error fetching time slots:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// OBTENER RESERVA POR ID
// ============================================

app.get('/api/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await sql`
      SELECT b.*, s.name as service_name, s.description as service_description
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      WHERE b.id = ${id}
    `;
    
    if (!result[0]) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json(result[0]);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/api/health', async (req, res) => {
  try {
    await sql`SELECT 1`;
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch {
    res.status(500).json({ status: 'error', error: 'Database connection failed' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

export default app;
