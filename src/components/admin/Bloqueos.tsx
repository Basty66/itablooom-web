import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Loader2, CalendarOff } from 'lucide-react';
import { getBloqueos, crearBloqueo, borrarBloqueo, type Bloqueo } from '../../lib/api';

/** Jornada completa: cubre cualquier horario de atención presente o futuro. */
const DIA_COMPLETO = { inicio: '00:00', fin: '23:59' };

/** Tope de seguridad: bloquear más de dos meses de una vez suele ser un error. */
const MAX_DIAS = 62;

/** Días del rango, ambos extremos incluidos, en formato YYYY-MM-DD. */
function diasEntre(desde: string, hasta: string): string[] {
  const dias: string[] = [];
  const [ay, am, ad] = desde.split('-').map(Number);
  const [by, bm, bd] = hasta.split('-').map(Number);
  const cursor = new Date(ay, am - 1, ad);
  const fin = new Date(by, bm - 1, bd);
  while (cursor <= fin && dias.length <= MAX_DIAS) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, '0');
    const d = String(cursor.getDate()).padStart(2, '0');
    dias.push(`${y}-${m}-${d}`);
    cursor.setDate(cursor.getDate() + 1);
  }
  return dias;
}

/**
 * Bloqueos de agenda.
 *
 * Cada bloqueo se espeja como evento en Google Calendar, así que da lo mismo
 * si Ignacia lo hace desde acá o directamente en su calendario: los dos lados
 * quedan sincronizados.
 *
 * La lista muestra el día que está abierto en la agenda, pero el formulario
 * acepta un rango: unas vacaciones o un fin de semana largo se bloqueaban
 * día por día, volviendo a la agenda y repitiendo el formulario cada vez.
 */
export default function Bloqueos({ fecha }: { fecha: string }) {
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [form, setForm] = useState({
    dateStart: fecha,
    dateEnd: fecha,
    timeStart: '13:00',
    timeEnd: '14:00',
    reason: '',
    diaCompleto: false,
  });

  const cargar = useCallback(async () => {
    setCargando(true);
    setBloqueos(await getBloqueos(fecha));
    setCargando(false);
  }, [fecha]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Al cambiar el día de la agenda, el formulario lo toma como punto de partida.
  useEffect(() => {
    setForm((f) => ({ ...f, dateStart: fecha, dateEnd: fecha }));
  }, [fecha]);

  async function agregar() {
    setError('');
    setAviso('');

    if (form.dateEnd < form.dateStart) {
      setError('La fecha final no puede ser anterior a la inicial.');
      return;
    }
    const dias = diasEntre(form.dateStart, form.dateEnd);
    if (dias.length > MAX_DIAS) {
      setError(`Son demasiados días de una vez (máximo ${MAX_DIAS}).`);
      return;
    }

    setGuardando(true);
    const horas = form.diaCompleto
      ? { timeStart: DIA_COMPLETO.inicio, timeEnd: DIA_COMPLETO.fin }
      : { timeStart: form.timeStart, timeEnd: form.timeEnd };

    // Uno por día: el endpoint recibe una fecha, y agregar otro para rangos
    // gastaría una de las funciones que quedan disponibles en el plan.
    const resultados = await Promise.all(
      dias.map((date) => crearBloqueo({ date, ...horas, reason: form.reason }))
    );
    const fallaron = resultados.filter((r) => !r.ok);

    setGuardando(false);

    if (fallaron.length === dias.length) {
      setError(fallaron[0]?.error || 'No se pudo bloquear');
      return;
    }
    if (fallaron.length > 0) {
      setAviso(`Se bloquearon ${dias.length - fallaron.length} de ${dias.length} días.`);
    } else {
      setAviso(
        dias.length === 1
          ? 'Día bloqueado.'
          : `${dias.length} días bloqueados, del ${form.dateStart} al ${form.dateEnd}.`
      );
    }
    setAbierto(false);
    setForm((f) => ({ ...f, reason: '', diaCompleto: false }));
    await cargar();
  }

  async function quitar(id: string) {
    // Optimista: la fila desaparece al instante y se recarga al confirmar.
    setBloqueos((prev) => prev.filter((b) => b.id !== id));
    await borrarBloqueo(id);
    await cargar();
  }

  // Campo tonal del sistema: sobre la tarjeta, el input transparente se
  // confundía con el fondo y no se veía dónde había que escribir.
  const INPUT = 'campo w-full px-3 py-2.5 texto--1';
  const ETIQUETA = 'mb-1 block texto--2 uppercase espaciado-medio text-nacar-300';

  const dias = diasEntre(form.dateStart, form.dateEnd);

  return (
    <section className="mb-6 rounded-2xl bg-tinta-870 p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display texto-2 text-crema-100">Horarios bloqueados</h2>
        <button
          onClick={() => {
            setAbierto(!abierto);
            setAviso('');
            setError('');
          }}
          className="inline-flex items-center gap-1.5 texto--1 uppercase espaciado-medio text-dorado-300 transition-colors duration-300 hover:text-crema-100"
        >
          {abierto ? <X size={14} strokeWidth={1.5} /> : <Plus size={14} strokeWidth={1.5} />}
          {abierto ? 'Cancelar' : 'Bloquear'}
        </button>
      </div>

      {abierto && (
        <div className="anim-entrada mb-5 flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={ETIQUETA}>Desde el día</span>
              <input
                type="date"
                value={form.dateStart}
                onChange={(e) => setForm({ ...form, dateStart: e.target.value })}
                className={INPUT}
              />
            </label>
            <label className="block">
              <span className={ETIQUETA}>Hasta el día</span>
              <input
                type="date"
                value={form.dateEnd}
                min={form.dateStart}
                onChange={(e) => setForm({ ...form, dateEnd: e.target.value })}
                className={INPUT}
              />
            </label>
          </div>

          <label className="flex w-fit cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={form.diaCompleto}
              onChange={(e) => setForm({ ...form, diaCompleto: e.target.checked })}
              className="h-4 w-4 accent-rosa-300"
            />
            <span className="texto--1 text-nacar-200/85">
              Bloquear el día completo (vacaciones, feriado)
            </span>
          </label>

          {/* Las horas solo aplican si no es jornada completa. */}
          {!form.diaCompleto && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={ETIQUETA}>Desde las</span>
                <input
                  type="time"
                  value={form.timeStart}
                  onChange={(e) => setForm({ ...form, timeStart: e.target.value })}
                  className={INPUT}
                />
              </label>
              <label className="block">
                <span className={ETIQUETA}>Hasta las</span>
                <input
                  type="time"
                  value={form.timeEnd}
                  onChange={(e) => setForm({ ...form, timeEnd: e.target.value })}
                  className={INPUT}
                />
              </label>
            </div>
          )}

          <label className="block">
            <span className={ETIQUETA}>Motivo</span>
            <input
              type="text"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Almuerzo, vacaciones, trámite…"
              className={`${INPUT} placeholder:text-nacar-300`}
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={agregar}
              disabled={guardando}
              className="brillo brillo-hover flex items-center justify-center gap-2 rounded-[var(--radius-suave)] bg-rosa-300 px-6 py-3 texto--1 font-medium uppercase espaciado-medio text-vino-900 transition-all duration-300 hover:bg-rosa-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
            >
              {guardando ? <Loader2 size={14} className="animate-spin" /> : 'Confirmar bloqueo'}
            </button>
            {/* Cuántos días se van a bloquear, antes de confirmar. */}
            <span className="texto--1 text-nacar-300">
              {dias.length === 1 ? 'Un día' : `${dias.length} días`}
              {form.diaCompleto ? ', jornada completa' : ''}
            </span>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mb-4 texto--1 text-rosa-300">
          {error}
        </p>
      )}
      {aviso && <p className="mb-4 texto--1 text-emerald-300">{aviso}</p>}

      {cargando ? (
        <p className="texto--1 text-nacar-300">Cargando…</p>
      ) : bloqueos.length === 0 ? (
        <p className="flex items-center gap-2 texto--1 text-nacar-300">
          <CalendarOff size={14} strokeWidth={1.5} className="text-nacar-300" aria-hidden="true" />
          Sin bloqueos para este día.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {bloqueos.map((b) => (
            <li
              key={b.id}
              className="linea-oro flex items-center gap-3 rounded-[var(--radius-suave)] border px-3 py-2 texto--1 text-nacar-100"
            >
              <span className="tabular-nums">
                {String(b.time_start).slice(0, 5)} — {String(b.time_end).slice(0, 5)}
              </span>
              {b.reason && <span className="text-nacar-300">{b.reason}</span>}
              <button
                onClick={() => quitar(b.id)}
                aria-label={`Quitar bloqueo de ${String(b.time_start).slice(0, 5)}`}
                className="text-nacar-300 transition-colors duration-200 hover:text-crema-100"
              >
                <X size={13} strokeWidth={2} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
