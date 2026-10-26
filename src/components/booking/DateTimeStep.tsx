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
          <Icono size={18} strokeWidth={1.4} className="text-cobre-400/70" aria-hidden="true" />
          <h4 className="linea-cobre flex-1 border-b pb-1 texto--1 uppercase espaciado-amplio text-nacar-200/80">
            {titulo}
          </h4>
          <span className="texto--2 text-nacar-300">
            {libres > 0 ? `${libres} libre${libres > 1 ? 's' : ''}` : 'sin cupos'}
          </span>
        </div>

        {/* Tres columnas desde lg: con dos, veinte horarios hacían diez filas
            y la sección se estiraba casi una pantalla completa en escritorio,
            donde el ancho sobraba. */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
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
                className={`flex items-center justify-center rounded-full border px-3 py-2.5 texto-0 tabular-nums transition-all duration-300 ease-out active:scale-95 ${
                  !slot.available
                    ? 'cursor-not-allowed border-transparent text-nacar-300/35 line-through decoration-cobre-400/25'
                    : activo
                      ? 'boton-metal border-transparent font-medium text-vino-900'
                      : 'border-cobre-400/20 bg-tinta-870 text-nacar-200/90 hover:border-cobre-300/60 hover:text-crema-100'
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
    /* `grid-cols-1` fija la columna en minmax(0, 1fr): sin eso, la tira de
       días le imponía su ancho completo y el paso entero se salía de la
       pantalla por la derecha. */
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:items-start lg:gap-10">
      {/* Calendario en tarjeta propia: se lee como un objeto, no como una
          franja más del formulario. */}
      <div className="min-w-0 rounded-2xl border border-crema-100/5 bg-tinta-870 p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h3 className="font-display texto-2 capitalize text-crema-100">{rangoMeses}</h3>

        </div>

        {/*
          En el teléfono, los días van en una tira que se desliza con el dedo,
          como en las apps de reserva: se ven cinco a la vez, cada uno con su
          nombre, y no hace falta paginar semana por semana con flechas.
        */}
        <div className="-mx-5 flex snap-x gap-2 overflow-x-auto px-5 pb-1 sin-barra sm:hidden">
          {dias.map((dia) => {
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
                className={`flex w-[3.9rem] shrink-0 snap-start flex-col items-center gap-1 rounded-2xl py-3 transition-all duration-300 ease-out active:scale-95 ${
                  domingo
                    ? 'cursor-not-allowed text-nacar-300/45'
                    : activo
                      ? 'boton-metal text-vino-900'
                      : 'border border-cobre-400/15 bg-tinta-860/60 text-nacar-200/90'
                }`}
              >
                <span className="texto--2 uppercase espaciado-medio">
                  {format(dia, 'EEE', { locale: es }).replace('.', '')}
                </span>
                <span className="font-display texto-2 tabular-nums leading-none">{format(dia, 'd')}</span>
                <span className={`texto--2 ${activo ? 'text-vino-900/70' : 'text-cobre-300'}`}>
                  {domingo ? 'cerrado' : (relativa ?? '\u00a0')}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mb-3 hidden grid-cols-7 gap-1 sm:grid sm:gap-2">
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

        <div className="hidden space-y-2 sm:block">
          {semanas.map((sem, si) => (
            <div key={si} className="grid grid-cols-7 gap-2">
              {sem.map((dia) => {
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
                          ? 'boton-metal font-medium text-vino-900'
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
                          activo ? 'bg-vino-900/60' : 'bg-cobre-400/70'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <p className="linea-cobre mt-5 border-t pt-4 texto--1 text-nacar-300">
          {fecha ? (
            <span className="inline-block text-crema-100/90 first-letter:uppercase">
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
