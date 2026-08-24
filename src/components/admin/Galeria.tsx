import { useState, useEffect, useRef, useCallback } from 'react';
import { ImagePlus, X, Loader2, Trash2, Images } from 'lucide-react';
import { getGaleria, subirTrabajo, borrarTrabajo, type TrabajoGaleria } from '../../lib/api';
import { prepararFoto, pesoLegible, type FotoPreparada } from '../../lib/imagenes';

const CATEGORIAS = ['Uñas', 'Pestañas', 'Cejas'];

/** Un selector de foto con su vista previa. */
function Selector({
  etiqueta,
  foto,
  onElegir,
  onQuitar,
  procesando,
}: {
  etiqueta: string;
  foto: FotoPreparada | null;
  onElegir: (archivo: File) => void;
  onQuitar: () => void;
  procesando: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);

  return (
    <div>
      <p className="mb-2 texto--2 uppercase espaciado-medio text-nacar-300">{etiqueta}</p>

      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onElegir(f);
          // Limpiar el valor permite volver a elegir el mismo archivo.
          e.target.value = '';
        }}
      />

      {foto ? (
        <div className="relative overflow-hidden rounded-[var(--radius-medio)] border border-crema-100/10">
          <img src={foto.dataUrl} alt="" className="aspect-square w-full object-cover" />
          <button
            type="button"
            onClick={onQuitar}
            aria-label={`Quitar la foto de ${etiqueta.toLowerCase()}`}
            className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-tinta-950/80 text-crema-100 backdrop-blur-sm transition-colors hover:bg-tinta-950"
          >
            <X size={15} strokeWidth={2} aria-hidden="true" />
          </button>
          {/* El peso final, para que se note que la foto se redujo sola. */}
          <span className="absolute bottom-2 left-2 rounded-full bg-tinta-950/80 px-2.5 py-1 texto--2 text-nacar-200 backdrop-blur-sm">
            {foto.ancho}×{foto.alto} · {pesoLegible(foto.bytes)}
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={procesando}
          className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-[var(--radius-medio)] border border-dashed border-crema-100/15 bg-tinta-880 text-nacar-300 transition-colors duration-300 hover:border-rosa-300/50 hover:text-crema-100 disabled:opacity-50"
        >
          {procesando ? (
            <Loader2 size={22} className="animate-spin" aria-hidden="true" />
          ) : (
            <ImagePlus size={22} strokeWidth={1.4} aria-hidden="true" />
          )}
          <span className="texto--2 uppercase espaciado-medio">
            {procesando ? 'Procesando' : 'Elegir foto'}
          </span>
        </button>
      )}
    </div>
  );
}

/**
 * Galería de antes y después, administrable desde el teléfono.
 *
 * Las fotos se reducen en el navegador antes de subir: desde el celular con
 * datos móviles se envía medio mega en vez de los ocho que pesa el original,
 * y la galería del sitio no se vuelve lenta.
 */
export default function Galeria() {
  const [trabajos, setTrabajos] = useState<TrabajoGaleria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [abierto, setAbierto] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [procesando, setProcesando] = useState<'antes' | 'despues' | null>(null);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState<string>(CATEGORIAS[0]);
  const [antes, setAntes] = useState<FotoPreparada | null>(null);
  const [despues, setDespues] = useState<FotoPreparada | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setTrabajos(await getGaleria());
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function elegir(cual: 'antes' | 'despues', archivo: File) {
    setError('');
    setProcesando(cual);
    try {
      const foto = await prepararFoto(archivo);
      if (cual === 'antes') setAntes(foto);
      else setDespues(foto);
    } catch (e: any) {
      setError(e?.message || 'No pudimos procesar esa imagen');
    } finally {
      setProcesando(null);
    }
  }

  async function guardar() {
    setError('');
    setAviso('');
    if (!titulo.trim()) return setError('Ponle un título, por ejemplo "Cejas de Camila".');
    if (!antes || !despues) return setError('Faltan las dos fotos: el antes y el después.');

    setSubiendo(true);
    const r = await subirTrabajo({
      titulo: titulo.trim(),
      categoria,
      antes: antes.dataUrl,
      despues: despues.dataUrl,
    });
    setSubiendo(false);

    if (!r.ok) return setError(r.error || 'No se pudo subir');
    setAviso('Trabajo publicado en el sitio.');
    setTitulo('');
    setAntes(null);
    setDespues(null);
    setAbierto(false);
    await cargar();
  }

  async function quitar(t: TrabajoGaleria) {
    if (!confirm(`¿Quitar "${t.titulo}" de la galería? Se borran las dos fotos.`)) return;
    setTrabajos((prev) => prev.filter((x) => x.id !== t.id));
    await borrarTrabajo(t.id);
    await cargar();
  }

  const INPUT = 'campo w-full px-3 py-2.5 texto--1';

  return (
    <section className="mb-6 rounded-2xl bg-tinta-870 p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display texto-2 text-crema-100">Antes y después</h2>
        <button
          onClick={() => {
            setAbierto(!abierto);
            setError('');
            setAviso('');
          }}
          className="inline-flex items-center gap-1.5 texto--1 uppercase espaciado-medio text-cobre-300 transition-colors duration-300 hover:text-crema-100"
        >
          {abierto ? <X size={14} strokeWidth={1.5} /> : <ImagePlus size={14} strokeWidth={1.5} />}
          {abierto ? 'Cancelar' : 'Agregar'}
        </button>
      </div>

      {abierto && (
        <div className="anim-entrada mb-6 flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Selector
              etiqueta="Antes"
              foto={antes}
              procesando={procesando === 'antes'}
              onElegir={(f) => elegir('antes', f)}
              onQuitar={() => setAntes(null)}
            />
            <Selector
              etiqueta="Después"
              foto={despues}
              procesando={procesando === 'despues'}
              onElegir={(f) => elegir('despues', f)}
              onQuitar={() => setDespues(null)}
            />
          </div>

          <label className="block">
            <span className="mb-1 block texto--2 uppercase espaciado-medio text-nacar-300">Título</span>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Laminado de cejas"
              className={`${INPUT} placeholder:text-nacar-300`}
            />
          </label>

          <div>
            <p className="mb-2 texto--2 uppercase espaciado-medio text-nacar-300">Rubro</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIAS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategoria(c)}
                  className={`rounded-full px-4 py-2 texto--2 uppercase espaciado-medio transition-colors duration-300 ${
                    categoria === c
                      ? 'bg-rosa-300 text-vino-900'
                      : 'border border-crema-100/12 text-nacar-200/85 hover:border-rosa-300/50'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={guardar}
            disabled={subiendo}
            className="brillo brillo-hover flex w-fit items-center justify-center gap-2 rounded-[var(--radius-suave)] bg-rosa-300 px-6 py-3 texto--1 font-medium uppercase espaciado-medio text-vino-900 transition-all duration-300 hover:bg-rosa-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
          >
            {subiendo ? (
              <>
                <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                Subiendo…
              </>
            ) : (
              'Publicar trabajo'
            )}
          </button>

          <p className="texto--2 leading-relaxed text-nacar-300">
            Pídele permiso a la clienta antes de publicar una foto donde se le reconozca.
          </p>
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
      ) : trabajos.length === 0 ? (
        <p className="flex items-center gap-2 texto--1 text-nacar-300">
          <Images size={14} strokeWidth={1.5} aria-hidden="true" />
          Todavía no hay trabajos publicados.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {trabajos.map((t) => (
            <li key={t.id} className="overflow-hidden rounded-[var(--radius-medio)] bg-tinta-880">
              <div className="flex">
                <img src={t.antes_url} alt="" className="aspect-square w-1/2 object-cover" />
                <img src={t.despues_url} alt="" className="aspect-square w-1/2 object-cover" />
              </div>
              <div className="flex items-center justify-between gap-2 p-3">
                <div className="min-w-0">
                  <p className="truncate texto--1 text-crema-100">{t.titulo}</p>
                  {t.categoria && <p className="texto--2 text-nacar-300">{t.categoria}</p>}
                </div>
                <button
                  onClick={() => quitar(t)}
                  aria-label={`Quitar ${t.titulo}`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-nacar-300 transition-colors hover:bg-tinta-860 hover:text-rosa-300"
                >
                  <Trash2 size={15} strokeWidth={1.5} aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
