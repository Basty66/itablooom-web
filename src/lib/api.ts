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
  paymentType?: 'deposit' | 'full';
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
    return await apiFetch(`/api/bookings/${bookingId}?action=payment-status`, {}, 1, 1000);
  } catch {
    return { status: 'pending', deposit_paid: false };
  }
}

// ============================================
// RESERVAS
// ============================================

export async function getBookingById(id: string): Promise<Booking | null> {
  try {
    return await apiFetch(`/api/bookings?id=${id}`);
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
  try {
    const pending = getPendingBookings();
    pending.push({ ...data, timestamp: Date.now() });
    localStorage.setItem('pendingBookings', JSON.stringify(pending));
  } catch { /* quota exceeded or private browsing */ }
}

function getPendingBookings(): Record<string, unknown>[] {
  if (!IS_BROWSER) return [];
  try {
    return JSON.parse(localStorage.getItem('pendingBookings') || '[]');
  } catch {
    localStorage.removeItem('pendingBookings');
    return [];
  }
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

/**
 * Intenta reservar y, solo si falla por red, guarda la reserva para reintentar.
 *
 * Antes se hacía un ping previo a /api/health. Ese endpoint se eliminó para
 * bajar del límite de 12 funciones de Vercel, así que el ping devolvía 404,
 * `res.ok` era false y TODA reserva moría con "Sin conexión" sin llegar nunca
 * a Mercado Pago.
 *
 * Preguntar por adelantado si hay internet era además redundante: la propia
 * petición ya lo responde, y de paso ahorramos un viaje por reserva.
 */
export async function createPreferenceWithOfflineSupport(
  data: Parameters<typeof createPreference>[0]
) {
  try {
    return await createPreference(data);
  } catch (err) {
    // Un 409 (horario ya tomado) o un 400 son respuestas del servidor: hay
    // conexión y reintentar no ayuda, así que el error debe llegar al usuario.
    // Solo guardamos como pendiente cuando el navegador no pudo ni salir.
    const sinRed =
      (IS_BROWSER && !navigator.onLine) ||
      err instanceof TypeError ||
      (err instanceof DOMException && err.name === 'TimeoutError');

    if (sinRed) {
      savePendingBooking(data as unknown as Record<string, unknown>);
      throw new Error(
        'Sin conexión. Tu reserva se guardó y se procesará cuando vuelva la internet.'
      );
    }
    throw err;
  }
}

if (IS_BROWSER) {
  window.addEventListener('online', () => syncPendingBookings());
}

// ============================================
// SESIÓN DE ADMINISTRACIÓN
// ============================================

/**
 * Estas usan fetch directo y no apiFetch: un 401 es una respuesta legítima
 * ("contraseña incorrecta"), no un fallo de red que convenga reintentar.
 *
 * `credentials: 'same-origin'` va explícito para dejar claro que el token
 * viaja en la cookie HttpOnly, no en el cuerpo ni en localStorage.
 */
export async function adminSesionActiva(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/session`, {
      credentials: 'same-origin',
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.activa === true;
  } catch {
    return false;
  }
}

export async function adminIngresar(password: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/session`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json().catch(() => ({}));
    return res.ok ? { ok: true } : { ok: false, error: data.error || 'No se pudo iniciar sesión' };
  } catch {
    return { ok: false, error: 'Sin conexión con el servidor' };
  }
}

export async function adminSalir(): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/admin/session`, {
      method: 'DELETE',
      credentials: 'same-origin',
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    // Si falla, la cookie expira sola por Max-Age.
  }
}

// ============================================
// ESTADÍSTICAS DE ADMIN
// ============================================

export interface AdminStats {
  ingresosSemana: { date: string; total: number; count: number }[];
  ingresosMes: { total: number; count: number };
  serviciosTop: { name: string; count: number; revenue: number }[];
  citasHoy: { total: number; confirmed: number; pending: number };
  clientesTotales: number;
}

export async function getAdminStats(): Promise<AdminStats | null> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/stats`, {
      credentials: 'same-origin',
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ============================================
// GESTIÓN DE PAGOS Y ASISTENCIA (requiere sesión)
// ============================================

export type MetodoPagoSaldo = 'mp' | 'cash' | 'transfer';

/** Calcula el saldo en vez de leerlo: la columna no existe a propósito. */
export function saldoPendiente(b: Booking): number {
  return Math.max(Number(b.total_amount || 0) - Number(b.deposit_amount || 0), 0);
}

async function accionReserva(
  id: string,
  accion: string,
  body?: Record<string, unknown>
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/bookings/${id}?action=${accion}`, {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json().catch(() => ({}));
    return res.ok ? { ok: true } : { ok: false, error: data.error || `HTTP ${res.status}` };
  } catch {
    return { ok: false, error: 'Sin conexión con el servidor' };
  }
}

/** Registra el cobro del saldo y deja la cita como completada. */
export function registrarPagoSaldo(id: string, method: MetodoPagoSaldo) {
  return accionReserva(id, 'remaining-payment', { method });
}

/** Marca inasistencia: el depósito queda como ingreso y el horario se libera. */
export function marcarNoShow(id: string) {
  return accionReserva(id, 'no-show');
}

export function cambiarEstadoReserva(id: string, status: Booking['status']) {
  return accionReserva(id, 'status', { status });
}

// ============================================
// BLOQUEOS DE AGENDA (requiere sesión)
// ============================================

export interface Bloqueo {
  id: string;
  date: string;
  time_start: string;
  time_end: string;
  reason?: string | null;
}

export async function getBloqueos(date: string): Promise<Bloqueo[]> {
  try {
    const res = await fetch(`${API_BASE}/api/blocks?date=${date}`, {
      credentials: 'same-origin',
      signal: AbortSignal.timeout(15000),
    });
    return res.ok ? await res.json() : [];
  } catch {
    return [];
  }
}

/** El bloqueo se espeja como evento en Google Calendar. */
export async function crearBloqueo(datos: {
  date: string;
  timeStart: string;
  timeEnd: string;
  reason?: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/blocks`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
      signal: AbortSignal.timeout(20000),
    });
    const data = await res.json().catch(() => ({}));
    return res.ok ? { ok: true } : { ok: false, error: data.error || 'No se pudo bloquear' };
  } catch {
    return { ok: false, error: 'Sin conexión con el servidor' };
  }
}

export async function borrarBloqueo(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/blocks?id=${id}`, {
      method: 'DELETE',
      credentials: 'same-origin',
      signal: AbortSignal.timeout(15000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Genera un link de Mercado Pago para que la clienta pague el saldo.
 * El webhook lo reconoce por el sufijo `_remaining` y no lo confunde con la seña.
 */
export async function generarLinkSaldo(
  id: string
): Promise<{ ok: boolean; init_point?: string; monto?: number; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/bookings/${id}?action=remaining-link`, {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      signal: AbortSignal.timeout(20000),
    });
    const data = await res.json().catch(() => ({}));
    return res.ok
      ? { ok: true, init_point: data.init_point, monto: data.monto }
      : { ok: false, error: data.error || 'No se pudo generar el link' };
  } catch {
    return { ok: false, error: 'Sin conexión con el servidor' };
  }
}
