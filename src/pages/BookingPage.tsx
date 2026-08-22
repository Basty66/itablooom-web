import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, CreditCard, Loader2, AlertCircle,
  Sparkles, CalendarDays, Clock3, UserRound,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Service, TimeSlot } from '../types';
import { getServices, getAvailableTimeSlots, createPreferenceWithOfflineSupport } from '../lib/api';
import { Container } from '../components/ui/Section';
import ServiceStep from '../components/booking/ServiceStep';
import DateTimeStep from '../components/booking/DateTimeStep';
import DetailsStep, { type DatosCliente } from '../components/booking/DetailsStep';
import { formatPrice, formatDuration } from '../lib/format';

/** Cada paso trae su rótulo y un titular con la segunda línea acentuada. */
const PASOS = [
  { rotulo: 'Servicio', titulo: 'Elige tu', acento: 'tratamiento' },
  { rotulo: 'Fecha y hora', titulo: '¿Cuándo te', acento: 'esperamos?' },
  { rotulo: 'Tus datos', titulo: 'Solo faltan tus', acento: 'datos' },
];

const PROFESIONAL = 'Ignacia Ramírez';

export default function BookingPage() {
  const [searchParams] = useSearchParams();
  const columnaRef = useRef<HTMLDivElement>(null);

  const [paso, setPaso] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [cargandoServices, setCargandoServices] = useState(true);
  const [service, setService] = useState<Service | null>(null);
  const [fecha, setFecha] = useState<Date | null>(null);
  const [hora, setHora] = useState('');
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [cargandoSlots, setCargandoSlots] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');

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
      if (encontrado) setService(encontrado);
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

  const pasoCompleto =
    paso === 1 ? service !== null
    : paso === 2 ? fecha !== null && hora !== ''
    : Boolean(datos.name && datos.email && datos.phone);

  /*
   * El scroll va en un efecto y no junto a `setPaso`: React aplica el cambio
   * de estado de forma asíncrona, así que llamarlo en el mismo handler
   * scrollea contra el contenido anterior y la clienta queda mirando el paso
   * viejo. El offset compensa la altura del navbar sticky.
   */
  const montado = useRef(false);
  useEffect(() => {
    if (!montado.current) {
      montado.current = true;
      return;
    }
    const el = columnaRef.current;
    if (!el) return;
    const destino = el.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top: Math.max(destino, 0), behavior: 'smooth' });
  }, [paso]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (paso < 3) {
      setPaso(paso + 1);
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

  const total = Number(service?.price) || 0;
  const abono = Number(service?.deposit_amount) || 0;
  const aPagarAhora = datos.paymentType === 'full' ? total : abono;
  const { titulo, acento } = PASOS[paso - 1];

  return (
    <div className="min-h-screen bg-tinta-900 py-10 md:py-14">
      <Container>
        <form onSubmit={onSubmit}>
          {/* Hilo de pasos: rótulos unidos por líneas, con el activo numerado. */}
          <ol className="mb-10 flex flex-wrap items-center gap-3 sm:gap-4">
            {PASOS.map((p, i) => {
              const n = i + 1;
              const activo = n === paso;
              const hecho = n < paso;
              return (
                <li key={p.rotulo} className="flex items-center gap-3 sm:gap-4">
                  {i > 0 && (
                    <span
                      aria-hidden="true"
                      className={`h-px w-6 sm:w-8 ${hecho || activo ? 'bg-rosa-300/30' : 'bg-dorado-400/10'}`}
                    />
                  )}
                  <span
                    aria-current={activo ? 'step' : undefined}
                    /* Los pasos que faltan van igual de legibles que los ya
                       hechos: lo que distingue al actual es el rosa, no que
                       los otros estén desvanecidos. Al 50% quedaban en
                       2.37:1 y no se alcanzaban a leer. */
                    className={`texto--1 uppercase espaciado-amplio transition-colors duration-300 ${
                      activo ? 'text-rosa-300' : 'text-nacar-300'
                    }`}
                  >
                    {activo && <span className="mr-2 tabular-nums">0{n}</span>}
                    {p.rotulo}
                  </span>
                </li>
              );
            })}
          </ol>

          <div className="flex flex-col gap-10 lg:flex-row lg:gap-12">
            <div ref={columnaRef} className="min-w-0 flex-1">
              <div className="vidrio mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-rosa-300" />
                <span className="texto--2 uppercase espaciado-medio text-nacar-200/80">
                  Paso {paso} de 3
                </span>
              </div>

              <h1 className="mb-10 texto-5 text-crema-100">
                {titulo}
                <br />
                <span className="italic text-dorado-400">{acento}</span>
              </h1>

              {paso === 1 && (
                <ServiceStep
                  services={services}
                  seleccionado={service}
                  onSeleccionar={(s) => {
                    setService(s);
                    setFecha(null);
                    setHora('');
                    setSlots([]);
                  }}
                  cargando={cargandoServices}
                />
              )}

              {paso === 2 && (
                <DateTimeStep
                  fecha={fecha}
                  hora={hora}
                  slots={slots}
                  cargandoSlots={cargandoSlots}
                  onFecha={(d) => {
                    setFecha(d);
                    setHora('');
                  }}
                  onHora={setHora}
                />
              )}

              {paso === 3 && (
                <DetailsStep
                  datos={datos}
                  onCambio={setDatos}
                  service={service}
                  fecha={fecha}
                  hora={hora}
                />
              )}

              {error && (
                <p
                  role="alert"
                  className="anim-entrada mt-6 flex items-center gap-2 rounded-[var(--radius-suave)] border border-dorado-400/30 bg-tinta-850 px-4 py-3 texto--1 text-crema-100/90"
                >
                  <AlertCircle size={16} strokeWidth={1.5} className="shrink-0 text-dorado-300" aria-hidden="true" />
                  {error}
                </p>
              )}

              {paso > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setPaso(paso - 1);
                    setError('');
                  }}
                  className="mt-8 inline-flex items-center gap-1.5 rounded-[var(--radius-suave)] border border-crema-100/20 px-5 py-3 texto--1 uppercase espaciado-medio text-nacar-200/85 transition-all duration-200 ease-out hover:border-dorado-400 hover:text-crema-100 active:scale-95"
                >
                  <ChevronLeft size={16} strokeWidth={1.5} aria-hidden="true" />
                  Atrás
                </button>
              )}
            </div>

            {/*
              Resumen fijo al costado: la clienta ve siempre qué lleva elegido
              y cuánto va a pagar. Antes el total aparecía recién al final y
              obligaba a volver atrás para confirmarlo.
            */}
            <aside className="w-full lg:w-[22rem] lg:shrink-0">
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
                  <p className="flex items-center gap-2 texto--1 text-nacar-300">
                    <CalendarDays size={15} strokeWidth={1.5} aria-hidden="true" />
                    Aún no eliges día ni hora.
                  </p>
                )}

                <div className="mt-7 flex items-end justify-between gap-4">
                  <span className="texto--2 uppercase espaciado-amplio text-nacar-300">
                    {datos.paymentType === 'full' ? 'Total' : 'Abono'}
                  </span>
                  <span className="font-display texto-3 text-dorado-400">
                    {formatPrice(aPagarAhora)}
                  </span>
                </div>
                {/* El valor completo solo aparece si queda saldo: repetirlo
                    cuando ya se paga todo confunde más de lo que informa. */}
                {service && datos.paymentType === 'deposit' && total > abono && (
                  <p className="mt-1 text-right texto--1 text-nacar-300">
                    Servicio {formatPrice(total)} · saldo en el local
                  </p>
                )}

                <button
                  type="submit"
                  disabled={!pasoCompleto || procesando}
                  className="brillo brillo-hover mt-6 flex w-full items-center justify-center gap-2 rounded-[var(--radius-suave)] bg-rosa-300 px-6 py-4 texto--1 font-medium uppercase espaciado-medio text-vino-900 transition-all duration-300 ease-out hover:bg-rosa-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
                >
                  {procesando ? (
                    <>
                      <Loader2 size={17} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />
                      Procesando…
                    </>
                  ) : paso === 3 ? (
                    <>
                      <CreditCard size={17} strokeWidth={1.5} aria-hidden="true" />
                      Pagar y reservar
                    </>
                  ) : (
                    <>
                      Continuar
                      <ChevronRight size={16} strokeWidth={1.5} aria-hidden="true" />
                    </>
                  )}
                </button>
              </div>
            </aside>
          </div>
        </form>
      </Container>
    </div>
  );
}
