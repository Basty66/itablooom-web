import type { Service } from '../../types';
import { formatPrice, formatDuration } from '../../lib/format';
import { Skeleton } from '../ui/Skeleton';
import { etiquetaCategoria } from '../ui/ServiceVisual';

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
      <div className="divide-y divide-dorado-400/25 border-y border-dorado-400/25">
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
      <p className="linea-oro border-y py-10 text-center texto--1 text-nacar-200/80">
        No hay servicios disponibles en este momento.
      </p>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Servicios disponibles"
      className="divide-y divide-dorado-400/25 border-y border-dorado-400/25"
    >
      {services.map((service, i) => {
        const activo = seleccionado?.id === service.id;

        return (
          <button
            key={service.id}
            type="button"
            role="radio"
            aria-checked={activo}
            onClick={() => onSeleccionar(service)}
            style={{ animationDelay: `${i * 60}ms` }}
            className="anim-entrada group relative flex w-full items-center gap-4 py-5 pl-4 pr-1 text-left transition-colors duration-300 hover:superficie sm:gap-5"
          >
            {/* Barra de selección: marca la fila sin teñir el fondo. */}
            <span
              aria-hidden="true"
              className={`absolute left-0 top-0 h-full w-0.5 transition-colors duration-300 ${
                activo ? 'bg-tinta-900' : 'bg-transparent'
              }`}
            />

            <span className="h-24 w-20 shrink-0 overflow-hidden bg-tinta-850">
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
              <span className="texto--2 uppercase espaciado-medio text-dorado-300">
                {etiquetaCategoria(service.category)}
              </span>

              <span className="mt-1.5 font-display texto-1 leading-tight text-crema-100">
                {service.name}
              </span>

              <span className="mt-1 texto--1 text-nacar-300">
                {formatDuration(service.duration_minutes)}
              </span>
            </span>

            <span className="shrink-0 pl-2 text-right">
              <span className="block texto-0 tabular-nums text-crema-100">
                {formatPrice(service.price)}
              </span>
              <span
                className={`mt-1 block texto--2 uppercase espaciado-medio transition-colors duration-300 ${
                  activo ? 'text-crema-100' : 'text-nacar-300'
                }`}
              >
                {activo ? 'Elegido' : 'Elegir'}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
