import { format, addDays, startOfDay, isSameDay, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarDays, Sunrise, Sunset, CalendarX2 } from 'lucide-react';
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

const DIAS_VISIBLES = 14;

function proximosDias(): Date[] {
  const hoy = startOfDay(new Date());
  return Array.from({ length: DIAS_VISIBLES }, (_, i) => addDays(hoy, i));
}

/** "hoy" y "mañana" ubican mejor que un número suelto de calendario. */
function etiquetaRelativa(dia: Date, hoy: Date): string | null {
  if (isSameDay(dia, hoy)) return 'hoy';
  if (isSameDay(dia, addDays(hoy, 1))) return 'mañana';
  return null;
}

export default function DateTimeStep({
  fecha,
  hora,
  slots,
  cargandoSlots,
  onFecha,
  onHora,
}: Props) {
  const hoy = startOfDay(new Date());
  const dias = proximosDias();
  // Dos filas de siete: cada una es una semana corrida desde hoy.
  const semanas = [dias.slice(0, 7), dias.slice(7)];

  const disponibles = slots.filter((s) => s.available);
  // Separar por franja evita una parrilla larga e indiferenciada de horas.
  const manana = slots.filter((s) => Number(s.time.split(':')[0]) < 13);
  const tarde = slots.filter((s) => Number(s.time.split(':')[0]) >= 13);

  const rangoMeses = (() => {
    const inicio = dias[0];
    const fin = dias[dias.length - 1];
    return isSameMonth(inicio, fin)
      ? format(inicio, 'MMMM yyyy', { locale: es })
      : `${format(inicio, 'MMMM', { locale: es })} — ${format(fin, 'MMMM yyyy', { locale: es })}`;
  })();

  function renderFranja(titulo: string, icono: typeof Sunrise, lista: TimeSlot[]) {
    if (lista.length === 0) return null;
    const Icono = icono;
    const libres = lista.filter((s) => s.available).length;

    return (
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Icono size={15} strokeWidth={1.5} className="text-rosa-500" aria-hidden="true" />
          <h4 className="texto--1 font-medium uppercase tracking-[0.15em] text-tinta-600">
            {titulo}
          </h4>
          <span className="texto--1 text-tinta-400">
            {libres > 0 ? `${libres} disponible${libres > 1 ? 's' : ''}` : 'sin cupos'}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {lista.map((slot) => {
            const activo = hora === slot.time;
            return (
              <button
                key={slot.time}
                type="button"
                role="radio"
                aria-checked={activo}
                disabled={!slot.available}
                onClick={() => onHora(slot.time)}
                className={`rounded-xl py-3 texto--1 font-medium tabular-nums transition-all duration-200 ease-out ${
                  !slot.available
                    ? 'cursor-not-allowed bg-tinta-900/4 text-tinta-400/50 line-through'
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
      </div>
    );
  }

  return (
    <div className="space-y-9">
      <div>
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h3 className="flex items-center gap-2 texto-1 text-tinta-900">
            <CalendarDays size={18} strokeWidth={1.5} className="text-rosa-500" aria-hidden="true" />
            Elige el día
          </h3>
          <span className="texto--1 capitalize text-tinta-500">{rangoMeses}</span>
        </div>

        <div className="rounded-2xl border border-tinta-900/8 bg-crema-50 p-3 sm:p-4">
          {/* Cabecera fija de días: ancla la lectura de ambas semanas. */}
          <div className="mb-2 grid grid-cols-7 gap-1.5 sm:gap-2">
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
              <span
                key={i}
                aria-hidden="true"
                className="text-center texto--1 font-medium uppercase text-tinta-400"
              >
                {d}
              </span>
            ))}
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            {semanas.map((semana, si) => (
              <div key={si} className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {semana.map((dia) => {
                  const domingo = dia.getDay() === 0;
                  const activo = fecha && isSameDay(dia, fecha);
                  const relativa = etiquetaRelativa(dia, hoy);

                  return (
                    <button
                      key={dia.toISOString()}
                      type="button"
                      disabled={domingo}
                      onClick={() => onFecha(dia)}
                      aria-pressed={!!activo}
                      aria-label={format(dia, "EEEE d 'de' MMMM", { locale: es })}
                      className={`relative flex flex-col items-center rounded-xl py-2 transition-all duration-200 ease-out ${
                        domingo
                          ? 'cursor-not-allowed text-tinta-400/50'
                          : activo
                            ? 'bg-tinta-900 text-crema-100 shadow-sm'
                            : 'text-tinta-800 hover:bg-rosa-100 active:scale-95'
                      }`}
                    >
                      <span className="texto--1 capitalize opacity-60">
                        {format(dia, 'EEE', { locale: es }).slice(0, 3)}
                      </span>
                      <span className="text-base font-medium tabular-nums leading-tight">
                        {format(dia, 'd')}
                      </span>
                      {relativa && (
                        <span
                          className={`texto--1 leading-none ${
                            activo ? 'text-rosa-200' : 'text-rosa-600'
                          }`}
                        >
                          {relativa}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <p className="mt-3 texto--1 text-tinta-500">
          {fecha ? (
            <span className="capitalize text-tinta-700">
              {format(fecha, "EEEE d 'de' MMMM", { locale: es })}
            </span>
          ) : (
            'Los domingos permanecemos cerrados.'
          )}
        </p>
      </div>

      {fecha && (
        <div className="anim-entrada space-y-7 border-t border-tinta-900/8 pt-7">
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
            <>
              {renderFranja('Mañana', Sunrise, manana)}
              {renderFranja('Tarde', Sunset, tarde)}
            </>
          )}
        </div>
      )}
    </div>
  );
}
