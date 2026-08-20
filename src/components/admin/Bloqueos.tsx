import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Loader2, CalendarOff } from 'lucide-react';
import { getBloqueos, crearBloqueo, borrarBloqueo, type Bloqueo } from '../../lib/api';

/**
 * Bloqueos de agenda del día seleccionado.
 *
 * Cada bloqueo se espeja como evento en Google Calendar, así que da lo mismo
 * si Ignacia lo hace desde acá o directamente en su calendario: los dos lados
 * quedan sincronizados.
 */
export default function Bloqueos({ fecha }: { fecha: string }) {
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ timeStart: '13:00', timeEnd: '14:00', reason: '' });

  const cargar = useCallback(async () => {
    setCargando(true);
    setBloqueos(await getBloqueos(fecha));
    setCargando(false);
  }, [fecha]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function agregar() {
    setGuardando(true);
    setError('');
    const r = await crearBloqueo({ date: fecha, ...form });
    if (r.ok) {
      setAbierto(false);
      setForm({ timeStart: '13:00', timeEnd: '14:00', reason: '' });
      await cargar();
    } else {
      setError(r.error || 'No se pudo bloquear');
    }
    setGuardando(false);
  }

  async function quitar(id: string) {
    // Optimista: la fila desaparece al instante y se recarga al confirmar.
    setBloqueos((prev) => prev.filter((b) => b.id !== id));
    await borrarBloqueo(id);
    await cargar();
  }

  const INPUT =
    'border-0 border-b border-dorado-400/40 bg-transparent py-2 texto--1 text-tinta-900 ' +
    'transition-colors duration-300 focus:border-tinta-900 focus:outline-none';

  return (
    <section className="linea-oro mb-8 border-y py-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="texto--1 uppercase espaciado-medio text-tinta-900">Horarios bloqueados</h2>
        <button
          onClick={() => setAbierto(!abierto)}
          className="inline-flex items-center gap-1.5 texto--1 uppercase espaciado-medio text-dorado-700 transition-colors duration-300 hover:text-tinta-900"
        >
          {abierto ? <X size={14} strokeWidth={1.5} /> : <Plus size={14} strokeWidth={1.5} />}
          {abierto ? 'Cancelar' : 'Bloquear'}
        </button>
      </div>

      {abierto && (
        <div className="anim-entrada mb-5 grid gap-4 sm:grid-cols-4 sm:items-end">
          <label className="block">
            <span className="mb-1 block texto--2 uppercase espaciado-medio text-tinta-500">Desde</span>
            <input
              type="time"
              value={form.timeStart}
              onChange={(e) => setForm({ ...form, timeStart: e.target.value })}
              className={`${INPUT} w-full`}
            />
          </label>
          <label className="block">
            <span className="mb-1 block texto--2 uppercase espaciado-medio text-tinta-500">Hasta</span>
            <input
              type="time"
              value={form.timeEnd}
              onChange={(e) => setForm({ ...form, timeEnd: e.target.value })}
              className={`${INPUT} w-full`}
            />
          </label>
          <label className="block sm:col-span-1">
            <span className="mb-1 block texto--2 uppercase espaciado-medio text-tinta-500">Motivo</span>
            <input
              type="text"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Almuerzo, trámite…"
              className={`${INPUT} w-full placeholder:text-tinta-400`}
            />
          </label>
          <button
            onClick={agregar}
            disabled={guardando}
            className="flex items-center justify-center gap-2 bg-tinta-900 px-5 py-3 texto--1 uppercase espaciado-medio text-crema-100 transition-all duration-300 hover:bg-tinta-800 active:scale-95 disabled:opacity-40"
          >
            {guardando ? <Loader2 size={14} className="animate-spin" /> : 'Confirmar'}
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="mb-4 texto--1 text-tinta-800">
          {error}
        </p>
      )}

      {cargando ? (
        <p className="texto--1 text-tinta-400">Cargando…</p>
      ) : bloqueos.length === 0 ? (
        <p className="flex items-center gap-2 texto--1 text-tinta-500">
          <CalendarOff size={14} strokeWidth={1.5} className="text-tinta-400" aria-hidden="true" />
          Sin bloqueos para este día.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {bloqueos.map((b) => (
            <li
              key={b.id}
              className="linea-oro flex items-center gap-3 border px-3 py-1.5 texto--1 text-tinta-800"
            >
              <span className="tabular-nums">
                {String(b.time_start).slice(0, 5)} — {String(b.time_end).slice(0, 5)}
              </span>
              {b.reason && <span className="text-tinta-500">{b.reason}</span>}
              <button
                onClick={() => quitar(b.id)}
                aria-label={`Quitar bloqueo de ${String(b.time_start).slice(0, 5)}`}
                className="text-tinta-400 transition-colors duration-200 hover:text-tinta-900"
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
