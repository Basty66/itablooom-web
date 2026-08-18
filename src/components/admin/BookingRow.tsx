import { Clock3, Phone, Mail, Check, X, CircleCheck } from 'lucide-react';
import type { Booking } from '../../types';
import { formatPrice } from '../../lib/format';

type Estado = Booking['status'];

/** Tonos apagados para no competir con el rosado de la marca. */
const ESTADOS: Record<Estado, { clase: string; label: string }> = {
  pending: { clase: 'bg-amber-100 text-amber-900', label: 'Pendiente' },
  confirmed: { clase: 'bg-emerald-100 text-emerald-900', label: 'Confirmada' },
  cancelled: { clase: 'bg-tinta-900/8 text-tinta-600', label: 'Cancelada' },
  completed: { clase: 'bg-rosa-200 text-tinta-900', label: 'Completada' },
};

interface Props {
  booking: Booking;
  onEstado: (id: string, estado: Estado) => void;
  actualizando: boolean;
}

export default function BookingRow({ booking, onEstado, actualizando }: Props) {
  const estado = ESTADOS[booking.status] ?? ESTADOS.pending;
  const hora = booking.booking_time ? String(booking.booking_time).slice(0, 5) : '—';

  return (
    <li className="flex flex-col gap-4 p-4 transition-colors duration-200 hover:bg-crema-100/60 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex min-w-0 items-start gap-4">
        <span className="flex h-12 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-rosa-100">
          <Clock3 size={13} strokeWidth={1.5} className="text-rosa-600" aria-hidden="true" />
          <span className="texto--1 font-medium tabular-nums text-tinta-900">{hora}</span>
        </span>

        <div className="min-w-0">
          <h3 className="texto-0 font-medium text-tinta-900">{booking.client_name}</h3>
          <p className="texto--1 text-tinta-600">{booking.service_name || 'Servicio'}</p>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 texto--1 text-tinta-500">
            <a
              href={`tel:${booking.client_phone}`}
              className="flex items-center gap-1.5 py-0.5 transition-colors duration-200 hover:text-tinta-900"
            >
              <Phone size={12} strokeWidth={1.5} aria-hidden="true" />
              {booking.client_phone}
            </a>
            <a
              href={`mailto:${booking.client_email}`}
              className="flex items-center gap-1.5 truncate py-0.5 transition-colors duration-200 hover:text-tinta-900"
            >
              <Mail size={12} strokeWidth={1.5} aria-hidden="true" />
              {booking.client_email}
            </a>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end">
        <div className="text-left sm:text-right">
          <span className={`inline-block rounded-full px-3 py-1 texto--1 font-medium ${estado.clase}`}>
            {estado.label}
          </span>
          <p className="mt-1 texto--1 text-tinta-500">
            {booking.deposit_paid ? 'Pagado' : 'Sin pago'} · {formatPrice(booking.total_amount)}
          </p>
        </div>

        <div className="flex gap-2">
          {booking.status === 'pending' && (
            <>
              <button
                onClick={() => onEstado(booking.id, 'confirmed')}
                disabled={actualizando}
                aria-label={`Confirmar cita de ${booking.client_name}`}
                className="rounded-full bg-emerald-100 p-2.5 text-emerald-900 transition-all duration-200 hover:bg-emerald-200 active:scale-95 disabled:opacity-40"
              >
                <Check size={16} strokeWidth={2} aria-hidden="true" />
              </button>
              <button
                onClick={() => onEstado(booking.id, 'cancelled')}
                disabled={actualizando}
                aria-label={`Cancelar cita de ${booking.client_name}`}
                className="rounded-full bg-tinta-900/8 p-2.5 text-tinta-600 transition-all duration-200 hover:bg-tinta-900/15 active:scale-95 disabled:opacity-40"
              >
                <X size={16} strokeWidth={2} aria-hidden="true" />
              </button>
            </>
          )}
          {booking.status === 'confirmed' && (
            <button
              onClick={() => onEstado(booking.id, 'completed')}
              disabled={actualizando}
              aria-label={`Marcar como completada la cita de ${booking.client_name}`}
              className="flex items-center gap-1.5 rounded-full bg-rosa-200 px-4 py-2 texto--1 font-medium text-tinta-900 transition-all duration-200 hover:bg-rosa-300 active:scale-95 disabled:opacity-40"
            >
              <CircleCheck size={15} strokeWidth={1.5} aria-hidden="true" />
              Completar
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
