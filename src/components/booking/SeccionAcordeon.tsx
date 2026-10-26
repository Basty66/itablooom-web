import { useRef, useEffect, type ReactNode } from 'react';
import { Check, Pencil, Lock } from 'lucide-react';
import { desplazarA } from '../../lib/scroll-suave';

interface Props {
  numero: string;
  titulo: string;
  /** Línea que resume lo elegido cuando la sección está cerrada. */
  resumen?: string;
  abierta: boolean;
  completa: boolean;
  /** Aún no se puede abrir porque depende de una sección anterior. */
  bloqueada: boolean;
  onAbrir: () => void;
  children: ReactNode;
}

/**
 * Una sección del agendador.
 *
 * El flujo vive en una sola página: la sección activa está abierta y las ya
 * resueltas se cierran mostrando en una línea lo que se eligió. Así el alto
 * en móvil se mantiene cerca de una pantalla sin que la clienta pierda de
 * vista lo que lleva hecho, y puede volver a cualquier paso con un toque.
 *
 * Las secciones que dependen de otra se muestran bloqueadas en vez de
 * ocultarse: se ve cuánto falta para terminar.
 */
export default function SeccionAcordeon({
  numero,
  titulo,
  resumen,
  abierta,
  completa,
  bloqueada,
  onAbrir,
  children,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const yaEstuvoAbierta = useRef(false);

  /*
   * Al abrirse, la sección se lleva la vista. Sin esto la anterior colapsa,
   * el contenido salta hacia arriba y la clienta queda mirando el lugar
   * equivocado. El primer render no scrollea: sería mover la página sola
   * apenas entra.
   */
  useEffect(() => {
    if (!abierta) return;
    if (!yaEstuvoAbierta.current) {
      yaEstuvoAbierta.current = true;
      return;
    }
    const el = ref.current;
    if (!el) return;
    const destino = el.getBoundingClientRect().top + window.scrollY - 88;
    desplazarA(Math.max(destino, 0));
  }, [abierta]);

  return (
    <section
      ref={ref}
      className={`relative overflow-hidden rounded-[1.6rem] transition-colors duration-500 ${
        abierta ? 'bg-tinta-880' : bloqueada ? 'bg-tinta-880/35' : 'bg-tinta-880/70'
      }`}
    >
      {/* Canto de metal: encendido en la sección en curso, apenas insinuado
          en las demás. */}
      <span aria-hidden="true" className={`pointer-events-none canto-metal absolute inset-0 rounded-[inherit] ${abierta ? 'activo' : ''}`} />
      <h2>
        <button
          type="button"
          onClick={onAbrir}
          disabled={bloqueada || abierta}
          aria-expanded={abierta}
          className={`flex w-full items-center gap-4 px-5 py-5 text-left transition-colors duration-300 sm:px-6 ${
            bloqueada || abierta ? 'cursor-default' : 'cursor-pointer hover:bg-tinta-870'
          }`}
        >
          {/* Marca de estado: palomita si ya está resuelta, candado si aún no
              se puede, y el número cuando es la sección en curso. */}
          <span
            aria-hidden="true"
            className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full texto--1 tabular-nums transition-colors duration-300 ${
              completa && !abierta
                ? 'boton-metal text-vino-900'
                : abierta
                  ? 'canto-metal activo text-cobre-100'
                  : 'border border-crema-100/15 text-nacar-300'
            }`}
          >
            {completa && !abierta ? (
              <Check size={15} strokeWidth={2.5} />
            ) : bloqueada ? (
              <Lock size={13} strokeWidth={1.8} />
            ) : (
              numero
            )}
          </span>

          <span className="min-w-0 flex-1">
            <span
              className={`block font-display texto-2 transition-colors duration-300 ${
                bloqueada ? 'text-nacar-300' : 'text-crema-100'
              }`}
            >
              {titulo}
            </span>
            {!abierta && resumen && (
              <span className="mt-0.5 block truncate texto--1 text-cobre-200">{resumen}</span>
            )}
          </span>

          {!abierta && !bloqueada && (
            <span className="flex shrink-0 items-center gap-1.5 texto--2 uppercase espaciado-medio text-nacar-300">
              <Pencil size={12} strokeWidth={1.6} aria-hidden="true" />
              <span className="hidden sm:inline">Cambiar</span>
            </span>
          )}
        </button>
      </h2>

      {/* Se desmonta al cerrar: mantener los 20 horarios y el calendario en el
          árbol de todas las secciones cerradas alarga la página sin motivo. */}
      {abierta && <div className="anim-entrada px-5 pb-6 sm:px-6">{children}</div>}
    </section>
  );
}
