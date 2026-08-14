import { CalendarDays, Clock3, Timer, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Service } from '../../types';
import { formatPrice, formatDuration } from '../../lib/format';

interface Props {
  service: Service | null;
  fecha: Date | null;
  hora: string;
  tipoPago: 'deposit' | 'full';
}

/**
 * Resumen que acompaña los tres pasos, en vez de aparecer recién al final.
 * Las filas vacías se muestran atenuadas para que se vea qué falta completar:
 * el hueco comunica progreso mejor que ocultarlo.
 */
export default function ResumenReserva({ service, fecha, hora, tipoPago }: Props) {
  const monto = service ? (tipoPago === 'full' ? service.price : service.deposit_amount) : 0;
  const saldo = service && tipoPago === 'deposit' ? service.price - service.deposit_amount : 0;

  return (
    <aside
      aria-label="Resumen de tu reserva"
      className="overflow-hidden rounded-3xl border border-tinta-900/8 bg-crema-50 shadow-[0_20px_60px_-45px_rgba(20,16,14,0.6)]"
    >
      {service?.image_url ? (
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={service.image_url}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-tinta-900/80 via-tinta-900/20 to-transparent"
          />
          <div className="absolute inset-x-0 bottom-0 p-5">
            <p className="font-display texto-2 leading-tight text-crema-100">{service.name}</p>
            <p className="mt-0.5 texto--1 text-crema-100/70">
              {formatDuration(service.duration_minutes)}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-rosa-100 to-crema-300 p-6 text-center">
          <p className="texto--1 text-tinta-500">
            Elige un tratamiento para ver aquí el resumen de tu cita.
          </p>
        </div>
      )}

      <div className="p-5">
        <dl className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-2 texto--1 text-tinta-500">
              <CalendarDays size={14} strokeWidth={1.5} aria-hidden="true" />
              Fecha
            </dt>
            <dd
              className={`texto--1 capitalize ${fecha ? 'font-medium text-tinta-900' : 'text-tinta-400'}`}
            >
              {fecha ? format(fecha, "EEE d 'de' MMM", { locale: es }) : 'Por elegir'}
            </dd>
          </div>

          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-2 texto--1 text-tinta-500">
              <Clock3 size={14} strokeWidth={1.5} aria-hidden="true" />
              Hora
            </dt>
            <dd
              className={`texto--1 tabular-nums ${hora ? 'font-medium text-tinta-900' : 'text-tinta-400'}`}
            >
              {hora || 'Por elegir'}
            </dd>
          </div>
        </dl>

        <div className="mt-5 border-t border-tinta-900/10 pt-5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="texto--1 text-tinta-600">
              {tipoPago === 'full' ? 'Pagas ahora' : 'Seña ahora'}
            </span>
            <span className="font-display texto-3 leading-none text-tinta-900">
              {service ? formatPrice(monto) : '—'}
            </span>
          </div>

          {saldo > 0 && (
            <p className="mt-2 texto--1 text-tinta-500">
              Saldo en el local: {formatPrice(saldo)}
            </p>
          )}
        </div>

        <ul className="mt-5 space-y-2 border-t border-tinta-900/10 pt-5">
          <li className="flex items-center gap-2 texto--1 text-tinta-500">
            <ShieldCheck size={13} strokeWidth={1.5} className="text-rosa-600" aria-hidden="true" />
            Pago protegido con Mercado Pago
          </li>
          <li className="flex items-center gap-2 texto--1 text-tinta-500">
            <Timer size={13} strokeWidth={1.5} className="text-rosa-600" aria-hidden="true" />
            Tu horario se reserva 10 minutos
          </li>
        </ul>
      </div>
    </aside>
  );
}
