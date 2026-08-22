import { format, addDays, startOfDay, isSameDay, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarX2, Sun, Moon } from 'lucide-react';
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
 * Selector de fecha y hora.
 *
 * El calendario vive en su propia tarjeta y los horarios van al costado,
 * separados en mañana y tarde. Antes ambos eran listas planas encadenadas:
 * había que scrollear el día entero para llegar a las horas y no se veía la
 * relación entre lo que se elegía arriba y lo que aparecía abajo.
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

  function franja(titulo: string, Icono: typeof Sun, lista: TimeSlot[]) {
    if (lista.length === 0) return null;
    const libres = lista.filter((s) => s.available).length;

    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Icono size={18} strokeWidth={1.4} className="text-dorado-400/70" aria-hidden="true" />
          <h4 className="linea-oro flex-1 border-b pb-1 texto--1 uppercase espaciado-amplio text-nacar-200/80">
            {titulo}
          </h4>
          <span className="texto--2 text-nacar-300">
            {libres > 0 ? `${libres} libre${libres > 1 ? 's' : ''}` : 'sin cupos'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
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
                className={`flex items-center justify-center rounded-[var(--radius-suave)] border px-4 py-3 texto-0 tabular-nums transition-all duration-300 ease-out ${
                  !slot.available
                    ? 'cursor-not-allowed border-dorado-400/5 bg-tinta-880 text-nacar-300/40 line-through decoration-dorado-400/20'
                    : activo
                      ? 'border-rosa-300 bg-rosa-300/10 font-medium text-rosa-300'
                      : 'border-dorado-400/10 bg-tinta-880 text-nacar-200/85 hover:border-dorado-400/30 hover:bg-tinta-840 hover:text-crema-100'
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
    <div className="grid gap-8 md:grid-cols-2 md:items-start lg:gap-10">
      {/* Calendario en tarjeta propia: se lee como un objeto, no como una
          franja más del formulario. */}
      <div className="rounded-2xl border border-crema-100/5 bg-tinta-870 p-5 sm:p-6">
        <div className="mb-5 flex items-baseline justify-between gap-3">
          <h3 className="font-display texto-2 capitalize text-crema-100">{rangoMeses}</h3>
        </div>

        <div className="mb-3 grid grid-cols-7 gap-1 sm:gap-2">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
            <span
              key={i}
              aria-hidden="true"
              className="pb-2 text-center texto--2 uppercase espaciado-medio text-nacar-300/60"
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
                    className={`relative flex aspect-square flex-col items-center justify-center rounded-[var(--radius-suave)] transition-all duration-300 ease-out ${
                      /* El domingo queda apagado pero visible: al 25% el
                         número desaparecía y el calendario parecía tener
                         huecos en vez de días cerrados. */
                      domingo
                        ? 'cursor-not-allowed text-nacar-300/55'
                        : activo
                          ? 'bg-rosa-300 font-medium text-vino-900'
                          : 'text-nacar-200/85 hover:bg-tinta-840 hover:text-crema-100'
                    }`}
                  >
                    <span className="texto-0 tabular-nums leading-none">{format(dia, 'd')}</span>
                    {/* Punto bajo el número: marca hoy y mañana sin robarle
                        espacio a la cifra, que es lo que se escanea. */}
                    {relativa && (
                      <span
                        aria-hidden="true"
                        className={`absolute bottom-1.5 h-1 w-1 rounded-full ${
                          activo ? 'bg-vino-900/60' : 'bg-dorado-400/70'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <p className="linea-oro mt-5 border-t pt-4 texto--1 text-nacar-300">
          {fecha ? (
            <span className="capitalize text-crema-100/90">
              {format(fecha, "EEEE d 'de' MMMM", { locale: es })}
            </span>
          ) : (
            'Los domingos permanecemos cerrados.'
          )}
        </p>
      </div>

      {/* Horarios: quedan al costado en escritorio, así se ve el día elegido
          y sus horas de una sola mirada. */}
      <div className="flex flex-col gap-8">
        {!fecha ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-crema-100/10 px-6 py-14 text-center">
            <CalendarX2 size={26} strokeWidth={1.2} className="mb-4 text-nacar-300/60" aria-hidden="true" />
            <p className="texto--1 text-nacar-300">Elige un día para ver los horarios disponibles.</p>
          </div>
        ) : cargandoSlots ? (
          <TimeSlotSkeleton />
        ) : disponibles.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-crema-100/10 px-6 py-14 text-center">
            <CalendarX2 size={26} strokeWidth={1.2} className="mb-4 text-nacar-300/60" aria-hidden="true" />
            <p className="texto--1 text-nacar-200/80">
              No quedan horarios para este día. Prueba con otra fecha.
            </p>
          </div>
        ) : (
          <div className="anim-entrada flex flex-col gap-8">
            {franja('Mañana', Sun, manana)}
            {franja('Tarde', Moon, tarde)}
          </div>
        )}
      </div>
    </div>
  );
}
