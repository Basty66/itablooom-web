import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SearchX, Clock3 } from 'lucide-react';
import type { Service } from '../types';
import { getServices } from '../lib/api';
import { CATEGORIAS_GODDESS } from '../lib/categorias';
import ServiceVisual, { etiquetaCategoria } from '../components/ui/ServiceVisual';
import { Container } from '../components/ui/Section';
import { ServiceCardSkeleton } from '../components/ui/Skeleton';
import { formatPrice, formatDuration } from '../lib/format';

/** El catálogo se recorre por rubro, así que "Todos" no aplica acá. */
const RUBROS = CATEGORIAS_GODDESS.filter((c) => c.id !== 'all');

/**
 * Tarjeta del catálogo.
 *
 * A diferencia de la del inicio, el pie es un botón de ancho completo: acá la
 * clienta viene a elegir, no a mirar, y el botón es el remate de la tarjeta.
 */
function TarjetaServicio({ service, prioritaria }: { service: Service; prioritaria: boolean }) {
  return (
    /*
     * Dos formas según el ancho. En móvil la tarjeta es una fila: foto chica a
     * la izquierda y los datos a la derecha. Con la foto arriba a tamaño
     * completo cada tarjeta medía 526px y el catálogo se iba a casi seis
     * pantallas de scroll, con la mayoría del tráfico entrando por teléfono.
     * Desde sm recupera la tarjeta vertical, donde el espacio sobra.
     */
    <article className="group flex overflow-hidden rounded-2xl border border-crema-100/5 bg-tinta-880 transition-all duration-500 ease-out hover:border-dorado-400/30 sm:h-full sm:flex-col sm:hover:-translate-y-2">
      <div className="relative w-[38%] shrink-0 sm:w-full">
        {/* En móvil la miniatura llena el alto de la fila; el componente trae
            su propia proporción, así que acá se recorta con object-cover. */}
        <div className="h-full [&_div]:h-full [&_div]:rounded-none sm:[&_div]:rounded-[var(--radius-foto)] [&_img]:h-full">
          <ServiceVisual
            categoria={service.category}
            imagen={service.image_url}
            nombre={service.name}
            prioritaria={prioritaria}
          />
        </div>
        <span className="chip absolute right-2 top-2 hidden rounded-full px-3 py-1 texto--2 uppercase espaciado-medio backdrop-blur-md sm:right-4 sm:top-4 sm:inline-block">
          {etiquetaCategoria(service.category)}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-6">
        <span className="chip mb-2 w-fit rounded-full px-2.5 py-0.5 texto--2 uppercase espaciado-medio sm:hidden">
          {etiquetaCategoria(service.category)}
        </span>

        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display texto-2 text-crema-100">{service.name}</h3>
          <span className="shrink-0 font-display texto-2 text-dorado-400">
            {formatPrice(service.price)}
          </span>
        </div>

        <p className="mt-1.5 flex items-center gap-1.5 texto--2 uppercase espaciado-medio text-nacar-300 sm:mt-2">
          <Clock3 size={13} strokeWidth={1.5} aria-hidden="true" />
          {formatDuration(service.duration_minutes)}
        </p>

        {/* La descripción completa solo desde sm: en la fila de móvil dos
            líneas alcanzan para decidir y el resto está en el agendador. */}
        <p className="mt-2 line-clamp-2 texto--1 leading-relaxed text-nacar-200/80 sm:mt-4 sm:line-clamp-none sm:texto-0">
          {service.description}
        </p>

        <Link
          to={`/agendar?service=${service.id}`}
          aria-label={`Reservar ${service.name}`}
          className="brillo brillo-hover mt-3 flex w-full items-center justify-center rounded-[var(--radius-suave)] bg-rosa-300 py-2.5 texto--2 font-medium uppercase espaciado-medio text-vino-900 transition-all duration-300 ease-out hover:bg-rosa-200 active:scale-[0.98] sm:mt-6 sm:py-3.5 sm:texto--1"
        >
          Reservar
        </Link>
      </div>
    </article>
  );
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    setCargando(true);
    setError(false);
    try {
      setServices(await getServices());
    } catch {
      setError(true);
    } finally {
      setCargando(false);
    }
  }

  // Solo se muestran los rubros que traen servicios: una sección vacía con su
  // número y su regla se lee como un error de carga.
  const porRubro = RUBROS.map((rubro) => ({
    ...rubro,
    items: services.filter((s) => s.category === rubro.id),
  })).filter((r) => r.items.length > 0);

  return (
    <div className="min-h-screen bg-tinta-900">
      {/* Portada del catálogo: solo tipografía, con un velo rosado detrás. */}
      <section className="relative overflow-hidden px-5 pb-10 pt-10 sm:px-6 sm:pb-16 sm:pt-16 md:pt-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-rosa-500/10 blur-[100px]"
        />
        <div className="relative mx-auto max-w-2xl text-center">
          <p className="texto--1 uppercase espaciado-amplio text-rosa-300">Santuario de belleza</p>
          <h1 className="mt-4 texto-5 text-dorado-400 sm:mt-5">Nuestros servicios</h1>
          <div aria-hidden="true" className="linea-oro mx-auto my-4 w-16 border-t sm:my-6" />
          {/* El párrafo largo se guarda para pantallas grandes: en móvil son
              tres líneas más entre la clienta y el primer servicio. */}
          <p className="texto-0 leading-relaxed text-nacar-200/80 sm:texto-1">
            Uñas, pestañas y cejas con hora reservada.
            <span className="hidden sm:inline">
              {' '}
              Cada servicio muestra su duración y su valor, para que elijas con toda la información a
              la vista.
            </span>
          </p>
        </div>
      </section>

      <Container className="pb-24">
        {cargando && (
          <div className="grid gap-4 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ServiceCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!cargando && error && (
          <div className="mx-auto max-w-md rounded-2xl border border-crema-100/10 bg-tinta-880 p-10 text-center">
            <p className="texto-1 mb-2 text-crema-100">No pudimos cargar los tratamientos</p>
            <p className="mb-6 texto--1 text-nacar-200/80">Revisa tu conexión e inténtalo de nuevo.</p>
            <button
              onClick={cargar}
              className="rounded-[var(--radius-suave)] bg-rosa-300 px-6 py-3 texto--1 font-medium uppercase espaciado-medio text-vino-900 transition-all duration-200 hover:bg-rosa-200 active:scale-95"
            >
              Reintentar
            </button>
          </div>
        )}

        {!cargando && !error && porRubro.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <SearchX size={30} strokeWidth={1.3} className="mb-4 text-nacar-300" aria-hidden="true" />
            <p className="text-nacar-200/80">Todavía no hay tratamientos publicados.</p>
          </div>
        )}

        <div className="space-y-14 sm:space-y-20">
          {porRubro.map((rubro, i) => (
            <section key={rubro.id} className="space-y-6 sm:space-y-10">
              {/* Encabezado de rubro: número, nombre y una regla que se estira
                  hasta el borde, rematada por un punto. */}
              <div className="flex items-center gap-5">
                <span className="texto--1 uppercase espaciado-amplio tabular-nums text-rosa-300">
                  0{i + 1}
                </span>
                <h2 className="font-display texto-4 text-crema-100">{rubro.label}</h2>
                <span aria-hidden="true" className="relative h-px flex-1 bg-dorado-400/20">
                  <span className="absolute right-0 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-dorado-400/50" />
                </span>
              </div>

              <div className="grid gap-4 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
                {rubro.items.map((service, j) => (
                  <TarjetaServicio
                    key={service.id}
                    service={service}
                    prioritaria={i === 0 && j < 3}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </Container>
    </div>
  );
}
