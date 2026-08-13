import { neon } from '@neondatabase/serverless';

const sql = neon(import.meta.env.VITE_NEON_DATABASE_URL!);

export default sql;

export async function initDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS services (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      duration_minutes INTEGER NOT NULL DEFAULT 60,
      price INTEGER NOT NULL,
      deposit_amount INTEGER NOT NULL DEFAULT 0,
      category VARCHAR(50) NOT NULL DEFAULT 'facial',
      image_url TEXT,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS bookings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      service_id UUID REFERENCES services(id),
      client_name VARCHAR(255) NOT NULL,
      client_email VARCHAR(255) NOT NULL,
      client_phone VARCHAR(50) NOT NULL,
      client_rut VARCHAR(20),
      booking_date DATE NOT NULL,
      booking_time TIME NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      deposit_paid BOOLEAN DEFAULT false,
      deposit_amount INTEGER DEFAULT 0,
      total_amount INTEGER NOT NULL,
      payment_id VARCHAR(255),
      calendar_event_id VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS blocked_times (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      date DATE NOT NULL,
      time_start TIME,
      time_end TIME,
      reason VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;

  console.log('Database tables initialized successfully');
}
