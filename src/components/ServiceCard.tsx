import { Link } from 'react-router-dom';
import type { Service } from '../types';
import { formatPrice, formatDuration } from '../lib/format';
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
        <p className="texto--1 uppercase espaciado-medio text-dorado-700">
          {etiquetaCategoria(service.category)}
        </p>

        <h3 className="mt-2 font-display texto-2 leading-tight text-tinta-900">{service.name}</h3>

        <p className="mt-2 line-clamp-2 texto--1 leading-relaxed text-tinta-600">
          {service.description}
        </p>

        {/* mt-auto alinea el pie de todas las tarjetas aunque el texto varíe. */}
        <div className="linea-oro mt-5 flex items-baseline justify-between gap-4 border-t pt-4">
          <div>
            <p className="texto-0 text-tinta-900">{formatPrice(service.price)}</p>
            <p className="mt-0.5 texto--1 text-tinta-500">
              {formatDuration(service.duration_minutes)}
            </p>
          </div>

          <Link
            to={`/agendar?service=${service.id}`}
            aria-label={`Reservar ${service.name}`}
            className="relative texto--1 uppercase espaciado-medio text-tinta-900 transition-colors duration-300 hover:text-dorado-700"
          >
            Reservar
            {/* Subrayado que se extiende al pasar el cursor. */}
            <span
              aria-hidden="true"
              className="absolute -bottom-1 left-0 h-px w-0 bg-dorado-500 transition-all duration-300 ease-out group-hover:w-full"
            />
          </Link>
        </div>
      </div>
    </article>
  );
}
