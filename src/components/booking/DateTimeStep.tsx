import { format, addDays, startOfDay, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarDays, Clock3, CalendarX2 } from 'lucide-react';
import type { TimeSlot } from '../../types';
import { TimeSlotSkeleton } from '../ui/Skeleton';

interface Props {
  fecha: Date | null;
  hora: string;
  slots: TimeSlot[];
  cargandoSlots: boolean;
  onFecha: (d: Date) => void;
  onHora: (h: string) => void;
}

/** Dos semanas por delante: suficiente para agendar sin abrumar con un calendario completo. */
function proximosDias(cantidad = 14): Date[] {
  const hoy = startOfDay(new Date());
  return Array.from({ length: cantidad }, (_, i) => addDays(hoy, i));
}

export default function DateTimeStep({
  fecha,
  hora,
  slots,
  cargandoSlots,
  onFecha,
  onHora,
}: Props) {
  const dias = proximosDias();
  const disponibles = slots.filter((s) => s.available);

  return (
    <div className="space-y-9">
      <div>
        <h3 className="mb-4 flex items-center gap-2 texto-1 text-tinta-900">
          <CalendarDays size={18} strokeWidth={1.5} className="text-rosa-500" aria-hidden="true" />
          Elige el día
        </h3>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {dias.map((dia) => {
            const domingo = dia.getDay() === 0;
            const activo = fecha && isSameDay(dia, fecha);

            return (
              <button
                key={dia.toISOString()}
                type="button"
                disabled={domingo}
                onClick={() => onFecha(dia)}
                aria-pressed={!!activo}
                aria-label={format(dia, "EEEE d 'de' MMMM", { locale: es })}
                className={`rounded-xl py-2.5 text-center transition-all duration-200 ease-out ${
                  domingo
                    ? 'cursor-not-allowed bg-tinta-900/4 text-tinta-400/60'
                    : activo
                      ? 'bg-tinta-900 text-crema-100 shadow-sm'
                      : 'bg-crema-200/70 text-tinta-700 hover:bg-rosa-100 active:scale-95'
                }`}
              >
                <span className="block texto--1 capitalize opacity-70">
                  {format(dia, 'EEEEE', { locale: es })}
                </span>
                <span className="block text-base font-medium">{format(dia, 'd')}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 texto--1 text-tinta-500">
          {fecha
            ? format(fecha, "EEEE d 'de' MMMM", { locale: es })
            : 'Los domingos permanecemos cerrados.'}
        </p>
      </div>

      {fecha && (
        <div className="anim-entrada">
          <h3 className="mb-4 flex items-center gap-2 texto-1 text-tinta-900">
            <Clock3 size={18} strokeWidth={1.5} className="text-rosa-500" aria-hidden="true" />
            Horarios disponibles
          </h3>

          {cargandoSlots ? (
            <TimeSlotSkeleton />
          ) : disponibles.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-tinta-900/10 bg-crema-50 py-10 text-center">
              <CalendarX2 size={26} strokeWidth={1.3} className="mb-3 text-tinta-400" aria-hidden="true" />
              <p className="texto--1 text-tinta-600">
                No quedan horarios para este día. Prueba con otra fecha.
              </p>
            </div>
          ) : (
            <div
              role="radiogroup"
              aria-label="Horarios disponibles"
              className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5"
            >
              {slots.map((slot) => {
                const activo = hora === slot.time;
                return (
                  <button
                    key={slot.time}
                    type="button"
                    role="radio"
                    aria-checked={activo}
                    disabled={!slot.available}
                    onClick={() => onHora(slot.time)}
                    className={`rounded-xl py-3 texto--1 font-medium transition-all duration-200 ease-out ${
                      !slot.available
                        ? 'cursor-not-allowed bg-tinta-900/4 text-tinta-400/60 line-through'
                        : activo
                          ? 'bg-tinta-900 text-crema-100 shadow-sm'
                          : 'bg-rosa-100/70 text-tinta-800 hover:bg-rosa-200 active:scale-95'
                    }`}
                  >
                    {slot.time}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
