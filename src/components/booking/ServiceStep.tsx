import { Clock3, Check } from 'lucide-react';
import type { Service } from '../../types';
import { formatPrice, formatDuration } from '../../lib/format';
import { Skeleton } from '../ui/Skeleton';

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
          <Skeleton key={i} className="h-28 rounded-2xl" />
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
            className={`anim-entrada group relative rounded-2xl border p-5 text-left transition-all duration-200 ease-out active:scale-[0.99] ${
              activo
                ? 'border-tinta-900 bg-rosa-100/60'
                : 'border-tinta-900/10 bg-crema-50 hover:border-rosa-300'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="texto-1 text-tinta-900">{service.name}</h3>
                <p className="mt-1 line-clamp-2 texto--1 text-tinta-600">{service.description}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 texto--1 text-tinta-500">
                  <span className="flex items-center gap-1.5">
                    <Clock3 size={14} strokeWidth={1.5} aria-hidden="true" />
                    {formatDuration(service.duration_minutes)}
                  </span>
                  <span>Seña {formatPrice(service.deposit_amount)}</span>
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2">
                <p className="font-display texto-2 text-tinta-900">{formatPrice(service.price)}</p>
                <span
                  aria-hidden="true"
                  className={`flex h-6 w-6 items-center justify-center rounded-full transition-all duration-200 ${
                    activo ? 'bg-tinta-900 text-crema-100' : 'border border-tinta-900/20'
                  }`}
                >
                  {activo && <Check size={13} strokeWidth={2.5} />}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
