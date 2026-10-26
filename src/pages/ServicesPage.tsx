import { useState, useEffect, type CSSProperties } from 'react';
import { flushSync } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import {
  SearchX,
  Clock3,
  ArrowUpRight,
  Wallet,
  CalendarClock,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import type { Service } from '../types';
import { getServices } from '../lib/api';
import { CATEGORIAS_GODDESS } from '../lib/categorias';
import { ICONOS_RUBRO } from '../lib/iconos-rubro';
import { POLITICAS } from '../lib/politicas';
import ServiceVisual, { etiquetaCategoria } from '../components/ui/ServiceVisual';
import { Container } from '../components/ui/Section';
import Revelar from '../components/ui/Revelar';
import Inclinable from '../components/ui/Inclinable';
import SelectorSegmentado from '../components/ui/SelectorSegmentado';
import { Skeleton } from '../components/ui/Skeleton';
import { formatPriceRange, formatDurationRange } from '../lib/format';

/** El catálogo se recorre por rubro, así que "Todos" no aplica acá. */
const RUBROS = CATEGORIAS_GODDESS.filter((c) => c.id !== 'all');

/** Las tres políticas que más dudas resuelven antes de reservar. */
const ANTES_DE_RESERVAR: { titulo: string; icono: LucideIcon }[] = [
  { titulo: 'Abono de reserva', icono: Wallet },
  { titulo: 'Cambios y cancelaciones', icono: CalendarClock },
  { titulo: 'Garantía', icono: ShieldCheck },
];

/**
 * Cambia el filtro con una transición de vista: el navegador fotografía
 * las tarjetas antes y después, y desliza cada una a su nuevo lugar. Donde
 * no existe la API, o se pidió menos movimiento, el cambio es directo.
 */
function conTransicion(cambio: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (!doc.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    cambio();
    return;
  }
  doc.startViewTransition(() => flushSync(cambio));
}

/**
 * Tarjeta del catálogo.
 *
 * Dos formas según el ancho. En móvil es una fila compacta y toda la
 * tarjeta es el enlace: el dedo acierta en cualquier parte. Desde sm es la
 * tarjeta vertical con la foto en arco, la misma de la portada, donde el
 * espacio sobra y la foto vende.
 */
function TarjetaServicio({
  service,
  prioritaria,
  indice,
}: {
  service: Service;
  prioritaria: boolean;
  indice: number;
}) {
  /*
   * Hay servicios que se suman a otra hora y no se reservan solos: el
   * visajismo es diseño de cejas que acompaña. Esos siguen mostrándose con su
   * valor —la clienta quiere saber cuánto cuesta agregarlo— pero no son un
   * enlace: llevarla a la reserva prometería un flujo que no termina en nada.
   */
  const esComplemento = Boolean(service.es_complemento);
  const rotulo = esComplemento ? 'Complemento' : etiquetaCategoria(service.category);

  const clases =
    'group anim-entrada relative flex items-center gap-4 rounded-[1.4rem] bg-tinta-880/80 p-2.5 pr-3 ' +
    'transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.985] ' +
    'sm:h-full sm:flex-col sm:items-stretch sm:gap-0 sm:bg-transparent sm:p-0 sm:active:scale-100';

  const interior = (
    <>
      {/* Canto de metal de la fila móvil; se enciende al tocarla. */}
      <span aria-hidden="true" className="canto-metal absolute inset-0 rounded-[inherit] sm:hidden" />

      <Inclinable className="canto-metal arco-4-5 w-[6.5rem] shrink-0 rounded-[1.1rem] sm:arco-forma sm:w-full">
        <ServiceVisual
          forma="aspect-[4/5] rounded-[1.1rem] sm:arco-forma"
          categoria={service.category}
          imagen={service.image_url}
          nombre={service.name}
          prioritaria={prioritaria}
        />
        <span className="vidrio absolute bottom-3 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-full border px-3.5 py-1 texto--2 font-medium uppercase espaciado-medio text-nacar-100 sm:block">
          {rotulo}
        </span>
      </Inclinable>

      <div className="flex min-w-0 flex-1 flex-col py-1 sm:pt-6 sm:text-center">
        <span className="mb-1.5 texto--2 uppercase espaciado-medio text-rosa-300 sm:hidden">{rotulo}</span>
        <h3 className="font-display texto-2 leading-tight text-crema-100 sm:texto-3">{service.name}</h3>

        {/* Duración y precio en una línea: en la fila de móvil cada renglón
            extra se paga en altura. */}
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 sm:justify-center">
          <span className="flex items-center gap-1.5 texto--2 uppercase espaciado-medio text-nacar-300">
            <Clock3 size={13} strokeWidth={1.5} aria-hidden="true" />
            {formatDurationRange(service.duration_minutes, service.duration_max_minutes)}
          </span>
          <span aria-hidden="true" className="hidden h-3 w-px bg-cobre-400/30 sm:block" />
          <span className="texto-metal whitespace-nowrap pr-0.5 font-display texto-1 sm:texto-2">
            {esComplemento && '+ '}
            {formatPriceRange(service.price, service.price_max)}
          </span>
        </p>

        <p className="mx-auto mt-3 hidden max-w-[34ch] texto-0 leading-relaxed text-nacar-200/75 sm:line-clamp-2">
          {service.description}
        </p>

        {/* Remate de escritorio. Es un falso botón: el enlace es la tarjeta
            entera, y un control dentro de otro no se puede tocar bien. */}
        <span className="mt-auto hidden pt-6 sm:block">
          {esComplemento ? (
            <span className="linea-cobre flex items-center justify-center rounded-full border py-3 texto--1 text-nacar-200/85">
              Se agrega a otro servicio
            </span>
          ) : (
            <span className="boton-metal flex items-center justify-between rounded-full py-1.5 pl-6 pr-1.5 texto--1 font-medium uppercase espaciado-medio text-vino-900">
              Reservar
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-vino-900 text-rosa-100 transition-transform duration-500 group-hover:rotate-45">
                <ArrowUpRight size={16} strokeWidth={1.6} aria-hidden="true" />
              </span>
            </span>
          )}
        </span>
      </div>

      {/* En móvil el remate es un círculo de metal con la flecha. Los
          complementos no se reservan solos, así que no lo llevan. */}
      {!esComplemento && (
        <span
          aria-hidden="true"
          className="boton-metal flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-vino-900 transition-transform duration-500 group-active:rotate-45 sm:hidden"
        >
          <ArrowUpRight size={17} strokeWidth={1.6} />
        </span>
      )}
    </>
  );

  /* Nombre propio para la transición de vista: cada tarjeta se reconoce a
     sí misma antes y después de filtrar, y se desliza a su nuevo sitio. */
  const estilo = {
    viewTransitionName: `servicio-${service.id}`,
    animationDelay: `${Math.min(indice, 6) * 70}ms`,
  } as CSSProperties;

  if (esComplemento) {
    return (
      <div className={clases} style={estilo}>
        {interior}
        <span className="sr-only">Este servicio se agrega a otro, no se reserva por separado.</span>
      </div>
    );
  }

  return (
    <Link to={`/agendar?service=${service.id}`} aria-label={`Reservar ${service.name}`} className={clases} style={estilo}>
      {interior}
    </Link>
  );
}

/** Esqueleto con las dos formas de la tarjeta real, para que nada salte. */
function TarjetaEsqueleto() {
  return (
    <div className="flex items-center gap-4 rounded-[1.4rem] bg-tinta-880/80 p-2.5 sm:flex-col sm:items-stretch sm:bg-transparent sm:p-0">
      <Skeleton className="aspect-[4/5] w-[6.5rem] shrink-0 rounded-[1.1rem] sm:arco-forma sm:w-full" />
      <div className="flex flex-1 flex-col gap-2.5 py-1 sm:items-center sm:pt-6">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="mt-4 hidden h-12 w-full rounded-full sm:block" />
      </div>
    </div>
  );
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  /*
   * El rubro vive en la URL: el hero enlaza directo a /servicios?rubro=…,
   * y un filtro compartido por WhatsApp llega a la misma vista.
   */
  const [parametros, setParametros] = useSearchParams();
  const pedido = parametros.get('rubro');
  const rubroActivo = RUBROS.some((r) => r.id === pedido) ? (pedido as string) : 'all';

  function elegirRubro(id: string) {
    conTransicion(() =>
      setParametros(id === 'all' ? {} : { rubro: id }, { replace: true, preventScrollReset: true })
    );
  }

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
    { id: 'all', label: 'Todos', total: services.length, icono: ICONOS_RUBRO.all },
    ...porRubro.map((r) => ({ id: r.id, label: r.label, total: r.items.length, icono: ICONOS_RUBRO[r.id] })),
  ];

  return (
    <div className="min-h-screen bg-tinta-900">
      {/* Portada del catálogo: tipografía con la misma luz vino del hero. */}
      <section className="luz-vino relative overflow-hidden px-5 pb-8 pt-12 sm:px-6 sm:pb-12 sm:pt-20">
        <div className="relative mx-auto max-w-2xl text-center">
          <p className="anim-entrada texto--1 uppercase espaciado-amplio text-rosa-300">Carta de servicios</p>
          <div
            aria-hidden="true"
            className="filete-entrada mx-auto mt-4 h-px w-10 bg-gradient-to-r from-cobre-600 via-cobre-100 to-cobre-400"
            style={{ transformOrigin: 'center' }}
          />
          <h1 className="mt-6 texto-5 leading-[1.02] text-crema-100">
            <span className="palabra" style={{ '--i': 0 } as CSSProperties}>
              Nuestros
            </span>{' '}
            <span className="palabra texto-metal pr-[0.08em] italic" style={{ '--i': 1 } as CSSProperties}>
              servicios
            </span>
          </h1>
          {/* El párrafo largo se guarda para pantallas grandes: en móvil son
              tres líneas más entre la clienta y el primer servicio. */}
          <p
            className="anim-entrada mx-auto mt-5 max-w-[46ch] texto-0 leading-relaxed text-nacar-200/80 sm:texto-1"
            style={{ animationDelay: '300ms' }}
          >
            Uñas, pestañas y cejas con hora reservada.
            <span className="hidden sm:inline">
              {' '}
              Cada servicio muestra su duración y su valor, para que elijas con todo a la vista.
            </span>
          </p>
        </div>
      </section>

      {/*
        Filtro por rubro, pegado bajo la barra superior mientras se baja: la
        clienta cambia de rubro sin volver arriba. El velo de abajo hacia
        arriba despega el selector de las tarjetas que pasan por debajo.
      */}
      {!cargando && porRubro.length > 1 && (
        <div className="sticky top-[4.5rem] z-30 bg-gradient-to-b from-tinta-900 via-tinta-900/90 to-transparent pb-6 pt-3 md:top-14">
          <div className="mx-auto flex w-full max-w-[1200px] justify-center px-5 sm:px-6">
            <SelectorSegmentado
              etiqueta="Filtrar por rubro"
              opciones={filtros}
              activa={rubroActivo}
              onCambio={elegirRubro}
            />
          </div>
        </div>
      )}

      <Container className="pb-24 pt-2">
        {cargando && (
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-14 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <TarjetaEsqueleto key={i} />
            ))}
          </div>
        )}

        {!cargando && error && (
          <div className="mx-auto max-w-md rounded-2xl border border-crema-100/10 bg-tinta-880 p-10 text-center">
            <p className="texto-1 mb-2 text-crema-100">No pudimos cargar los tratamientos</p>
            <p className="mb-6 texto--1 text-nacar-200/80">Revisa tu conexión e inténtalo de nuevo.</p>
            <button
              onClick={cargar}
              className="boton-metal rounded-full px-7 py-3 texto--1 font-medium uppercase espaciado-medio text-vino-900 transition-transform duration-200 active:scale-95"
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

        <div className="space-y-16 sm:space-y-24">
          {visibles.map((rubro, i) => (
            /* Cada rubro se revela al llegar. El primero entra de inmediato
               porque ya está en pantalla al abrir el catálogo; retenerlo
               dejaría la página en blanco el primer instante. */
            <Revelar key={rubro.id} delay={i === 0 ? 0 : 60}>
              <section id={`rubro-${rubro.id}`} className="scroll-mt-36 space-y-6 sm:space-y-12">
                {/* Encabezado de rubro: número en metal, nombre, cuántos hay
                    y un filete que se estira hasta el borde. */}
                <div className="flex items-end gap-4 sm:gap-6">
                  <span
                    aria-hidden="true"
                    className="texto-metal pr-1 font-display text-[2.8rem] italic leading-[0.9] sm:text-[4rem]"
                  >
                    0{RUBROS.findIndex((r) => r.id === rubro.id) + 1}
                  </span>
                  <div>
                    <h2 className="font-display texto-4 leading-none text-crema-100">{rubro.label}</h2>
                    <p className="mt-2 texto--2 uppercase espaciado-amplio text-nacar-300">
                      {rubro.items.length} {rubro.items.length === 1 ? 'servicio' : 'servicios'}
                    </p>
                  </div>
                  <span
                    aria-hidden="true"
                    className="mb-2 h-px flex-1 bg-gradient-to-r from-cobre-400/50 via-cobre-400/15 to-transparent"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-14 lg:grid-cols-3 lg:gap-x-10">
                  {rubro.items.map((service, j) => (
                    <TarjetaServicio
                      key={service.id}
                      service={service}
                      indice={j}
                      prioritaria={i === 0 && j < 3}
                    />
                  ))}
                </div>
              </section>
            </Revelar>
          ))}
        </div>

        {/* Antes de reservar: las tres políticas que más preguntan, a la
            vista justo donde se decide. */}
        {!cargando && !error && porRubro.length > 0 && (
          <Revelar className="mt-24">
            <p className="text-center texto--1 uppercase espaciado-amplio text-rosa-300">Antes de reservar</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3 sm:gap-6">
              {ANTES_DE_RESERVAR.map(({ titulo, icono: Icono }, i) => {
                const politica = POLITICAS.find((p) => p.titulo === titulo);
                if (!politica) return null;
                return (
                  <div
                    key={titulo}
                    className="anim-entrada relative rounded-[1.4rem] bg-tinta-880/80 p-6"
                    style={{ animationDelay: `${i * 90}ms` }}
                  >
                    <span aria-hidden="true" className="canto-metal absolute inset-0 rounded-[inherit]" />
                    <span className="relative flex h-10 w-10 items-center justify-center rounded-full">
                      <span aria-hidden="true" className="canto-metal activo absolute inset-0 rounded-full" />
                      <Icono size={17} strokeWidth={1.5} className="text-cobre-200" aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 font-display texto-2 text-crema-100">{politica.titulo}</h3>
                    <p className="mt-2 texto--1 leading-relaxed text-nacar-200/80">{politica.detalle}</p>
                  </div>
                );
              })}
            </div>
          </Revelar>
        )}
      </Container>
    </div>
  );
}
