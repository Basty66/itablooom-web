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
}

/** Tarjeta de servicio, compartida entre el home y el catálogo. */
export default function ServiceCard({ service, delay = 0, prioritaria = false }: Props) {
  return (
    <article
      className="anim-entrada group flex flex-col overflow-hidden rounded-2xl border border-tinta-900/8 bg-crema-50 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-rosa-200 hover:shadow-[0_22px_50px_-28px_rgba(20,16,14,0.45)]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <ServiceVisual
        categoria={service.category}
        imagen={service.image_url}
        nombre={service.name}
        prioritaria={prioritaria}
      />

      <div className="flex flex-1 flex-col p-6">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="texto-1 text-tinta-900">{service.name}</h3>
          <span className="shrink-0 rounded-full bg-rosa-100 px-3 py-1 texto--1 font-medium text-rosa-600">
            {etiquetaCategoria(service.category)}
          </span>
        </div>

        <p className="mb-5 line-clamp-2 texto--1 text-tinta-600">{service.description}</p>

        <div className="mb-5 flex items-center gap-2 texto--1 text-tinta-500">
          <Clock3 size={15} strokeWidth={1.5} aria-hidden="true" />
          <span>{formatDuration(service.duration_minutes)}</span>
          <span aria-hidden="true" className="text-tinta-400">
            ·
          </span>
          <span>Seña {formatPrice(service.deposit_amount)}</span>
        </div>

        {/* mt-auto alinea el pie de todas las tarjetas aunque el texto varíe. */}
        <div className="mt-auto flex items-end justify-between gap-4 border-t border-tinta-900/8 pt-5">
          <div>
            <p className="texto--1 text-tinta-500">Valor</p>
            <p className="font-display texto-2 text-tinta-900">{formatPrice(service.price)}</p>
          </div>

          <Link
            to={`/agendar?service=${service.id}`}
            aria-label={`Reservar ${service.name}`}
            className="inline-flex items-center gap-2 rounded-full bg-tinta-900 px-5 py-2.5 texto--1 font-medium text-crema-100 transition-all duration-200 ease-out hover:bg-tinta-800 active:scale-95"
          >
            Reservar
            <ArrowRight
              size={15}
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
