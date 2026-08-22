import { neon } from '@neondatabase/serverless';

const databaseUrl = import.meta.env.VITE_NEON_DATABASE_URL;

if (!databaseUrl) {
  console.error('Error: VITE_NEON_DATABASE_URL not found');
}

const sql = neon(databaseUrl!);

async function setupDatabase() {
  console.log('Connecting to Neon DB...');
  
  try {
    await sql`SELECT 1 as test`;
    console.log('✓ Connection successful');

    console.log('Creating tables...');

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
    console.log('✓ Services table created');

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
    console.log('✓ Bookings table created');

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
    console.log('✓ Blocked times table created');

    /*
     * Las claves de `category` siguen siendo facial/laser/course porque así
     * quedó la columna del proyecto anterior; hoy representan uñas, pestañas
     * y cejas. Al renombrarlas hay que actualizar también `lib/categorias.ts`
     * y `ui/ServiceVisual.tsx`, que las traducen a las etiquetas visibles.
     */
    const existingServices = await sql`SELECT COUNT(*) as count FROM services`;
    if ((existingServices[0] as any).count === 0) {
      await sql`
        INSERT INTO services (name, description, duration_minutes, price, deposit_amount, category)
        VALUES 
          ('Esmaltado Permanente', 'Manicure completa con esmaltado permanente de larga duración. Incluye limado, cutículas y elección de color.', 90, 18000, 5000, 'facial'),
          ('Uñas Acrílicas con Diseño', 'Extensión en acrílico con la forma y largo que prefieras, más diseño personalizado a elección.', 150, 32000, 5000, 'facial'),
          ('Extensión de Pestañas Pelo a Pelo', 'Aplicación pelo a pelo para un efecto natural. Se coloca una extensión por cada pestaña propia.', 120, 25000, 5000, 'laser'),
          ('Lifting de Pestañas', 'Curvatura y tinte de tus pestañas naturales. Sin extensiones y con una duración de hasta ocho semanas.', 60, 20000, 5000, 'laser'),
          ('Diseño y Laminado de Cejas', 'Diseño según la forma de tu rostro, con laminado para fijar y dar volumen. Incluye perfilado y tinte.', 60, 16000, 5000, 'course')
      `;
      console.log('✓ Default services inserted');
    } else {
      console.log('✓ Services already exist, skipping insert');
    }

    console.log('\n✅ Database setup completed successfully!');
  } catch (error) {
    console.error('❌ Error setting up database:', error);
  }
}

setupDatabase();
