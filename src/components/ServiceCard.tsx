import { Link } from 'react-router-dom';
import type { Service } from '../types';
import { formatPriceRange, formatDuration } from '../lib/format';
import ServiceVisual, { etiquetaCategoria } from './ui/ServiceVisual';

interface Props {
  service: Service;
  delay?: number;
  /** La primera tarjeta está sobre el pliegue: se carga sin diferir. */
  prioritaria?: boolean;
  /** Permite al contenedor fijar ancho y snap cuando va en carrusel móvil. */
  className?: string;
}

/**
 * Tarjeta de servicio, compartida entre el home y el catálogo.
 *
 * Sin caja: la tarjeta con borde, radio y sombra competía con la foto. Acá la
 * imagen apoya directo sobre el fondo y una línea fina separa el pie, que es
 * el único recurso de división del sistema.
 */
export default function ServiceCard({
  service,
  delay = 0,
  prioritaria = false,
  className = '',
}: Props) {
  return (
    <article
      className={`anim-entrada group flex flex-col transition-transform duration-500 ease-out hover:-translate-y-1 ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <ServiceVisual
        categoria={service.category}
        imagen={service.image_url}
        nombre={service.name}
        prioritaria={prioritaria}
      />

      <div className="flex flex-1 flex-col pt-5">
        {/* La categoría va en píldora, no en versalitas sueltas: es el
            distintivo del sistema para clasificar y se lee de un vistazo. */}
        <span className="chip w-fit rounded-full px-3 py-1 texto--2 font-medium uppercase espaciado-medio">
          {etiquetaCategoria(service.category)}
        </span>

        <h3 className="mt-3 font-display texto-2 text-crema-100">{service.name}</h3>

        <p className="mb-5 mt-2 line-clamp-2 texto-0 leading-relaxed text-nacar-200/75">
          {service.description}
        </p>

        {/* mt-auto alinea el pie de todas las tarjetas aunque el texto varíe. */}
        <div className="linea-cobre mt-auto flex items-baseline justify-between gap-4 border-t pt-4">
          <div>
            {/* El precio es el único dato en cobre de la tarjeta: así destaca
                sin necesidad de agrandarlo ni ponerlo en negrita. */}
            <p className="font-display texto-2 text-cobre-400">{formatPriceRange(service.price, service.price_max)}</p>
            <p className="mt-0.5 texto--1 uppercase espaciado-medio text-nacar-300">
              {formatDuration(service.duration_minutes)}
            </p>
          </div>

          <Link
            to={`/agendar?service=${service.id}`}
            aria-label={`Reservar ${service.name}`}
            className="relative -my-3 py-3 texto--1 uppercase espaciado-medio text-crema-100 transition-colors duration-300 hover:text-cobre-300"
          >
            Reservar
            {/* Subrayado que se extiende al pasar el cursor. */}
            <span
              aria-hidden="true"
              className="absolute -bottom-1 left-0 h-px w-0 bg-cobre-500 transition-all duration-300 ease-out group-hover:w-full"
            />
          </Link>
        </div>
      </div>
    </article>
  );
}
