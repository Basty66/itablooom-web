import { Link } from 'react-router-dom';
import { Clock3, ArrowRight } from 'lucide-react';
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
 * Densidad ajustada: la versión anterior ocupaba casi una pantalla de móvil
 * por tarjeta, así que se recortó la imagen y el espaciado interno.
 */
export default function ServiceCard({
  service,
  delay = 0,
  prioritaria = false,
  className = '',
}: Props) {
  return (
    <article
      className={`anim-entrada group flex flex-col overflow-hidden rounded-2xl border border-tinta-900/8 bg-crema-50 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-dorado-300 hover:shadow-[0_22px_50px_-28px_rgba(20,16,14,0.45)] ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <ServiceVisual
        categoria={service.category}
        imagen={service.image_url}
        nombre={service.name}
        prioritaria={prioritaria}
      />

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="texto-0 font-medium leading-snug text-tinta-900">{service.name}</h3>
          <span className="shrink-0 rounded-full bg-dorado-100 px-2.5 py-0.5 texto--1 font-medium text-dorado-700">
            {etiquetaCategoria(service.category)}
          </span>
        </div>

        <p className="mb-3 line-clamp-2 texto--1 leading-snug text-tinta-600">
          {service.description}
        </p>

        <div className="mb-3 flex items-center gap-1.5 texto--1 text-tinta-500">
          <Clock3 size={13} strokeWidth={1.5} aria-hidden="true" />
          <span>{formatDuration(service.duration_minutes)}</span>
        </div>

        {/* mt-auto alinea el pie de todas las tarjetas aunque el texto varíe. */}
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-tinta-900/8 pt-3">
          <div>
            <p className="font-display texto-1 leading-none text-tinta-900">
              {formatPrice(service.price)}
            </p>
            <p className="mt-0.5 texto--1 text-tinta-500">
              Reserva con {formatPrice(service.deposit_amount)}
            </p>
          </div>

          <Link
            to={`/agendar?service=${service.id}`}
            aria-label={`Reservar ${service.name}`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-b from-dorado-300 to-dorado-400 px-4 py-2 texto--1 font-medium text-tinta-900 transition-all duration-200 ease-out hover:from-dorado-200 hover:to-dorado-300 active:scale-95"
          >
            Reservar
            <ArrowRight
              size={14}
              strokeWidth={1.5}
              aria-hidden="true"
              className="transition-transform duration-200 ease-out group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </div>
    </article>
  );
}
