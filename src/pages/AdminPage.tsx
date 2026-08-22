import { useState, useEffect, useCallback } from 'react';
import { CalendarDays, Search, LogOut, Loader2, Inbox, AlertCircle, TrendingUp, Users, Star, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Booking } from '../types';
import { getBookingsByDate, adminSesionActiva, adminSalir, getAdminStats, saldoPendiente, type AdminStats } from '../lib/api';
import { formatPrice } from '../lib/format';
import { Container } from '../components/ui/Section';
import { Skeleton } from '../components/ui/Skeleton';
import LoginGate from '../components/admin/LoginGate';
import Bloqueos from '../components/admin/Bloqueos';
import Finanzas from '../components/admin/Finanzas';
import Gastos from '../components/admin/Gastos';
import CitaFila from '../components/admin/CitaFila';

/** Parsea booking_date sin importar si viene como string ISO o Date. */
function parseBookingDate(raw: string | Date | null | undefined): Date | null {
  if (!raw) return null;
  if (raw instanceof Date) return new Date(raw.getFullYear(), raw.getMonth(), raw.getDate());
  const s = String(raw).split('T')[0];
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function StatCard({ icono: Icono, label, valor, nota, loading }: { icono: typeof TrendingUp; label: string; valor: string; nota?: string; loading?: boolean }) {
  return (
    <div className="linea-oro border superficie p-4">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-tinta-850">
          <Icono size={15} strokeWidth={1.5} className="text-dorado-300" aria-hidden="true" />
        </span>
        <p className="texto--1 text-nacar-300">{label}</p>
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-7 w-20" />
      ) : (
        <>
          <p className="mt-2 font-display texto-2 leading-tight text-crema-100">{valor}</p>
          {nota && <p className="mt-1 texto--2 text-nacar-300">{nota}</p>}
        </>
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
      <div className="flex min-h-[70vh] items-center justify-center bg-tinta-900">
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

  /*
   * Lo cobrado hoy, no el valor de los servicios: si la clienta solo abonó,
   * en caja entró el abono. Sumar total_amount mostraba $36.000 cuando
   * habían entrado $10.000.
   */
  const cobradas = bookings.filter((b) => b.deposit_paid && b.status !== 'cancelled');
  const ingresosHoy = cobradas.reduce(
    (t, b) => t + (b.remaining_paid ? Number(b.total_amount || 0) : Number(b.deposit_amount || 0)),
    0
  );
  const porCobrarHoy = cobradas.reduce((t, b) => t + (b.remaining_paid ? 0 : saldoPendiente(b)), 0);
  // Valor de los servicios del día: lo que se factura si todas pagan el total.
  const agendadoHoy = cobradas.reduce((t, b) => t + Number(b.total_amount || 0), 0);

  function enviarRecordatorio(b: Booking) {
    const fecha = parseBookingDate(b.booking_date)
      ? format(parseBookingDate(b.booking_date)!, "EEEE d 'de' MMMM", { locale: es })
      : 'próximamente';
    const hora = b.booking_time ? String(b.booking_time).slice(0, 5) : '';
    const msg = `Hola ${b.client_name}, te recordamos tu hora en Goddess Studio el ${fecha} a las ${hora}. ¡Te esperamos!\n\nSi necesitas reagendar, entra a: ${window.location.origin}/reagendar`;
    const phone = (b.client_phone || '').replace(/[^0-9]/g, '');
    window.open(`https://api.whatsapp.com/send?phone=56${phone.startsWith('9') ? '' : '9'}${phone}&text=${encodeURIComponent(msg)}`, '_blank');
  }

  return (
    <div className="min-h-screen bg-tinta-900 py-10 md:py-14">
      <Container>
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="texto-3 text-crema-100">Panel</h1>
            <p className="mt-1 texto--1 uppercase espaciado-medio text-dorado-300">Goddess Studio</p>
          </div>
          <button
            onClick={salir}
            className="inline-flex items-center gap-2 border border-dorado-400/40 px-4 py-2 texto--1 font-medium text-nacar-200/85 transition-all duration-200 hover:border-dorado-400 hover:text-crema-100 active:scale-95"
          >
            <LogOut size={15} strokeWidth={1.5} aria-hidden="true" />
            Salir
          </button>
        </div>

        {/* Dashboard */}
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            icono={DollarSign}
            label="Cobrado hoy"
            valor={formatPrice(ingresosHoy)}
            nota={
              porCobrarHoy > 0
                ? `de ${formatPrice(agendadoHoy)} agendados · faltan ${formatPrice(porCobrarHoy)}`
                : agendadoHoy > 0
                  ? 'todo cobrado'
                  : undefined
            }
            loading={cargando}
          />
          <StatCard
            icono={TrendingUp}
            label="Cobrado este mes"
            valor={stats ? formatPrice(stats.ingresosMes.total) : '—'}
            nota={
              stats
                ? `${stats.ingresosMes.count} citas` +
                  (Number(stats.ingresosMes.por_cobrar) > 0
                    ? ` · faltan ${formatPrice(Number(stats.ingresosMes.por_cobrar))}`
                    : '')
                : undefined
            }
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

        {stats?.porMetodo && (
          <Finanzas
            datos={stats.porMetodo}
            porCobrar={Number(stats.ingresosMes?.por_cobrar) || 0}
            gastos={Number(stats.gastosMes) || 0}
          />
        )}

        {stats && <Gastos gastos={stats.gastos || []} onCambio={cargarStats} />}

        <Bloqueos fecha={fecha} />


        {/* Gráfico semanal simple */}
        {stats && stats.ingresosSemana.length > 0 && (
          <div className="mb-8 linea-oro border superficie p-5">
            <h2 className="mb-4 texto-1 text-crema-100">Últimos 7 días</h2>
            <div className="flex items-end gap-2" style={{ height: 120 }}>
              {stats.ingresosSemana.map((dia) => {
                const maxRevenue = Math.max(...stats.ingresosSemana.map((d) => Number(d.total)));
                const height = maxRevenue > 0 ? (Number(dia.total) / maxRevenue) * 100 : 0;
                return (
                  <div key={dia.date} className="flex flex-1 flex-col items-center gap-1">
                    <span className="texto--2 text-nacar-300">{formatPrice(Number(dia.total))}</span>
                    <div
                      className="w-full bg-dorado-400 transition-all duration-500"
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                    <span className="texto--2 text-crema-100/40">
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
          <div className="mb-8 linea-oro border superficie p-5">
            <h2 className="mb-4 texto-1 text-crema-100">Servicios más pedidos</h2>
            <div className="space-y-3">
              {stats.serviciosTop.map((s, i) => (
                <div key={s.name} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-tinta-850 texto--1 font-medium text-dorado-300">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="texto-0 font-medium text-crema-100 truncate">{s.name}</p>
                    <p className="texto--1 text-nacar-300">{s.count} citas · {formatPrice(Number(s.revenue))}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="mb-6 grid gap-3 linea-oro border superficie p-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block texto--1 font-medium text-nacar-200/85">Fecha</span>
            <span className="relative block">
              <CalendarDays
                size={16}
                strokeWidth={1.5}
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-crema-100/40"
              />
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full rounded-xl border border-crema-100/15 superficie py-2.5 pl-11 pr-4 texto--1 text-crema-100 transition-colors duration-200 focus:border-dorado-500 focus:outline-none"
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block texto--1 font-medium text-nacar-200/85">Buscar</span>
            <span className="relative block">
              <Search
                size={16}
                strokeWidth={1.5}
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-crema-100/40"
              />
              <input
                type="search"
                placeholder="Nombre o correo…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full rounded-xl border border-crema-100/15 superficie py-2.5 pl-11 pr-4 texto--1 text-crema-100 placeholder:text-crema-100/40 transition-colors duration-200 focus:border-dorado-500 focus:outline-none"
              />
            </span>
          </label>
        </div>

        {/* Lista de citas del día */}
        <div className="linea-oro overflow-hidden border superficie">
          <div className="linea-oro border-b px-5 py-4">
            <h2 className="texto-1 capitalize text-crema-100">
              {format(parseBookingDate(fecha) || new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}
            </h2>
          </div>

          {error && (
            <p role="alert" className="flex items-center gap-2 bg-tinta-850 px-5 py-3 texto--1 text-crema-100/90">
              <AlertCircle size={15} strokeWidth={1.5} className="shrink-0 text-dorado-300" aria-hidden="true" />
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
              <Inbox size={26} strokeWidth={1.3} className="mb-3 text-crema-100/40" aria-hidden="true" />
              <p className="texto--1 text-nacar-200/80">
                {busqueda ? 'Ninguna cita coincide con la búsqueda.' : 'No hay citas para esta fecha.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-crema-100/10">
              {visibles.map((b) => (
                <CitaFila
                  key={b.id}
                  booking={b}
                  onRecordatorio={enviarRecordatorio}
                  onCambio={() => {
                    cargar();
                    cargarStats();
                  }}
                />
              ))}
            </ul>
          )}
        </div>
      </Container>
    </div>
  );
}
