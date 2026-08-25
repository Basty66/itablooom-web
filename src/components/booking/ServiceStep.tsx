import { Check } from 'lucide-react';
import type { Service } from '../../types';
import { formatPriceRange, formatDuration } from '../../lib/format';
import { Skeleton } from '../ui/Skeleton';
import { etiquetaCategoria } from '../ui/ServiceVisual';
import { CATEGORIAS_GODDESS } from '../../lib/categorias';

interface Props {
  services: Service[];
  seleccionado: Service | null;
  onSeleccionar: (s: Service) => void;
  cargando: boolean;
}

/**
 * Elección de servicio como lista editorial.
 *
 * Antes eran tarjetas con borde, radio y miniatura chica: se leían como
 * botones de formulario. Acá cada servicio es una fila separada por línea
 * fina, con la foto en retrato y el precio alineado a la derecha, como una
 * carta. La fila elegida se marca con una barra de tinta al costado, no con
 * un relleno de color.
 */
export default function ServiceStep({ services, seleccionado, onSeleccionar, cargando }: Props) {
  if (cargando) {
    return (
      <div className="divide-y divide-cobre-400/25 border-y border-cobre-400/25">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-5 py-5">
            <Skeleton className="h-24 w-20 shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <p className="linea-cobre border-y py-10 text-center texto--1 text-nacar-200/80">
        No hay servicios disponibles en este momento.
      </p>
    );
  }

  /*
   * Agrupados por rubro. En lista corrida, con siete servicios mezclados, las
   * tres variantes de acrílicas quedaban separadas entre pestañas y cejas: no
   * se leía que fueran alternativas de lo mismo.
   */
  const porRubro = services.reduce<Record<string, Service[]>>((acc, s) => {
    const clave = etiquetaCategoria(s.category);
    (acc[clave] ||= []).push(s);
    return acc;
  }, {});

  /*
   * Orden del rubro —uñas, pestañas, cejas— y no el que devuelva la base, que
   * es el de creación de las filas y cambia sin aviso. Es el mismo orden que
   * anuncia el sitio en su encabezado.
   */
  const ordenRubros: string[] = CATEGORIAS_GODDESS.filter((c) => c.id !== 'all').map((c) => c.label);
  const gruposOrdenados = Object.entries(porRubro).sort(
    ([a], [b]) => ordenRubros.indexOf(a) - ordenRubros.indexOf(b)
  );

  let indice = -1;

  return (
    <div role="radiogroup" aria-label="Servicios disponibles" className="flex flex-col gap-7">
      {gruposOrdenados.map(([rubro, lista]) => (
        <div key={rubro}>
          <p className="mb-1 texto--2 uppercase espaciado-amplio text-rosa-300">{rubro}</p>
          <div className="divide-y divide-cobre-400/25 border-y border-cobre-400/25">
      {lista.map((service) => {
        const activo = seleccionado?.id === service.id;
        const i = ++indice;

        return (
          <button
            key={service.id}
            type="button"
            role="radio"
            aria-checked={activo}
            onClick={() => onSeleccionar(service)}
            style={{ animationDelay: `${i * 60}ms` }}
            className={`anim-entrada group relative flex w-full items-center gap-4 py-5 pl-4 pr-1 text-left transition-colors duration-300 sm:gap-5 ${
              activo ? 'bg-rosa-300/8' : 'hover:bg-tinta-850'
            }`}
          >
            {/*
              Barra de selección al canto. Era `bg-tinta-900`, es decir el
              color del propio fondo: marcaba la fila con una barra invisible
              y no había forma de saber cuál estaba elegida.
            */}
            <span
              aria-hidden="true"
              className={`absolute left-0 top-0 h-full w-0.5 transition-colors duration-300 ${
                activo ? 'bg-rosa-300' : 'bg-transparent'
              }`}
            />

            <span className="h-24 w-24 shrink-0 overflow-hidden rounded-[var(--radius-medio)] bg-tinta-850 sm:h-28 sm:w-28">
              {service.image_url && (
                <img
                  src={service.image_url}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
                />
              )}
            </span>

            <span className="flex min-w-0 flex-1 flex-col">
              <span className="font-display texto-1 leading-tight text-crema-100">
                {service.name}
              </span>

              <span className="mt-1 texto--1 text-nacar-300">
                {formatDuration(service.duration_minutes)}
              </span>
            </span>

            <span className="flex shrink-0 flex-col items-end gap-1.5 pl-2 text-right">
              <span className="block font-display texto-1 tabular-nums text-cobre-400">
                {formatPriceRange(service.price, service.price_max)}
              </span>
              {/* Palomita para el elegido: en una lista de siete filas, la
                  barra de 2px al canto se pierde de vista. */}
              {activo ? (
                <span className="flex items-center gap-1.5 texto--2 uppercase espaciado-medio text-rosa-300">
                  <Check size={13} strokeWidth={2.5} aria-hidden="true" />
                  Elegido
                </span>
              ) : (
                <span className="texto--2 uppercase espaciado-medio text-nacar-300 transition-colors duration-300 group-hover:text-crema-100">
                  Elegir
                </span>
              )}
            </span>
          </button>
        );
      })}
          </div>
        </div>
      ))}
    </div>
  );
}
