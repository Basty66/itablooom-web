import { format, addDays, startOfDay, isSameDay, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarX2 } from 'lucide-react';
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

/**
 * Selector de fecha y hora, en el sistema minimalista.
 *
 * Sin rellenos de color: el día y la hora elegidos se marcan en tinta sólida y
 * el resto vive de líneas finas. Antes los horarios eran bloques rosados que
 * competían entre sí y desalineaban la paleta del resto del sitio.
 */
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
  const semanas = [dias.slice(0, 7), dias.slice(7)];

  const disponibles = slots.filter((s) => s.available);
  const manana = slots.filter((s) => Number(s.time.split(':')[0]) < 13);
  const tarde = slots.filter((s) => Number(s.time.split(':')[0]) >= 13);

  const rangoMeses = (() => {
    const [inicio, fin] = [dias[0], dias[dias.length - 1]];
    return isSameMonth(inicio, fin)
      ? format(inicio, 'MMMM yyyy', { locale: es })
      : `${format(inicio, 'MMM', { locale: es })} — ${format(fin, 'MMM yyyy', { locale: es })}`;
  })();

  function franja(titulo: string, lista: TimeSlot[]) {
    if (lista.length === 0) return null;
    const libres = lista.filter((s) => s.available).length;

    return (
      <div>
        <div className="mb-4 flex items-baseline gap-3">
          <h4 className="texto--1 uppercase espaciado-medio text-crema-100">{titulo}</h4>
          <span className="linea-oro flex-1 border-t" aria-hidden="true" />
          <span className="texto--1 text-crema-100/40">
            {libres > 0 ? `${libres} libre${libres > 1 ? 's' : ''}` : 'sin cupos'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
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
                className={`border py-3 texto--1 tabular-nums transition-all duration-300 ease-out ${
                  !slot.available
                    ? 'cursor-not-allowed border-crema-100/10 text-crema-100/25 line-through'
                    : activo
                      ? 'border-tinta-900 bg-dorado-400 text-tinta-900'
                      : 'linea-oro text-crema-100/90 hover:border-dorado-500 hover:bg-dorado-100/40'
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
    <div className="space-y-12">
      <div>
        <div className="mb-5 flex items-baseline justify-between gap-3">
          <h3 className="texto--1 uppercase espaciado-medio text-crema-100">Elige el día</h3>
          <span className="texto--1 capitalize text-crema-100/55">{rangoMeses}</span>
        </div>

        {/* Cabecera fija de días: ancla la lectura de ambas semanas. */}
        <div className="linea-oro mb-3 grid grid-cols-7 gap-1 border-b pb-3 sm:gap-2">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
            <span
              key={i}
              aria-hidden="true"
              className="text-center texto--2 uppercase espaciado-medio text-crema-100/40"
            >
              {d}
            </span>
          ))}
        </div>

        <div className="space-y-2">
          {semanas.map((semana, si) => (
            <div key={si} className="grid grid-cols-7 gap-1 sm:gap-2">
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
                    className={`flex aspect-square flex-col items-center justify-center border transition-all duration-300 ease-out ${
                      domingo
                        ? 'cursor-not-allowed border-transparent text-crema-100/40/40'
                        : activo
                          ? 'border-tinta-900 bg-dorado-400 text-tinta-900'
                          : 'border-transparent text-crema-100/90 hover:border-dorado-400/50'
                    }`}
                  >
                    <span className="texto-0 tabular-nums leading-none">{format(dia, 'd')}</span>
                    {relativa && (
                      <span
                        className={`mt-1 texto--2 leading-none ${
                          activo ? 'text-dorado-300' : 'text-dorado-300'
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

        <p className="mt-4 texto--1 text-crema-100/55">
          {fecha ? (
            <span className="capitalize text-crema-100/90">
              {format(fecha, "EEEE d 'de' MMMM", { locale: es })}
            </span>
          ) : (
            'Los domingos permanecemos cerrados.'
          )}
        </p>
      </div>

      {fecha && (
        <div className="anim-entrada linea-oro space-y-10 border-t pt-10">
          {cargandoSlots ? (
            <TimeSlotSkeleton />
          ) : disponibles.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <CalendarX2 size={24} strokeWidth={1.2} className="mb-4 text-crema-100/40" aria-hidden="true" />
              <p className="texto--1 text-crema-100/70">
                No quedan horarios para este día. Prueba con otra fecha.
              </p>
            </div>
          ) : (
            <>
              {franja('Mañana', manana)}
              {franja('Tarde', tarde)}
            </>
          )}
        </div>
      )}
    </div>
  );
}
