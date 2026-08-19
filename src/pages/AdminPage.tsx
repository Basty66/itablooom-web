import { useState, useEffect, useCallback } from 'react';
import { CalendarDays, Search, LogOut, Loader2, Inbox, AlertCircle, TrendingUp, Users, Star, DollarSign, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Booking } from '../types';
import { getBookingsByDate, adminSesionActiva, adminSalir, getAdminStats, type AdminStats } from '../lib/api';
import { formatPrice } from '../lib/format';
import { Container } from '../components/ui/Section';
import { Skeleton } from '../components/ui/Skeleton';
import LoginGate from '../components/admin/LoginGate';

/** Parsea booking_date sin importar si viene como string ISO o Date. */
function parseBookingDate(raw: string | Date | null | undefined): Date | null {
  if (!raw) return null;
  if (raw instanceof Date) return new Date(raw.getFullYear(), raw.getMonth(), raw.getDate());
  const s = String(raw).split('T')[0];
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function StatCard({ icono: Icono, label, valor, loading }: { icono: typeof TrendingUp; label: string; valor: string; loading?: boolean }) {
  return (
    <div className="rounded-2xl border border-tinta-900/8 bg-crema-50 p-4">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-crema-200">
          <Icono size={15} strokeWidth={1.5} className="text-dorado-700" aria-hidden="true" />
        </span>
        <p className="texto--1 text-tinta-500">{label}</p>
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-7 w-20" />
      ) : (
        <p className="mt-2 font-display texto-2 leading-tight text-tinta-900">{valor}</p>
      )}
    </div>
  );
}

export default function AdminPage() {
  const [autenticado, setAutenticado] = useState<boolean | null>(null);
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState('');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [cargandoStats, setCargandoStats] = useState(true);

  useEffect(() => {
    adminSesionActiva().then(setAutenticado);
  }, []);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      setBookings(await getBookingsByDate(fecha));
    } catch (e: any) {
      setBookings([]);
      if (String(e?.message).includes('401')) setAutenticado(false);
      else setError('No pudimos cargar la agenda. Reintenta en unos segundos.');
    } finally {
      setCargando(false);
    }
  }, [fecha]);

  const cargarStats = useCallback(async () => {
    setCargandoStats(true);
    const data = await getAdminStats();
    if (data) setStats(data);
    setCargandoStats(false);
  }, []);

  useEffect(() => {
    if (autenticado) {
      cargar();
      cargarStats();
    }
  }, [autenticado, cargar, cargarStats]);

  async function salir() {
    try {
      await adminSalir();
    } finally {
      setAutenticado(false);
      setBookings([]);
      setStats(null);
    }
  }

  if (autenticado === null) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-crema-100">
        <Loader2 size={30} strokeWidth={1.3} className="animate-spin text-dorado-500" aria-hidden="true" />
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

  const ingresosHoy = bookings
    .filter((b) => b.deposit_paid)
    .reduce((t, b) => t + Number(b.total_amount || 0), 0);

  function enviarRecordatorio(b: Booking) {
    const fecha = parseBookingDate(b.booking_date)
      ? format(parseBookingDate(b.booking_date)!, "EEEE d 'de' MMMM", { locale: es })
      : 'próximamente';
    const hora = b.booking_time ? String(b.booking_time).slice(0, 5) : '';
    const msg = `Hola ${b.client_name}, te recordamos tu cita en Itablooom Studio el ${fecha} a las ${hora}. ¡Te esperamos! 💅✨\n\nSi necesitás reagendar, entrá a: https://itablooom-web.vercel.app/reagendar`;
    const phone = (b.client_phone || '').replace(/[^0-9]/g, '');
    window.open(`https://api.whatsapp.com/send?phone=56${phone.startsWith('9') ? '' : '9'}${phone}&text=${encodeURIComponent(msg)}`, '_blank');
  }

  return (
    <div className="min-h-screen bg-crema-100 py-10 md:py-14">
      <Container>
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="texto-3 text-tinta-900">Panel</h1>
            <p className="mt-1 texto--1 text-tinta-600">Itablooom Studio</p>
          </div>
          <button
            onClick={salir}
            className="inline-flex items-center gap-2 rounded-full border border-tinta-900/20 px-4 py-2 texto--1 font-medium text-tinta-700 transition-all duration-200 hover:border-tinta-900 hover:text-tinta-900 active:scale-95"
          >
            <LogOut size={15} strokeWidth={1.5} aria-hidden="true" />
            Salir
          </button>
        </div>

        {/* Dashboard */}
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            icono={DollarSign}
            label="Hoy"
            valor={formatPrice(ingresosHoy)}
            loading={cargando}
          />
          <StatCard
            icono={TrendingUp}
            label="Este mes"
            valor={stats ? `${stats.ingresosMes.count} citas · ${formatPrice(stats.ingresosMes.total)}` : '—'}
            loading={cargandoStats}
          />
          <StatCard
            icono={Users}
            label="Clientes"
            valor={stats ? String(stats.clientesTotales) : '—'}
            loading={cargandoStats}
          />
          <StatCard
            icono={Star}
            label="Top servicio"
            valor={stats?.serviciosTop?.[0]?.name || '—'}
            loading={cargandoStats}
          />
        </div>

        {/* Gráfico semanal simple */}
        {stats && stats.ingresosSemana.length > 0 && (
          <div className="mb-8 rounded-2xl border border-tinta-900/8 bg-crema-50 p-5">
            <h2 className="mb-4 texto-1 text-tinta-900">Últimos 7 días</h2>
            <div className="flex items-end gap-2" style={{ height: 120 }}>
              {stats.ingresosSemana.map((dia) => {
                const maxRevenue = Math.max(...stats.ingresosSemana.map((d) => Number(d.total)));
                const height = maxRevenue > 0 ? (Number(dia.total) / maxRevenue) * 100 : 0;
                return (
                  <div key={dia.date} className="flex flex-1 flex-col items-center gap-1">
                    <span className="texto--2 text-tinta-500">{formatPrice(Number(dia.total))}</span>
                    <div
                      className="w-full rounded-t-lg bg-dorado-400 transition-all duration-500"
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                    <span className="texto--2 text-tinta-400">
                      {format(parseBookingDate(dia.date) || new Date(), 'EEE', { locale: es })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Servicios más pedidos */}
        {stats && stats.serviciosTop.length > 0 && (
          <div className="mb-8 rounded-2xl border border-tinta-900/8 bg-crema-50 p-5">
            <h2 className="mb-4 texto-1 text-tinta-900">Servicios más pedidos</h2>
            <div className="space-y-3">
              {stats.serviciosTop.map((s, i) => (
                <div key={s.name} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-crema-200 texto--1 font-medium text-dorado-700">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="texto-0 font-medium text-tinta-900 truncate">{s.name}</p>
                    <p className="texto--1 text-tinta-500">{s.count} citas · {formatPrice(Number(s.revenue))}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filtros */}
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
                className="w-full rounded-xl border border-tinta-900/15 bg-crema-50 py-2.5 pl-11 pr-4 texto--1 text-tinta-900 transition-colors duration-200 focus:border-dorado-500 focus:outline-none"
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
                className="w-full rounded-xl border border-tinta-900/15 bg-crema-50 py-2.5 pl-11 pr-4 texto--1 text-tinta-900 placeholder:text-tinta-400 transition-colors duration-200 focus:border-dorado-500 focus:outline-none"
              />
            </span>
          </label>
        </div>

        {/* Lista de citas del día */}
        <div className="overflow-hidden rounded-2xl border border-tinta-900/8 bg-crema-50">
          <div className="border-b border-tinta-900/8 px-5 py-4">
            <h2 className="texto-1 capitalize text-tinta-900">
              {format(parseBookingDate(fecha) || new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}
            </h2>
          </div>

          {error && (
            <p role="alert" className="flex items-center gap-2 bg-crema-200 px-5 py-3 texto--1 text-tinta-800">
              <AlertCircle size={15} strokeWidth={1.5} className="shrink-0 text-dorado-700" aria-hidden="true" />
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
                <li key={b.id} className="flex items-center gap-4 px-5 py-4">
                  <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-crema-200">
                    <span className="texto--2 font-medium tabular-nums text-tinta-900">
                      {b.booking_time ? String(b.booking_time).slice(0, 5) : '—'}
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="texto-0 font-medium text-tinta-900">{b.client_name}</p>
                    <p className="texto--1 text-tinta-600">{b.service_name || 'Servicio'}</p>
                    <p className="texto--1 text-tinta-500">{b.client_phone}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      {b.status === 'confirmed' && (
                        <button
                          onClick={() => enviarRecordatorio(b)}
                          title="Enviar recordatorio por WhatsApp"
                          className="rounded-full bg-emerald-100 p-2 text-emerald-700 transition-all duration-200 hover:bg-emerald-200 active:scale-95"
                        >
                          <MessageCircle size={15} strokeWidth={1.5} aria-hidden="true" />
                        </button>
                      )}
                      <span className={`inline-block rounded-full px-3 py-1 texto--1 font-medium ${
                        b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-900'
                        : b.status === 'pending' ? 'bg-amber-100 text-amber-900'
                        : b.status === 'cancelled' ? 'bg-tinta-900/8 text-tinta-600'
                        : 'bg-dorado-200 text-tinta-900'
                      }`}>
                        {b.status === 'confirmed' ? 'Confirmada'
                          : b.status === 'pending' ? 'Pendiente'
                          : b.status === 'cancelled' ? 'Cancelada'
                          : 'Completada'}
                      </span>
                    </div>
                    <p className="mt-1 texto--1 text-tinta-500">{formatPrice(Number(b.total_amount || 0))}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </div>
  );
}
