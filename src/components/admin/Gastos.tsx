import { useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { formatPrice } from '../../lib/format';
import { crearGasto, borrarGasto, type Gasto } from '../../lib/api';

const CATEGORIAS = [
  { id: 'materiales', label: 'Materiales' },
  { id: 'arriendo', label: 'Arriendo' },
  { id: 'servicios', label: 'Servicios' },
  { id: 'publicidad', label: 'Publicidad' },
  { id: 'otros', label: 'Otros' },
];

/**
 * Gastos del mes.
 *
 * Sin esto el panel solo muestra lo que entró; con esto muestra lo que
 * realmente queda, que es el número que importa para saber si el mes cerró
 * bien.
 */
export default function Gastos({ gastos, onCambio }: { gastos: Gasto[]; onCambio: () => void }) {
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ descripcion: '', monto: '', categoria: 'materiales' });

  async function agregar() {
    if (!form.descripcion.trim() || !form.monto) {
      setError('Escribe una descripción y un monto');
      return;
    }
    setGuardando(true);
    setError('');
    const r = await crearGasto({
      descripcion: form.descripcion.trim(),
      monto: Number(form.monto),
      categoria: form.categoria,
    });
    if (r.ok) {
      setForm({ descripcion: '', monto: '', categoria: 'materiales' });
      setAbierto(false);
      onCambio();
    } else {
      setError(r.error || 'No se pudo guardar');
    }
    setGuardando(false);
  }

  async function quitar(id: string) {
    await borrarGasto(id);
    onCambio();
  }

  const INPUT =
    'w-full border-0 border-b border-dorado-400/40 bg-transparent py-2 texto--1 text-tinta-900 ' +
    'placeholder:text-tinta-400 transition-colors duration-300 focus:border-tinta-900 focus:outline-none';

  return (
    <section className="linea-oro mb-8 border-y py-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="texto--1 uppercase espaciado-medio text-tinta-900">Gastos del mes</h2>
        <button
          onClick={() => setAbierto(!abierto)}
          className="inline-flex items-center gap-1.5 texto--1 uppercase espaciado-medio text-dorado-700 transition-colors duration-300 hover:text-tinta-900"
        >
          {abierto ? <X size={14} strokeWidth={1.5} /> : <Plus size={14} strokeWidth={1.5} />}
          {abierto ? 'Cancelar' : 'Agregar'}
        </button>
      </div>

      {abierto && (
        <div className="anim-entrada mb-5 grid gap-4 sm:grid-cols-4 sm:items-end">
          <label className="block sm:col-span-2">
            <span className="mb-1 block texto--2 uppercase espaciado-medio text-tinta-500">En qué</span>
            <input
              type="text"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Esmaltes, pinzas, arriendo…"
              className={INPUT}
            />
          </label>

          <label className="block">
            <span className="mb-1 block texto--2 uppercase espaciado-medio text-tinta-500">Monto</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={form.monto}
              onChange={(e) => setForm({ ...form, monto: e.target.value })}
              placeholder="15000"
              className={INPUT}
            />
          </label>

          <label className="block">
            <span className="mb-1 block texto--2 uppercase espaciado-medio text-tinta-500">Categoría</span>
            <select
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              className={INPUT}
            >
              {CATEGORIAS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <button
            onClick={agregar}
            disabled={guardando}
            className="flex items-center justify-center gap-2 bg-tinta-900 px-5 py-3 texto--1 uppercase espaciado-medio text-crema-100 transition-all duration-300 hover:bg-tinta-800 active:scale-95 disabled:opacity-40 sm:col-span-4"
          >
            {guardando ? <Loader2 size={14} className="animate-spin" /> : 'Guardar gasto'}
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="mb-3 texto--1 text-tinta-800">
          {error}
        </p>
      )}

      {gastos.length === 0 ? (
        <p className="texto--1 text-tinta-500">Sin gastos registrados este mes.</p>
      ) : (
        <ul className="divide-y divide-dorado-400/20">
          {gastos.map((g) => (
            <li key={g.id} className="flex items-center gap-3 py-2.5">
              <span className="min-w-0 flex-1">
                <span className="block texto--1 text-tinta-900">{g.descripcion}</span>
                <span className="texto--2 text-tinta-500">
                  {String(g.fecha).slice(0, 10)} · {g.categoria}
                </span>
              </span>
              <span className="texto--1 tabular-nums text-tinta-900">{formatPrice(g.monto)}</span>
              <button
                onClick={() => quitar(g.id)}
                aria-label={`Quitar gasto ${g.descripcion}`}
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
