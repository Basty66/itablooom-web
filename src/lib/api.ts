import type { Service, Booking, TimeSlot } from '../types';

const IS_BROWSER = typeof window !== 'undefined';
const API_BASE = IS_BROWSER ? '' : 'http://localhost:3001';

// ============================================
// UTILIDADES DE RED
// ============================================

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retries = 2,
  delay = 1000
): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        signal: AbortSignal.timeout(30000),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(body.error || `HTTP ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      if (i === retries) throw err;
      await new Promise((r) => setTimeout(r, delay * (i + 1)));
    }
  }

  throw new Error('Max retries exceeded');
}

async function checkConnection(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/health`, {
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ============================================
// SERVICIOS
// ============================================

export async function getServices(): Promise<Service[]> {
  return apiFetch<Service[]>('/api/services');
}

// ============================================
// HORARIOS
// ============================================

export async function getAvailableTimeSlots(date: string, serviceId: string): Promise<TimeSlot[]> {
  return apiFetch<TimeSlot[]>(`/api/time-slots?date=${date}&serviceId=${serviceId}`);
}

// ============================================
// PAGOS
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
  return apiFetch('/api/create-preference', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function checkPaymentStatus(
  bookingId: string
): Promise<{ status: string; deposit_paid: boolean }> {
  try {
    return await apiFetch(`/api/payment-status/${bookingId}`, {}, 1, 1000);
  } catch {
    return { status: 'pending', deposit_paid: false };
  }
}

// ============================================
// RESERVAS
// ============================================

export async function getBookingById(id: string): Promise<Booking | null> {
  try {
    return await apiFetch(`/api/bookings/${id}`);
  } catch {
    return null;
  }
}

export async function getBookingsByDate(date: string): Promise<Booking[]> {
  return apiFetch<Booking[]>(`/api/bookings?date=${date}`);
}

export async function updateBookingStatus(id: string, status: Booking['status']): Promise<void> {
  await apiFetch('/api/bookings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status }),
  });
}

// ============================================
// SYNC RESERVAS PENDIENTES (offline)
// ============================================

function savePendingBooking(data: Record<string, unknown>): void {
  if (!IS_BROWSER) return;
  const pending = JSON.parse(localStorage.getItem('pendingBookings') || '[]');
  pending.push({ ...data, timestamp: Date.now() });
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

export async function syncPendingBookings(): Promise<void> {
  const pending = getPendingBookings();
  for (const booking of pending) {
    try {
      await createPreference(booking as Parameters<typeof createPreference>[0]);
      removePendingBooking(booking.timestamp as number);
    } catch {
      // keep for next retry
    }
  }
}

export async function createPreferenceWithOfflineSupport(
  data: Parameters<typeof createPreference>[0]
) {
  const connected = await checkConnection();
  if (!connected) {
    savePendingBooking(data as unknown as Record<string, unknown>);
    throw new Error('Sin conexión. Tu reserva se guardó y se procesará cuando vuelva la internet.');
  }
  return createPreference(data);
}

if (IS_BROWSER) {
  window.addEventListener('online', () => syncPendingBookings());
}
