import { Clock3, Check } from 'lucide-react';
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

export default function ServiceStep({ services, seleccionado, onSeleccionar, cargando }: Props) {
  if (cargando) {
    return (
      <div className="grid gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div role="radiogroup" aria-label="Tratamientos disponibles" className="grid gap-3">
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
            className={`anim-entrada group relative flex gap-3 overflow-hidden rounded-2xl border p-3 text-left transition-all duration-200 ease-out active:scale-[0.99] sm:gap-4 sm:p-4 ${
              activo
                ? 'border-tinta-900 bg-rosa-100/60 shadow-[0_10px_30px_-18px_rgba(20,16,14,0.5)]'
                : 'border-tinta-900/10 bg-crema-50 hover:border-rosa-300'
            }`}
          >
            {/* Miniatura: ancho fijo para que todas las filas queden alineadas. */}
            <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-rosa-100 to-crema-300 sm:h-20 sm:w-24">
              {service.image_url && (
                <img
                  src={service.image_url}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
              )}
            </span>

            <span className="flex min-w-0 flex-1 flex-col justify-center">
              <span className="flex items-start justify-between gap-2">
                <span className="min-w-0">
                  <span className="block texto-1 leading-tight text-tinta-900">{service.name}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 texto--1 text-tinta-500">
                    <span className="flex items-center gap-1">
                      <Clock3 size={12} strokeWidth={1.5} aria-hidden="true" />
                      {formatDuration(service.duration_minutes)}
                    </span>
                    <span className="rounded-full bg-rosa-100 px-2 py-0.5 texto--1 text-rosa-600">
                      {etiquetaCategoria(service.category)}
                    </span>
                  </span>
                </span>

                <span
                  aria-hidden="true"
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
                    activo ? 'bg-tinta-900 text-crema-100' : 'border border-tinta-900/20'
                  }`}
                >
                  {activo && <Check size={12} strokeWidth={2.5} />}
                </span>
              </span>

              <span className="mt-1.5 border-t border-tinta-900/8 pt-1.5">
                <span className="font-display texto-2 leading-none text-tinta-900">
                  {formatPrice(service.price)}
                </span>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
