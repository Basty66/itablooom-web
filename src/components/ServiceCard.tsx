import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import type { Service } from '../types';
import { formatPriceRange, formatDurationRange } from '../lib/format';
import ServiceVisual, { etiquetaCategoria } from './ui/ServiceVisual';
import Inclinable from './ui/Inclinable';

interface Props {
  service: Service;
  delay?: number;
  /** La primera tarjeta está sobre el pliegue: se carga sin diferir. */
  prioritaria?: boolean;
  /** Permite al contenedor fijar ancho y snap cuando va en carrusel móvil. */
  className?: string;
}

/**
 * Tarjeta de servicio de la portada.
 *
 * Sin caja: la foto apoya directo sobre el fondo y una línea fina separa el
 * pie. La foto va en arco, como las del hero, con canto de metal que se
 * enciende al pasar el cursor y una inclinación que sigue al mouse.
 *
 * La inclinación vive en un nodo propio y no en el <article>: la entrada de
 * este deja su `transform` fijado por la animación y le ganaría a cualquier
 * otro.
 */
export default function ServiceCard({
  service,
  delay = 0,
  prioritaria = false,
  className = '',
}: Props) {
  return (
    <article
      className={`anim-entrada group flex flex-col ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <Inclinable className="arco-forma arco-4-5 canto-metal">
        <ServiceVisual
          categoria={service.category}
          imagen={service.image_url}
          nombre={service.name}
          prioritaria={prioritaria}
          forma="arco-forma arco-4-5 aspect-[4/5]"
        />
        {/* La categoría flota sobre la foto, en vidrio: libera el pie para
            el nombre y el precio. */}
        <span className="vidrio absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border px-3.5 py-1 texto--2 font-medium uppercase espaciado-medio text-nacar-100">
          {etiquetaCategoria(service.category)}
        </span>
      </Inclinable>

      <div className="flex flex-1 flex-col pt-6 text-center">
        <h3 className="font-display texto-3 text-crema-100">{service.name}</h3>

        <p className="mx-auto mb-5 mt-2 line-clamp-2 max-w-[34ch] texto-0 leading-relaxed text-nacar-200/75">
          {service.description}
        </p>

        {/* mt-auto alinea el pie de todas las tarjetas aunque el texto varíe. */}
        <div className="linea-cobre mt-auto flex items-center justify-between gap-4 border-t pt-4 text-left">
          <div>
            {/* El precio es el único dato en metal de la tarjeta: así destaca
                sin necesidad de agrandarlo ni ponerlo en negrita. */}
            <p className="texto-metal w-fit whitespace-nowrap pr-1 font-display texto-2">
              {formatPriceRange(service.price, service.price_max)}
            </p>
            <p className="mt-0.5 whitespace-nowrap texto--1 uppercase espaciado-medio text-nacar-300">
              {formatDurationRange(service.duration_minutes, service.duration_max_minutes)}
            </p>
          </div>

          {/* En el carrusel del teléfono la tarjeta mide unos 300px y el
              precio por rango se partía en dos líneas: ahí el botón queda en
              un círculo con la flecha, y la palabra vuelve desde sm. */}
          <Link
            to={`/agendar?service=${service.id}`}
            aria-label={`Reservar ${service.name}`}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center gap-2 rounded-full border border-cobre-400/40 texto--1 uppercase espaciado-medio text-crema-100 transition-all duration-300 hover:border-cobre-200 hover:bg-cobre-400/10 group-hover:border-cobre-300/70 sm:h-auto sm:w-auto sm:py-2.5 sm:pl-4 sm:pr-3"
          >
            <span className="hidden sm:inline">Reservar</span>
            <ArrowUpRight
              size={15}
              strokeWidth={1.5}
              aria-hidden="true"
              className="transition-transform duration-500 ease-out group-hover:rotate-45"
            />
          </Link>
        </div>
      </div>
    </article>
  );
}
