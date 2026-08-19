import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CreditCard, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { Service, TimeSlot } from '../types';
import { getServices, getAvailableTimeSlots, createPreferenceWithOfflineSupport } from '../lib/api';
import { Container } from '../components/ui/Section';
import StepIndicator from '../components/booking/StepIndicator';
import ServiceStep from '../components/booking/ServiceStep';
import DateTimeStep from '../components/booking/DateTimeStep';
import DetailsStep, { type DatosCliente } from '../components/booking/DetailsStep';
import { formatPrice, formatDuration } from '../lib/format';
import { CalendarDays, Clock3 } from 'lucide-react';
import { es } from 'date-fns/locale';

const TITULOS = ['Elige tu tratamiento', 'Fecha y hora', 'Tus datos'];

export default function BookingPage() {
  const [searchParams] = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);

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
  });

  useEffect(() => {
    getServices()
      .then(setServices)
      .catch(() => setError('No pudimos cargar los tratamientos. Recargá la página.'))
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
   * viejo. El offset compensa la altura del navbar sticky, que si no tapa el
   * encabezado del paso.
   */
  const montado = useRef(false);
  useEffect(() => {
    if (!montado.current) {
      montado.current = true;
      return;
    }
    const el = formRef.current;
    if (!el) return;
    const destino = el.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top: Math.max(destino, 0), behavior: 'smooth' });
  }, [paso]);

  function avanzar() {
    setPaso(paso + 1);
    setError('');
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (paso < 3) {
      avanzar();
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
      });
      window.location.href = init_point;
    } catch {
      setError('No pudimos iniciar el pago. Revisa tu conexión e intentá nuevamente.');
      setProcesando(false);
    }
  }

  function volver() {
    setPaso(paso - 1);
    setError('');
  }

  return (
    <div className="min-h-screen bg-crema-100 py-10 md:py-16">
      <Container className="max-w-2xl">
        <header className="mb-8 text-center">
          <p className="texto--1 mb-2 font-medium uppercase tracking-[0.2em] text-dorado-700">
            Reserva tu hora
          </p>
          <h1 className="texto-3 text-tinta-900">{TITULOS[paso - 1]}</h1>
        </header>

        <StepIndicator actual={paso} />

        {/* Resumen compacto siempre visible arriba del form */}
        {service && (
          <div className="mt-6 rounded-2xl border border-tinta-900/8 bg-crema-50/80 px-4 py-3 sm:flex sm:items-center sm:justify-center sm:gap-4 sm:text-center">
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              <span className="texto--1 font-medium text-tinta-900">{service.name}</span>
              <span className="hidden text-tinta-300 sm:inline">·</span>
              <span className="texto--1 text-tinta-500">{formatDuration(service.duration_minutes)}</span>
              {fecha && (
                <>
                  <span className="hidden text-tinta-300 sm:inline">·</span>
                  <span className="flex items-center gap-1 texto--1 text-tinta-500">
                    <CalendarDays size={12} strokeWidth={1.5} />
                    {format(fecha, "EEE d MMM", { locale: es })}
                  </span>
                </>
              )}
              {hora && (
                <>
                  <span className="hidden text-tinta-300 sm:inline">·</span>
                  <span className="flex items-center gap-1 texto--1 text-tinta-500">
                    <Clock3 size={12} strokeWidth={1.5} />
                    {hora}
                  </span>
                </>
              )}
            </div>
            <span className="mt-2 block text-center font-display texto-1 text-tinta-900 sm:mt-0">
              {formatPrice(service.price)}
            </span>
          </div>
        )}

        <form ref={formRef} onSubmit={onSubmit} className="mt-6">
          <div className="rounded-3xl border border-tinta-900/8 bg-crema-50/70 p-4 shadow-[0_20px_60px_-40px_rgba(20,16,14,0.5)] sm:p-7">
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
          </div>

          {error && (
            <p
              role="alert"
              className="anim-entrada mt-4 flex items-center gap-2 rounded-xl bg-crema-200 px-4 py-3 texto--1 text-tinta-800"
            >
              <AlertCircle size={16} strokeWidth={1.5} className="shrink-0 text-dorado-700" aria-hidden="true" />
              {error}
            </p>
          )}

          <div className="mt-5 flex items-center justify-between gap-3">
            {paso > 1 ? (
              <button
                type="button"
                onClick={volver}
                className="inline-flex items-center gap-1.5 rounded-full border border-tinta-900/20 px-5 py-3 texto--1 font-medium text-tinta-700 transition-all duration-200 ease-out hover:border-tinta-900 hover:text-tinta-900 active:scale-95"
              >
                <ChevronLeft size={16} strokeWidth={1.5} aria-hidden="true" />
                Atrás
              </button>
            ) : (
              <span />
            )}

            <button
              type="submit"
              disabled={!pasoCompleto || procesando}
              className="inline-flex items-center gap-2 rounded-full bg-tinta-900 px-7 py-3 texto-0 font-medium text-crema-100 shadow-sm transition-all duration-200 ease-out hover:bg-tinta-800 hover:shadow-md active:scale-95 disabled:pointer-events-none disabled:opacity-40"
            >
              {procesando ? (
                <>
                  <Loader2 size={17} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />
                  Procesando…
                </>
              ) : paso === 3 ? (
                <>
                  <CreditCard size={17} strokeWidth={1.5} aria-hidden="true" />
                  Pagar
                </>
              ) : (
                <>
                  Continuar
                  <ChevronRight size={16} strokeWidth={1.5} aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </form>
      </Container>
    </div>
  );
}
