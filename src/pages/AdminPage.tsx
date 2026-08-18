import { useState, useEffect, useCallback } from 'react';
import { CalendarDays, Search, LogOut, Loader2, Inbox, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Booking } from '../types';
import {
  getBookingsByDate,
  updateBookingStatus,
  adminSesionActiva,
  adminSalir,
} from '../lib/api';
import { formatPrice } from '../lib/format';
import { Container } from '../components/ui/Section';
import { Skeleton } from '../components/ui/Skeleton';
import LoginGate from '../components/admin/LoginGate';
import BookingRow from '../components/admin/BookingRow';

export default function AdminPage() {
  const [autenticado, setAutenticado] = useState<boolean | null>(null);
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState('');
  const [actualizando, setActualizando] = useState<string | null>(null);

  useEffect(() => {
    adminSesionActiva().then(setAutenticado);
  }, []);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      setBookings(await getBookingsByDate(fecha));
    } catch (e: any) {
      // Antes se rellenaba con citas de ejemplo: en un panel de gestión eso es
      // peor que un error, porque parecen reservas reales.
      setBookings([]);
      if (String(e?.message).includes('401')) setAutenticado(false);
      else setError('No pudimos cargar la agenda. Reintenta en unos segundos.');
    } finally {
      setCargando(false);
    }
  }, [fecha]);

  useEffect(() => {
    if (autenticado) cargar();
  }, [autenticado, cargar]);

  async function cambiarEstado(id: string, estado: Booking['status']) {
    setActualizando(id);
    try {
      await updateBookingStatus(id, estado);
      await cargar();
    } catch {
      setError('No se pudo actualizar la cita.');
    } finally {
      setActualizando(null);
    }
  }

  async function salir() {
    try {
      await adminSalir();
    } finally {
      setAutenticado(false);
      setBookings([]);
    }
  }

  if (autenticado === null) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-crema-100">
        <Loader2 size={30} strokeWidth={1.3} className="animate-spin text-rosa-400" aria-hidden="true" />
        <span className="sr-only">Verificando sesión…</span>
      </div>
    );
  }

  if (!autenticado) return <LoginGate onEntrar={() => setAutenticado(true)} />;

  const visibles = bookings.filter((b) => {
    const q = busqueda.toLowerCase();
    return (
      b.client_name?.toLowerCase().includes(q) || b.client_email?.toLowerCase().includes(q)
    );
  });

  const metricas = [
    { label: 'Citas del día', valor: String(bookings.length) },
    { label: 'Confirmadas', valor: String(bookings.filter((b) => b.status === 'confirmed').length) },
    { label: 'Pendientes', valor: String(bookings.filter((b) => b.status === 'pending').length) },
    {
      label: 'Ingresos del día',
      valor: formatPrice(
        bookings.filter((b) => b.deposit_paid).reduce((t, b) => t + Number(b.total_amount || 0), 0)
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-crema-100 py-10 md:py-14">
      <Container>
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="texto-3 text-tinta-900">Panel de administración</h1>
            <p className="mt-1 texto--1 text-tinta-600">Gestiona la agenda de Itablooom Studio</p>
          </div>
          <button
            onClick={salir}
            className="inline-flex items-center gap-2 rounded-full border border-tinta-900/20 px-4 py-2 texto--1 font-medium text-tinta-700 transition-all duration-200 hover:border-tinta-900 hover:text-tinta-900 active:scale-95"
          >
            <LogOut size={15} strokeWidth={1.5} aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>

        <div className="mb-6 grid gap-3 rounded-2xl border border-tinta-900/8 bg-crema-50 p-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block texto--1 font-medium text-tinta-700">Fecha</span>
            <span className="relative block">
              <CalendarDays
                size={16}
                strokeWidth={1.5}
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-tinta-400"
              />
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full rounded-xl border border-tinta-900/15 bg-crema-50 py-2.5 pl-11 pr-4 texto--1 text-tinta-900 transition-colors duration-200 focus:border-rosa-400 focus:outline-none"
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block texto--1 font-medium text-tinta-700">Buscar</span>
            <span className="relative block">
              <Search
                size={16}
                strokeWidth={1.5}
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-tinta-400"
              />
              <input
                type="search"
                placeholder="Nombre o correo…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full rounded-xl border border-tinta-900/15 bg-crema-50 py-2.5 pl-11 pr-4 texto--1 text-tinta-900 placeholder:text-tinta-400 transition-colors duration-200 focus:border-rosa-400 focus:outline-none"
              />
            </span>
          </label>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {metricas.map((m) => (
            <div key={m.label} className="rounded-2xl border border-tinta-900/8 bg-crema-50 p-4">
              <p className="texto--1 text-tinta-500">{m.label}</p>
              {cargando ? (
                <Skeleton className="mt-1 h-7 w-20" />
              ) : (
                <p className="font-display texto-2 leading-tight text-tinta-900">{m.valor}</p>
              )}
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-tinta-900/8 bg-crema-50">
          <div className="border-b border-tinta-900/8 px-5 py-4">
            <h2 className="texto-1 capitalize text-tinta-900">
              {format(new Date(fecha + 'T12:00:00'), "EEEE d 'de' MMMM, yyyy", { locale: es })}
            </h2>
          </div>

          {error && (
            <p role="alert" className="flex items-center gap-2 bg-rosa-100 px-5 py-3 texto--1 text-tinta-800">
              <AlertCircle size={15} strokeWidth={1.5} className="shrink-0 text-rosa-600" aria-hidden="true" />
              {error}
            </p>
          )}

          {cargando ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : visibles.length === 0 ? (
            <div className="flex flex-col items-center px-5 py-14 text-center">
              <Inbox size={26} strokeWidth={1.3} className="mb-3 text-tinta-400" aria-hidden="true" />
              <p className="texto--1 text-tinta-600">
                {busqueda ? 'Ninguna cita coincide con la búsqueda.' : 'No hay citas para esta fecha.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-tinta-900/8">
              {visibles.map((b) => (
                <BookingRow
                  key={b.id}
                  booking={b}
                  onEstado={cambiarEstado}
                  actualizando={actualizando === b.id}
                />
              ))}
            </ul>
          )}
        </div>
      </Container>
    </div>
  );
}
