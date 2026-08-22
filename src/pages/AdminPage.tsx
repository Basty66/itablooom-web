import { useState, useEffect, useCallback } from 'react';
import {
  CalendarDays, Search, LogOut, Loader2, Inbox, AlertCircle, TrendingUp,
  Users, Star, DollarSign, LayoutDashboard, Wallet, CalendarClock, Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Booking } from '../types';
import { getBookingsByDate, adminSesionActiva, adminSalir, getAdminStats, saldoPendiente, type AdminStats } from '../lib/api';
import { formatPrice } from '../lib/format';
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

/*
 * Solo se listan las secciones que tienen respaldo real en la base. El diseño
 * de referencia traía además Clientas, Servicios y Ajustes, pero no existe
 * tabla de clientas ni CRUD de servicios: serían pantallas con botones que no
 * hacen nada.
 */
const SECCIONES = [
  { id: 'resumen', label: 'Resumen', icono: LayoutDashboard },
  { id: 'agenda', label: 'Agenda', icono: CalendarClock },
  { id: 'finanzas', label: 'Finanzas', icono: Wallet },
] as const;

type Seccion = (typeof SECCIONES)[number]['id'];

/** Línea de tendencia de los últimos días, dibujada a mano en SVG. */
function Sparkline({ valores }: { valores: number[] }) {
  if (valores.length < 2) return null;
  const max = Math.max(...valores, 1);
  const punto = (v: number, i: number) =>
    `${(i / (valores.length - 1)) * 100},${20 - (v / max) * 18}`;
  const linea = valores.map(punto).join(' L');

  return (
    <svg
      viewBox="0 0 100 20"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="h-8 w-full overflow-visible text-dorado-400/50"
    >
      <path d={`M${linea}`} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M${linea} L100,20 L0,20 Z`} fill="currentColor" opacity="0.12" />
    </svg>
  );
}

function TarjetaMetrica({
  icono: Icono,
  label,
  valor,
  nota,
  loading,
  destacada,
  textual,
  children,
}: {
  icono: typeof TrendingUp;
  label: string;
  valor: string;
  nota?: string;
  loading?: boolean;
  /** La tarjeta destacada usa el rosa de relleno en vez del gris tonal. */
  destacada?: boolean;
  /**
   * El valor es un nombre y no una cifra. Va bastante más chico: un título de
   * servicio en tamaño display ocupa cuatro líneas y desborda la tarjeta,
   * mientras que "$10.000" cabe holgado en una.
   */
  textual?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`group relative min-w-0 overflow-hidden rounded-2xl p-6 transition-transform duration-500 hover:-translate-y-1 ${
        destacada ? 'bg-rosa-500/12' : 'bg-tinta-870'
      }`}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-rosa-300/5 blur-2xl transition-colors duration-700 group-hover:bg-rosa-300/10"
      />
      <div className="relative flex items-start justify-between gap-3">
        <p className={`texto--2 uppercase espaciado-amplio ${destacada ? 'text-rosa-300' : 'text-nacar-300'}`}>
          {label}
        </p>
        <Icono
          size={18}
          strokeWidth={1.5}
          aria-hidden="true"
          className={destacada ? 'text-rosa-300' : 'text-dorado-400/60'}
        />
      </div>

      {loading ? (
        <Skeleton className="relative mt-6 h-9 w-24" />
      ) : (
        <div className="relative mt-6">
          <p
            className={`font-display break-words ${
              textual ? 'line-clamp-2 texto-2 leading-snug' : 'texto-4 leading-none'
            } ${destacada ? 'text-rosa-300' : 'text-crema-100'}`}
          >
            {valor}
          </p>
          {nota && <p className="mt-2 texto--1 text-nacar-300">{nota}</p>}
          {children}
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const [autenticado, setAutenticado] = useState<boolean | null>(null);
  const [seccion, setSeccion] = useState<Seccion>('resumen');
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
    return b.client_name?.toLowerCase().includes(q) || b.client_email?.toLowerCase().includes(q);
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
  const agendadoHoy = cobradas.reduce((t, b) => t + Number(b.total_amount || 0), 0);

  function enviarRecordatorio(b: Booking) {
    const dia = parseBookingDate(b.booking_date)
      ? format(parseBookingDate(b.booking_date)!, "EEEE d 'de' MMMM", { locale: es })
      : 'próximamente';
    const hora = b.booking_time ? String(b.booking_time).slice(0, 5) : '';
    const msg = `Hola ${b.client_name}, te recordamos tu hora en Goddess Studio el ${dia} a las ${hora}. ¡Te esperamos!\n\nSi necesitas reagendar, entra a: ${window.location.origin}/reagendar`;
    const phone = (b.client_phone || '').replace(/[^0-9]/g, '');
    window.open(
      `https://api.whatsapp.com/send?phone=56${phone.startsWith('9') ? '' : '9'}${phone}&text=${encodeURIComponent(msg)}`,
      '_blank'
    );
  }

  const recargarTodo = () => {
    cargar();
    cargarStats();
  };

  return (
    <div className="min-h-screen bg-tinta-900">
      {/*
        Barra lateral fija en escritorio. En móvil no cabe, así que las mismas
        secciones bajan a una fila de pestañas bajo el encabezado.
      */}
      <aside className="fixed left-0 top-0 z-40 hidden h-full w-64 flex-col border-r border-dorado-400/15 bg-tinta-950 pt-8 lg:flex">
        <div className="mb-10 px-7">
          <p className="font-display texto-2 uppercase espaciado-medio text-dorado-400">Goddess</p>
          <p className="mt-1 texto--2 uppercase espaciado-amplio text-nacar-300">Panel del estudio</p>
        </div>

        <nav aria-label="Secciones del panel" className="flex flex-1 flex-col gap-1">
          {SECCIONES.map(({ id, label, icono: Icono }) => {
            const activa = seccion === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSeccion(id)}
                aria-current={activa ? 'page' : undefined}
                className={`flex items-center gap-4 border-l-2 px-7 py-4 texto--1 uppercase espaciado-medio transition-all duration-300 ${
                  activa
                    ? 'border-rosa-300 bg-rosa-300/10 text-rosa-300'
                    : 'border-transparent text-nacar-200/80 hover:bg-tinta-880 hover:text-crema-100'
                }`}
              >
                <Icono size={18} strokeWidth={1.5} aria-hidden="true" />
                {label}
              </button>
            );
          })}

          <button
            type="button"
            onClick={salir}
            className="mb-8 mt-auto flex items-center gap-4 border-l-2 border-transparent px-7 py-4 texto--1 uppercase espaciado-medio text-nacar-300 transition-colors duration-300 hover:text-crema-100"
          >
            <LogOut size={18} strokeWidth={1.5} aria-hidden="true" />
            Salir
          </button>
        </nav>
      </aside>

      <div className="lg:pl-64">
        {/* Encabezado con la fecha de trabajo y el buscador siempre a mano. */}
        <header className="vidrio sticky top-0 z-30 border-b">
          <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3 lg:hidden">
              <p className="font-display texto-1 uppercase espaciado-medio text-dorado-400">Goddess</p>
            </div>

            <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
              <label className="relative">
                <span className="sr-only">Buscar clienta</span>
                <Search
                  size={15}
                  strokeWidth={1.5}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-nacar-300"
                />
                <input
                  type="search"
                  placeholder="Nombre o correo…"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="campo w-44 py-2.5 pl-10 pr-3 texto--1 sm:w-56"
                />
              </label>

              <label className="relative">
                <span className="sr-only">Fecha de la agenda</span>
                <CalendarDays
                  size={15}
                  strokeWidth={1.5}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-nacar-300"
                />
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="campo py-2.5 pl-10 pr-3 texto--1"
                />
              </label>

              <button
                onClick={salir}
                className="rounded-[var(--radius-suave)] border border-dorado-400/40 p-2.5 text-nacar-200/85 transition-all duration-200 hover:border-dorado-400 hover:text-crema-100 active:scale-95 lg:hidden"
                aria-label="Cerrar sesión"
              >
                <LogOut size={15} strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Pestañas equivalentes a la barra lateral, solo en móvil. */}
          <nav aria-label="Secciones del panel" className="flex gap-1 overflow-x-auto px-5 pb-3 sm:px-6 lg:hidden">
            {SECCIONES.map(({ id, label, icono: Icono }) => {
              const activa = seccion === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSeccion(id)}
                  aria-current={activa ? 'page' : undefined}
                  className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 texto--2 uppercase espaciado-medio transition-colors duration-300 ${
                    activa ? 'bg-rosa-300/15 text-rosa-300' : 'text-nacar-300 hover:text-crema-100'
                  }`}
                >
                  <Icono size={14} strokeWidth={1.5} aria-hidden="true" />
                  {label}
                </button>
              );
            })}
          </nav>
        </header>

        {/* Tope de ancho: sin él, en un monitor grande las tarjetas de
            métrica y la agenda se estiran hasta perder el ritmo de lectura. */}
        <main className="mx-auto max-w-[1400px] px-5 py-8 sm:px-6 md:py-10">
          {seccion === 'resumen' && (
            <>
              <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h1 className="font-display texto-4 text-crema-100">Resumen del estudio</h1>
                  <p className="mt-1 texto-0 text-nacar-200/80">Cómo va el mes, de un vistazo.</p>
                </div>
                <span className="flex items-center gap-2 texto--2 uppercase espaciado-amplio text-dorado-400">
                  <Sparkles size={15} strokeWidth={1.5} aria-hidden="true" />
                  Datos en vivo
                </span>
              </div>

              <div className="mb-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <TarjetaMetrica
                  icono={DollarSign}
                  label="Cobrado hoy"
                  valor={formatPrice(ingresosHoy)}
                  nota={
                    porCobrarHoy > 0
                      ? `faltan ${formatPrice(porCobrarHoy)} de ${formatPrice(agendadoHoy)}`
                      : agendadoHoy > 0
                        ? 'todo cobrado'
                        : 'sin cobros aún'
                  }
                  loading={cargando}
                />

                <TarjetaMetrica
                  icono={TrendingUp}
                  label="Cobrado este mes"
                  valor={stats ? formatPrice(stats.ingresosMes.total) : '—'}
                  nota={stats ? `${stats.ingresosMes.count} citas` : undefined}
                  loading={cargandoStats}
                >
                  {stats && stats.ingresosSemana.length > 1 && (
                    <div className="mt-3">
                      <Sparkline valores={stats.ingresosSemana.map((d) => Number(d.total))} />
                    </div>
                  )}
                </TarjetaMetrica>

                <TarjetaMetrica
                  icono={Users}
                  label="Clientas"
                  valor={stats ? String(stats.clientesTotales) : '—'}
                  nota="registradas en total"
                  loading={cargandoStats}
                />

                <TarjetaMetrica
                  icono={Star}
                  label="Servicio más pedido"
                  valor={stats?.serviciosTop?.[0]?.name || '—'}
                  nota={
                    stats?.serviciosTop?.[0]
                      ? `${stats.serviciosTop[0].count} citas este mes`
                      : undefined
                  }
                  loading={cargandoStats}
                  destacada
                  textual
                />
              </div>

              <div className="grid gap-5 lg:grid-cols-12">
                {stats && stats.ingresosSemana.length > 0 && (
                  <section className="rounded-2xl bg-tinta-870 p-6 lg:col-span-7">
                    <h2 className="mb-6 font-display texto-2 text-crema-100">Últimos 7 días</h2>
                    <div className="flex items-end gap-3" style={{ height: 140 }}>
                      {stats.ingresosSemana.map((dia) => {
                        const maximo = Math.max(...stats.ingresosSemana.map((d) => Number(d.total)));
                        const alto = maximo > 0 ? (Number(dia.total) / maximo) * 100 : 0;
                        return (
                          <div key={dia.date} className="flex flex-1 flex-col items-center gap-2">
                            <span className="texto--2 tabular-nums text-nacar-300">
                              {formatPrice(Number(dia.total))}
                            </span>
                            <div
                              className="w-full rounded-t-[var(--radius-suave)] bg-gradient-to-t from-dorado-400/40 to-dorado-400 transition-all duration-500"
                              style={{ height: `${Math.max(alto, 3)}%` }}
                            />
                            <span className="texto--2 uppercase espaciado-medio text-nacar-300">
                              {format(parseBookingDate(dia.date) || new Date(), 'EEE', { locale: es })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {stats && stats.serviciosTop.length > 0 && (
                  <section className="rounded-2xl bg-tinta-870 p-6 lg:col-span-5">
                    <h2 className="mb-6 font-display texto-2 text-crema-100">Servicios más pedidos</h2>
                    <ol className="space-y-4">
                      {stats.serviciosTop.map((s, i) => (
                        <li key={s.name} className="flex items-center gap-4">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tinta-860 texto--1 tabular-nums text-dorado-300">
                            {i + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate texto-0 text-crema-100">{s.name}</p>
                            <p className="texto--1 text-nacar-300">
                              {s.count} citas · {formatPrice(Number(s.revenue))}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </section>
                )}
              </div>
            </>
          )}

          {seccion === 'finanzas' && (
            <>
              <div className="mb-8">
                <h1 className="font-display texto-4 text-crema-100">Finanzas</h1>
                <p className="mt-1 texto-0 text-nacar-200/80">
                  Lo que entra, lo que sale y con cuánto quedas.
                </p>
              </div>

              {cargandoStats && <Skeleton className="h-48 rounded-2xl" />}

              {stats?.porMetodo && (
                <Finanzas
                  datos={stats.porMetodo}
                  porCobrar={Number(stats.ingresosMes?.por_cobrar) || 0}
                  gastos={Number(stats.gastosMes) || 0}
                />
              )}

              {stats && <Gastos gastos={stats.gastos || []} onCambio={cargarStats} />}
            </>
          )}

          {seccion === 'agenda' && (
            <>
              <div className="mb-8">
                <h1 className="font-display texto-4 capitalize text-crema-100">
                  {format(parseBookingDate(fecha) || new Date(), "EEEE d 'de' MMMM", { locale: es })}
                </h1>
                <p className="mt-1 texto-0 text-nacar-200/80">
                  {cargando
                    ? 'Cargando la agenda…'
                    : `${visibles.length} ${visibles.length === 1 ? 'cita' : 'citas'} en el día.`}
                </p>
              </div>

              <div className="mb-6 overflow-hidden rounded-2xl bg-tinta-870">
                {error && (
                  <p
                    role="alert"
                    className="flex items-center gap-2 bg-tinta-860 px-5 py-3 texto--1 text-crema-100/90"
                  >
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
                  <div className="flex flex-col items-center px-5 py-16 text-center">
                    <Inbox size={26} strokeWidth={1.3} className="mb-3 text-nacar-300" aria-hidden="true" />
                    <p className="texto--1 text-nacar-200/80">
                      {busqueda
                        ? 'Ninguna cita coincide con la búsqueda.'
                        : 'No hay citas para esta fecha.'}
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-crema-100/8">
                    {visibles.map((b) => (
                      <CitaFila
                        key={b.id}
                        booking={b}
                        onRecordatorio={enviarRecordatorio}
                        onCambio={recargarTodo}
                      />
                    ))}
                  </ul>
                )}
              </div>

              <Bloqueos fecha={fecha} />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
