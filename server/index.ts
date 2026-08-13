import express from 'express';
import cors from 'cors';
import { neon } from '@neondatabase/serverless';

const app = express();
const sql = neon(process.env.DATABASE_URL!);

app.use(cors());
app.use(express.json());

// Create Mercado Pago preference (Checkout Pro)
app.post('/api/create-preference', async (req, res) => {
  try {
    const { serviceId, clientName, clientEmail, clientPhone, clientRut, date, time, notes } = req.body;
    
    // Fetch service details
    const services = await sql`
      SELECT * FROM services WHERE id = ${serviceId}
    `;
    const service = services[0] as any;
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    // Create booking first
    const bookingResult = await sql`
      INSERT INTO bookings (service_id, client_name, client_email, client_phone, client_rut, booking_date, booking_time, deposit_amount, total_amount, notes)
      VALUES (${serviceId}, ${clientName}, ${clientEmail}, ${clientPhone}, ${clientRut || null}, ${date}, ${time}, ${service.deposit_amount}, ${service.price}, ${notes || null})
      RETURNING id
    `;
    
    const bookingId = (bookingResult[0] as any).id;
    
    // Create Mercado Pago preference
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
          description: `Reserva para ${date} a las ${time}`,
          quantity: 1,
          unit_price: service.deposit_amount,
          currency_id: 'CLP',
        }],
        external_reference: bookingId,
        back_urls: {
          success: `${process.env.APP_URL}/confirmacion?status=approved&booking=${bookingId}`,
          failure: `${process.env.APP_URL}/agendar?status=failure`,
          pending: `${process.env.APP_URL}/confirmacion?status=pending&booking=${bookingId}`,
        },
        auto_return: 'approved',
        notification_url: `${process.env.APP_URL}/api/webhooks/mercadopago`,
        payer: {
          name: clientName,
          email: clientEmail,
        },
      }),
    });
    
    const preference = await response.json();
    
    res.json({
      id: preference.id,
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point,
      bookingId: bookingId,
    });
  } catch (error) {
    console.error('Error creating preference:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Webhook Mercado Pago
app.post('/api/webhooks/mercadopago', async (req, res) => {
  try {
    const { type, data } = req.body;
    
    if (type === 'payment') {
      const paymentId = data.id;
      
      // Fetch payment details from Mercado Pago
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
        },
      });
      
      const payment = await paymentResponse.json() as any;
      
      if (payment.status === 'approved') {
        // Update booking status
        await sql`
          UPDATE bookings 
          SET status = 'confirmed', deposit_paid = true, payment_id = ${String(paymentId)}
          WHERE id = ${payment.external_reference}
        `;
        
        console.log(`Payment approved for booking ${payment.external_reference}`);
      }
    }
    
    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available time slots
app.get('/api/time-slots', async (req, res) => {
  try {
    const { date, serviceId } = req.query;
    
    const service = await sql`
      SELECT * FROM services WHERE id = ${serviceId}
    ` as any[];
    
    if (!service[0]) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    const blocked = await sql`
      SELECT time_start, time_end FROM blocked_times WHERE date = ${date}
    `;
    
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

// Get booking by ID
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

export default app;
