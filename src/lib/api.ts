import sql from './database';
import type { Service, Booking, TimeSlot } from '../types';

// En Vercel, las API routes están en el mismo dominio
// En local, usamos el Express server en puerto 3001
const IS_BROWSER = typeof window !== 'undefined';
const API_BASE = IS_BROWSER
  ? (import.meta.env.VITE_APP_URL || window.location.origin)
  : 'http://localhost:3001';

// ============================================
// UTILIDADES DE RED
// ============================================

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  delay = 1000
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
    }
  }

  throw new Error('Max retries exceeded');
}

async function checkConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

function savePendingBooking(data: Record<string, unknown>): void {
  if (!IS_BROWSER) return;
  const pending = JSON.parse(localStorage.getItem('pendingBookings') || '[]');
  pending.push({ ...data, timestamp: Date.now(), retryCount: 0 });
  localStorage.setItem('pendingBookings', JSON.stringify(pending));
}

function getPendingBookings(): Record<string, unknown>[] {
  if (!IS_BROWSER) return [];
  return JSON.parse(localStorage.getItem('pendingBookings') || '[]');
}

function removePendingBooking(timestamp: number): void {
  if (!IS_BROWSER) return;
  const pending = getPendingBookings().filter((b) => b.timestamp !== timestamp);
  localStorage.setItem('pendingBookings', JSON.stringify(pending));
}

// ============================================
// API DE SERVICIOS
// ============================================

export async function getServices(): Promise<Service[]> {
  try {
    const result = await sql`SELECT * FROM services WHERE active = true ORDER BY category, name`;
    return result as unknown as Service[];
  } catch (error) {
    console.error('Error fetching services:', error);
    throw error;
  }
}

export async function getServiceById(id: string): Promise<Service | null> {
  try {
    const result = await sql`SELECT * FROM services WHERE id = ${id} AND active = true`;
    return (result[0] as unknown as Service) || null;
  } catch (error) {
    console.error('Error fetching service:', error);
    throw error;
  }
}

// ============================================
// API DE HORARIOS
// ============================================

export async function getAvailableTimeSlots(
  date: string,
  serviceId: string
): Promise<TimeSlot[]> {
  try {
    const response = await fetchWithRetry(
      `${API_BASE}/api/time-slots?date=${date}&serviceId=${serviceId}`,
      { method: 'GET' }
    );
    return await response.json();
  } catch (error) {
    console.error('Error fetching time slots:', error);
    const slots: TimeSlot[] = [];
    for (let hour = 9; hour < 19; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const time = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
        slots.push({ time, available: true });
      }
    }
    return slots;
  }
}

// ============================================
// API DE PAGOS
// ============================================

export async function createPreference(data: {
  serviceId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientRut?: string;
  date: string;
  time: string;
  notes?: string;
}): Promise<{ id: string; init_point: string; sandbox_init_point: string; bookingId: string }> {
  const isConnected = await checkConnection();

  if (!isConnected) {
    savePendingBooking(data as unknown as Record<string, unknown>);
    throw new Error(
      'Sin conexión. Tu reserva se guardó y se procesará cuando vuelva la internet.'
    );
  }

  try {
    const response = await fetchWithRetry(
      `${API_BASE}/api/create-preference`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      3,
      2000
    );

    return await response.json();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('Ya existe una reserva')) {
      const pending = getPendingBookings().find(
        (b) =>
          b.clientEmail === data.clientEmail &&
          b.date === data.date &&
          b.time === data.time
      );
      if (pending?.bookingId) {
        throw new Error(`Ya tienes una reserva para este horario. ID: ${pending.bookingId}`);
      }
    }
    throw error;
  }
}

// ============================================
// VERIFICACIÓN DE PAGO
// ============================================

export async function checkPaymentStatus(
  bookingId: string
): Promise<{ status: string; deposit_paid: boolean }> {
  try {
    const response = await fetchWithRetry(
      `${API_BASE}/api/payment-status/${bookingId}`,
      { method: 'GET' },
      2,
      1000
    );
    return await response.json();
  } catch (error) {
    console.error('Error checking payment status:', error);
    return { status: 'pending', deposit_paid: false };
  }
}

// ============================================
// API DE RESERVAS
// ============================================

export async function getBookingById(id: string): Promise<Booking | null> {
  try {
    const result = await sql`
      SELECT b.*, s.name as service_name, s.description as service_description
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      WHERE b.id = ${id}
    `;
    return (result[0] as unknown as Booking) || null;
  } catch (error) {
    console.error('Error fetching booking:', error);
    throw error;
  }
}

export async function getBookingsByDate(date: string): Promise<Booking[]> {
  try {
    const result = await sql`
      SELECT b.*, s.name as service_name
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      WHERE b.booking_date = ${date}
      ORDER BY b.booking_time
    `;
    return result as unknown as Booking[];
  } catch (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }
}

export async function updateBookingStatus(
  id: string,
  status: Booking['status']
): Promise<void> {
  try {
    await sql`UPDATE bookings SET status = ${status} WHERE id = ${id}`;
  } catch (error) {
    console.error('Error updating booking status:', error);
    throw error;
  }
}

// ============================================
// SYNC DE RESERVAS PENDIENTES
// ============================================

export async function syncPendingBookings(): Promise<void> {
  const pending = getPendingBookings();

  for (const booking of pending) {
    try {
      await createPreference(booking as Parameters<typeof createPreference>[0]);
      removePendingBooking(booking.timestamp as number);
      console.log(`Synced pending booking: ${booking.clientName}`);
    } catch (error) {
      console.error(`Failed to sync booking: ${booking.clientName}`, error);
    }
  }
}

if (IS_BROWSER) {
  window.addEventListener('online', () => {
    console.log('Connection restored, syncing pending bookings...');
    syncPendingBookings();
  });
}
