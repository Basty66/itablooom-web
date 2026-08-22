import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CreditCard, Loader2, AlertCircle, Sparkles, Clock3, UserRound, ChevronRight, ChevronUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Service, TimeSlot } from '../types';
import { getServices, getAvailableTimeSlots, createPreferenceWithOfflineSupport } from '../lib/api';
import { Container } from '../components/ui/Section';
import SeccionAcordeon from '../components/booking/SeccionAcordeon';
import ServiceStep from '../components/booking/ServiceStep';
import DateTimeStep from '../components/booking/DateTimeStep';
import PagoStep from '../components/booking/PagoStep';
import DetailsStep, { type DatosCliente } from '../components/booking/DetailsStep';
import { formatPrice, formatDuration } from '../lib/format';

type Paso = 'servicio' | 'horario' | 'pago' | 'datos';

const PROFESIONAL = 'Ignacia Ramírez';

export default function BookingPage() {
  const [searchParams] = useSearchParams();

  const [abierta, setAbierta] = useState<Paso>('servicio');
  const [services, setServices] = useState<Service[]>([]);
  const [cargandoServices, setCargandoServices] = useState(true);
  const [service, setService] = useState<Service | null>(null);
  const [fecha, setFecha] = useState<Date | null>(null);
  const [hora, setHora] = useState('');
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [cargandoSlots, setCargandoSlots] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [resumenAbierto, setResumenAbierto] = useState(false);

  const [datos, setDatos] = useState<DatosCliente>({
    name: '',
    email: '',
    phone: '',
    rut: '',
    notes: '',
    // Abonar es el default: menos fricción para confirmar la hora.
    paymentType: 'deposit',
  });

  useEffect(() => {
    getServices()
      .then(setServices)
      .catch(() => setError('No pudimos cargar los servicios. Recarga la página.'))
      .finally(() => setCargandoServices(false));
  }, []);

  useEffect(() => {
    const id = searchParams.get('service');
    if (id && services.length > 0) {
      const encontrado = services.find((s) => s.id === id);
      // Si llega con el servicio en la URL, ese paso ya está resuelto.
      if (encontrado) {
        setService(encontrado);
        setAbierta((actual) => (actual === 'servicio' ? 'horario' : actual));
      }
    }
  }, [searchParams, services]);

  const cargarSlots = useCallback(async () => {
    if (!fecha || !service) return;
    setCargandoSlots(true);
    try {
      setSlots(await getAvailableTimeSlots(format(fecha, 'yyyy-MM-dd'), service.id));
    } catch {
      setSlots([]);
    } finally {
      setCargandoSlots(false);
    }
  }, [fecha, service]);

  useEffect(() => {
    if (fecha && service) cargarSlots();
  }, [fecha, service, cargarSlots]);

  const listo = {
    servicio: service !== null,
    horario: fecha !== null && hora !== '',
    pago: true, // siempre hay una opción marcada por defecto
    datos: Boolean(datos.name && datos.email && datos.phone),
  };
  const todoListo = listo.servicio && listo.horario && listo.datos;

  const total = Number(service?.price) || 0;
  const abono = Number(service?.deposit_amount) || 0;
  const aPagarAhora = datos.paymentType === 'full' ? total : abono;
  const saldo = datos.paymentType === 'full' ? 0 : Math.max(total - abono, 0);

  /**
   * Qué falta para poder pagar. La barra inferior lo dice explícitamente y
   * lleva a la sección pendiente: un botón gris sin explicación deja a la
   * clienta adivinando por qué no puede avanzar.
   */
  const pendiente: { texto: string; ir: Paso } | null =
    !listo.servicio ? { texto: 'Elige un servicio', ir: 'servicio' }
    : !listo.horario ? { texto: 'Elige día y hora', ir: 'horario' }
    : !listo.datos ? { texto: 'Completa tus datos', ir: 'datos' }
    : null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Si falta algo, el botón abre la sección pendiente en vez de fallar.
    if (pendiente) {
      setAbierta(pendiente.ir);
      return;
    }
    if (!service || !fecha || !hora) return;

    setProcesando(true);
    try {
      const { init_point } = await createPreferenceWithOfflineSupport({
        serviceId: service.id,
        clientName: datos.name,
        clientEmail: datos.email,
        clientPhone: datos.phone,
        clientRut: datos.rut,
        date: format(fecha, 'yyyy-MM-dd'),
        time: hora,
        notes: datos.notes,
        paymentType: datos.paymentType,
      });
      window.location.href = init_point;
    } catch {
      setError('No pudimos iniciar el pago. Revisa tu conexión e intenta nuevamente.');
      setProcesando(false);
    }
  }

  const resumenServicio = service
    ? `${service.name} · ${formatDuration(service.duration_minutes)} · ${formatPrice(service.price)}`
    : undefined;
  const resumenHorario =
    fecha && hora ? `${format(fecha, "EEE d 'de' MMM", { locale: es })} · ${hora}` : undefined;
  const resumenPago = service
    ? datos.paymentType === 'full'
      ? `Pago total · ${formatPrice(total)}`
      : `Abono · ${formatPrice(abono)}`
    : undefined;
  const resumenDatos = listo.datos ? `${datos.name} · ${datos.phone}` : undefined;

  return (
    <div className="min-h-screen bg-tinta-900 py-8 md:py-14">
      <Container>
        <header className="mb-8">
          <p className="texto--1 uppercase espaciado-amplio text-rosa-300">Reserva tu hora</p>
          <h1 className="mt-4 texto-5 text-crema-100">
            ¿Cuándo te
            <br />
            <span className="italic text-dorado-400">esperamos?</span>
          </h1>
        </header>

        <form onSubmit={onSubmit}>
          <div className="flex flex-col gap-10 lg:flex-row lg:gap-12">
            {/* Columna del flujo */}
            <div className="min-w-0 flex-1 space-y-4">
              <SeccionAcordeon
                numero="1"
                titulo="Tu servicio"
                resumen={resumenServicio}
                abierta={abierta === 'servicio'}
                completa={listo.servicio}
                bloqueada={false}
                onAbrir={() => setAbierta('servicio')}
              >
                <ServiceStep
                  services={services}
                  seleccionado={service}
                  onSeleccionar={(s) => {
                    setService(s);
                    setFecha(null);
                    setHora('');
                    setSlots([]);
                    setAbierta('horario');
                  }}
                  cargando={cargandoServices}
                />
              </SeccionAcordeon>

              <SeccionAcordeon
                numero="2"
                titulo="Día y hora"
                resumen={resumenHorario}
                abierta={abierta === 'horario'}
                completa={listo.horario}
                bloqueada={!listo.servicio}
                onAbrir={() => setAbierta('horario')}
              >
                <DateTimeStep
                  fecha={fecha}
                  hora={hora}
                  slots={slots}
                  cargandoSlots={cargandoSlots}
                  onFecha={(d) => {
                    setFecha(d);
                    setHora('');
                  }}
                  onHora={(h) => {
                    setHora(h);
                    setAbierta('pago');
                  }}
                />
              </SeccionAcordeon>

              <SeccionAcordeon
                numero="3"
                titulo="Cómo prefieres pagar"
                resumen={resumenPago}
                abierta={abierta === 'pago'}
                completa={listo.horario}
                bloqueada={!listo.horario}
                onAbrir={() => setAbierta('pago')}
              >
                <PagoStep
                  datos={datos}
                  onCambio={(d) => {
                    setDatos(d);
                    setAbierta('datos');
                  }}
                  service={service}
                />
              </SeccionAcordeon>

              <SeccionAcordeon
                numero="4"
                titulo="Tus datos"
                resumen={resumenDatos}
                abierta={abierta === 'datos'}
                completa={listo.datos}
                bloqueada={!listo.horario}
                onAbrir={() => setAbierta('datos')}
              >
                <DetailsStep datos={datos} onCambio={setDatos} />
              </SeccionAcordeon>

              {error && (
                <p
                  role="alert"
                  className="anim-entrada flex items-center gap-2 rounded-[var(--radius-suave)] border border-dorado-400/30 bg-tinta-850 px-4 py-3 texto--1 text-crema-100/90"
                >
                  <AlertCircle size={16} strokeWidth={1.5} className="shrink-0 text-dorado-300" aria-hidden="true" />
                  {error}
                </p>
              )}
            </div>

            {/* Resumen lateral: solo desde escritorio. En móvil su lugar lo
                toma la barra inferior fija, que no obliga a scrollear. */}
            <aside className="hidden w-[21rem] shrink-0 lg:block">
              <div className="relative overflow-hidden rounded-2xl border border-crema-100/5 bg-tinta-880 p-6 lg:sticky lg:top-28">
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rosa-300/50 to-transparent"
                />
                <h2 className="font-display texto-2 text-crema-100">Tu reserva</h2>
                <p className="mt-1 texto--2 uppercase espaciado-amplio text-nacar-300">Resumen</p>

                <dl className="mt-7 space-y-5">
                  <div className="flex items-start gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-dorado-400/20 bg-tinta-860">
                      <Sparkles size={15} strokeWidth={1.5} className="text-rosa-300" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <dt className="sr-only">Servicio</dt>
                      <dd className="texto-1 text-crema-100">
                        {service ? service.name : <span className="text-nacar-300">Sin elegir</span>}
                      </dd>
                      {service && (
                        <dd className="texto--1 text-nacar-200/70">
                          {formatDuration(service.duration_minutes)}
                        </dd>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-dorado-400/20 bg-tinta-860">
                      <UserRound size={15} strokeWidth={1.5} className="text-rosa-300" aria-hidden="true" />
                    </span>
                    <div>
                      <dt className="texto--2 uppercase espaciado-medio text-nacar-300">Con</dt>
                      <dd className="texto-0 text-crema-100">{PROFESIONAL}</dd>
                    </div>
                  </div>
                </dl>

                <div className="linea-oro my-6 border-t" />

                {fecha && hora ? (
                  <div className="rounded-[var(--radius-suave)] border border-rosa-300/20 bg-tinta-860/60 p-4">
                    <p className="texto--2 uppercase espaciado-amplio text-rosa-300">Horario elegido</p>
                    <p className="mt-1.5 texto-1 capitalize text-crema-100">
                      {format(fecha, "EEEE d 'de' MMMM", { locale: es })}
                    </p>
                    <p className="flex items-center gap-1.5 texto-0 text-nacar-200/80">
                      <Clock3 size={14} strokeWidth={1.5} aria-hidden="true" />
                      {hora}
                    </p>
                  </div>
                ) : (
                  <p className="texto--1 text-nacar-300">Aún no eliges día ni hora.</p>
                )}

                <div className="mt-7 flex items-end justify-between gap-4">
                  <span className="texto--2 uppercase espaciado-amplio text-nacar-300">
                    {datos.paymentType === 'full' ? 'Pagas ahora' : 'Abonas ahora'}
                  </span>
                  <span className="font-display texto-3 text-dorado-400">{formatPrice(aPagarAhora)}</span>
                </div>
                {saldo > 0 && (
                  <p className="mt-1 text-right texto--1 text-nacar-300">
                    Saldo en el local {formatPrice(saldo)}
                  </p>
                )}

                <BotonPagar
                  className="mt-6 w-full"
                  procesando={procesando}
                  pendiente={pendiente}
                  todoListo={todoListo}
                />
              </div>
            </aside>
          </div>

          {/*
            Barra fija en móvil: el monto y la acción quedan siempre a la vista.
            Antes el botón vivía dentro del resumen, que en móvil caía al final
            de la página: avanzar costaba casi dos pantallas de scroll.
          */}
          <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
            {resumenAbierto && (
              <div className="anim-entrada vidrio border-t px-5 pb-3 pt-4">
                <dl className="space-y-2 texto--1">
                  <div className="flex justify-between gap-4">
                    <dt className="text-nacar-300">Servicio</dt>
                    <dd className="min-w-0 truncate text-crema-100">{service?.name ?? '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-nacar-300">Día y hora</dt>
                    <dd className="text-crema-100">{resumenHorario ?? '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-nacar-300">Atiende</dt>
                    <dd className="text-crema-100">{PROFESIONAL}</dd>
                  </div>
                  {saldo > 0 && (
                    <div className="linea-oro flex justify-between gap-4 border-t pt-2">
                      <dt className="text-nacar-300">Saldo en el local</dt>
                      <dd className="text-crema-100">{formatPrice(saldo)}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            <div className="vidrio flex items-center gap-3 border-t px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => setResumenAbierto((v) => !v)}
                aria-expanded={resumenAbierto}
                className="min-w-0 flex-1 text-left"
              >
                <span className="flex items-center gap-1 texto--2 uppercase espaciado-medio text-nacar-300">
                  {datos.paymentType === 'full' ? 'Pagas ahora' : 'Abonas ahora'}
                  <ChevronUp
                    size={13}
                    strokeWidth={1.8}
                    aria-hidden="true"
                    className={`transition-transform duration-300 ${resumenAbierto ? '' : 'rotate-180'}`}
                  />
                </span>
                <span className="block font-display texto-2 text-dorado-400">
                  {formatPrice(aPagarAhora)}
                </span>
              </button>

              <BotonPagar
                className="shrink-0"
                procesando={procesando}
                pendiente={pendiente}
                todoListo={todoListo}
              />
            </div>
          </div>

          {/* Deja aire bajo el contenido para que la barra no tape el final. */}
          <div aria-hidden="true" className="h-24 lg:hidden" />
        </form>
      </Container>
    </div>
  );
}

/** Acción principal: paga si todo está listo, o lleva a lo que falta. */
function BotonPagar({
  procesando,
  pendiente,
  todoListo,
  className = '',
}: {
  procesando: boolean;
  pendiente: { texto: string; ir: string } | null;
  todoListo: boolean;
  className?: string;
}) {
  return (
    <button
      type="submit"
      disabled={procesando}
      className={`brillo brillo-hover flex items-center justify-center gap-2 rounded-[var(--radius-suave)] px-6 py-3.5 texto--1 font-medium uppercase espaciado-medio transition-all duration-300 ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ${
        todoListo
          ? 'bg-rosa-300 text-vino-900 hover:bg-rosa-200'
          : 'border border-dorado-400/45 text-dorado-300 hover:bg-dorado-400/10'
      } ${className}`}
    >
      {procesando ? (
        <>
          <Loader2 size={17} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />
          Procesando…
        </>
      ) : pendiente ? (
        <>
          {pendiente.texto}
          <ChevronRight size={16} strokeWidth={1.5} aria-hidden="true" />
        </>
      ) : (
        <>
          <CreditCard size={17} strokeWidth={1.5} aria-hidden="true" />
          Pagar
        </>
      )}
    </button>
  );
}
