import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SearchX, Clock3, ChevronRight } from 'lucide-react';
import type { Service } from '../types';
import { getServices } from '../lib/api';
import { CATEGORIAS_GODDESS } from '../lib/categorias';
import ServiceVisual, { etiquetaCategoria } from '../components/ui/ServiceVisual';
import { Container } from '../components/ui/Section';
import Revelar from '../components/ui/Revelar';
import { ServiceCardSkeleton } from '../components/ui/Skeleton';
import { formatPriceRange, formatDuration } from '../lib/format';

/** El catálogo se recorre por rubro, así que "Todos" no aplica acá. */
const RUBROS = CATEGORIAS_GODDESS.filter((c) => c.id !== 'all');

/**
 * Tarjeta del catálogo.
 *
 * A diferencia de la del inicio, el pie es un botón de ancho completo: acá la
 * clienta viene a elegir, no a mirar, y el botón es el remate de la tarjeta.
 */
function TarjetaServicio({ service, prioritaria }: { service: Service; prioritaria: boolean }) {
  /*
   * Hay servicios que se suman a otra hora y no se reservan solos: el
   * visajismo es diseño de cejas que acompaña. Esos siguen mostrándose con su
   * valor —la clienta quiere saber cuánto cuesta agregarlo— pero no son un
   * enlace: llevarla a la reserva prometería un flujo que no termina en nada.
   */
  const esComplemento = Boolean(service.es_complemento);

  /*
   * Dos formas según el ancho. En móvil es una fila corta y toda la tarjeta
   * es el enlace: el dedo acierta en cualquier parte y no hace falta apuntar
   * a un botón chico. Desde sm recupera la tarjeta vertical con foto grande,
   * donde el espacio sobra y la foto vende.
   */
  const forma = 'group flex overflow-hidden rounded-2xl border bg-tinta-880 transition-all duration-500 ease-out sm:h-full sm:flex-col';
  const clases = esComplemento
    ? `${forma} border-cobre-400/20`
    : `${forma} border-crema-100/5 hover:border-cobre-400/30 active:scale-[0.99] sm:active:scale-100 sm:hover:-translate-y-2`;

  const interior = (
    <>
      <div className="relative w-[34%] shrink-0 sm:w-full">
        {/* En móvil la foto llena la columna (sin proporción propia, que
            recalcularía el ancho desde el alto y la desbordaría); desde sm
            recupera el cuadrado con esquinas redondeadas. */}
        <ServiceVisual
          forma="h-full w-full sm:aspect-square sm:h-auto sm:rounded-[var(--radius-foto)]"
          categoria={service.category}
          imagen={service.image_url}
          nombre={service.name}
          prioritaria={prioritaria}
        />
        <span className="chip absolute right-2 top-2 hidden rounded-full px-3 py-1 texto--2 uppercase espaciado-medio backdrop-blur-md sm:right-4 sm:top-4 sm:inline-block">
          {esComplemento ? 'Complemento' : etiquetaCategoria(service.category)}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center p-4 sm:justify-start sm:p-6">
        <span className="chip mb-2 w-fit rounded-full px-2.5 py-0.5 texto--2 uppercase espaciado-medio sm:hidden">
          {esComplemento ? 'Complemento' : etiquetaCategoria(service.category)}
        </span>

        <h3 className="font-display texto-2 text-crema-100 sm:pr-2">{service.name}</h3>

        {/* Duración y precio en una sola línea: en la fila de móvil cada
            renglón extra se paga en altura. */}
        <p className="mt-1.5 flex items-center gap-2 texto--1 sm:mt-2">
          <span className="flex items-center gap-1.5 texto--2 uppercase espaciado-medio text-nacar-300">
            <Clock3 size={13} strokeWidth={1.5} aria-hidden="true" />
            {formatDuration(service.duration_minutes)}
          </span>
          <span aria-hidden="true" className="h-3 w-px bg-cobre-400/25" />
          <span className="font-display texto-1 text-cobre-400 sm:texto-2">
            {esComplemento && '+ '}
            {formatPriceRange(service.price, service.price_max)}
          </span>
        </p>

        <p className="mt-4 hidden texto-0 leading-relaxed text-nacar-200/80 sm:block">
          {service.description}
        </p>

        {esComplemento ? (
          <span className="mt-6 hidden w-full items-center justify-center rounded-[var(--radius-suave)] border border-cobre-400/25 py-3.5 text-center texto--1 leading-relaxed text-nacar-200/85 sm:flex">
            Se agrega a otro servicio
          </span>
        ) : (
          /* Falso botón: el enlace es la tarjeta entera, así que este es solo
             el remate visual y no un control anidado. */
          <span className="brillo brillo-hover mt-6 hidden w-full items-center justify-center rounded-[var(--radius-suave)] bg-rosa-300 py-3.5 texto--1 font-medium uppercase espaciado-medio text-vino-900 transition-all duration-300 ease-out group-hover:bg-rosa-200 sm:flex">
            Reservar
          </span>
        )}
      </div>

      {/* En móvil el remate es una flecha: dice "esto se toca" sin ocupar
          una fila completa de botón. Los complementos no se tocan. */}
      {!esComplemento && (
        <span
          aria-hidden="true"
          className="flex items-center pr-3 text-nacar-300 transition-transform duration-300 group-active:translate-x-0.5 sm:hidden"
        >
          <ChevronRight size={18} strokeWidth={1.5} />
        </span>
      )}
    </>
  );

  if (esComplemento) {
    return (
      <div className={clases}>
        {interior}
        {/* En móvil no hay flecha ni botón, así que la aclaración va acá o no
            va en ninguna parte. */}
        <span className="sr-only">Este servicio se agrega a otro, no se reserva por separado.</span>
      </div>
    );
  }

  return (
    <Link
      to={`/agendar?service=${service.id}`}
      aria-label={`Reservar ${service.name}`}
      className={clases}
    >
      {interior}
    </Link>
  );
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [rubroActivo, setRubroActivo] = useState<string>('all');

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

  const visibles = rubroActivo === 'all' ? porRubro : porRubro.filter((r) => r.id === rubroActivo);

  /*
   * Los filtros llevan el número de servicios de cada rubro: antes eran
   * enlaces que solo hacían scroll, así que parecían filtrar sin filtrar y no
   * indicaban dónde estaba parada la clienta.
   */
  const filtros = [
    { id: 'all', label: 'Todos', total: services.length },
    ...porRubro.map((r) => ({ id: r.id, label: r.label, total: r.items.length })),
  ];

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
          <h1 className="mt-4 texto-5 text-cobre-400 sm:mt-5">Nuestros servicios</h1>
          <div aria-hidden="true" className="linea-cobre mx-auto my-4 w-16 border-t sm:my-6" />
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

      {/*
        Filtro por rubro, pegado bajo la barra superior en móvil. El activo va
        en rosa sólido y cada opción lleva su cuenta, así se sabe qué se está
        viendo y cuánto hay antes de tocar.
      */}
      {!cargando && porRubro.length > 1 && (
        <div className="vidrio sticky top-[4.5rem] z-30 border-y sm:static sm:border-0 sm:bg-transparent sm:backdrop-blur-none">
          <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-6">
            <div
              role="tablist"
              aria-label="Filtrar por rubro"
              className="flex gap-2 sin-barra overflow-x-auto py-3 sm:justify-center sm:gap-3 sm:py-0 sm:pb-10"
            >
              {filtros.map(({ id, label, total }) => {
                const activo = rubroActivo === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={activo}
                    onClick={() => setRubroActivo(id)}
                    className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 texto--2 uppercase espaciado-medio transition-all duration-300 ease-out active:scale-95 sm:px-5 sm:py-2.5 ${
                      activo
                        ? 'bg-rosa-300 text-vino-900'
                        : 'border border-crema-100/12 text-nacar-200/85 hover:border-rosa-300/50 hover:text-crema-100'
                    }`}
                  >
                    {label}
                    <span className={activo ? 'text-vino-900/60' : 'text-nacar-300'}>{total}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <Container className="pb-24 pt-6 sm:pt-0">
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
          {visibles.map((rubro, i) => (
            /* Cada rubro se revela al llegar. El primero entra de inmediato
               porque ya está en pantalla al abrir el catálogo; retenerlo
               dejaría la página en blanco el primer instante. */
            <Revelar key={rubro.id} delay={i === 0 ? 0 : 60}>
            <section id={`rubro-${rubro.id}`} className="scroll-mt-28 space-y-6 sm:space-y-10">
              {/* Encabezado de rubro: número, nombre y una regla que se estira
                  hasta el borde, rematada por un punto. Con un rubro filtrado
                  el nombre ya está en el filtro activo, así que numerarlo
                  aparte solo repite. */}
              <div className={`items-center gap-5 ${rubroActivo === 'all' ? 'flex' : 'hidden'}`}>
                <span className="texto--1 uppercase espaciado-amplio tabular-nums text-rosa-300">
                  0{i + 1}
                </span>
                <h2 className="font-display texto-4 text-crema-100">{rubro.label}</h2>
                <span aria-hidden="true" className="relative h-px flex-1 bg-cobre-400/20">
                  <span className="absolute right-0 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-cobre-400/50" />
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
            </Revelar>
          ))}
        </div>
      </Container>
    </div>
  );
}
