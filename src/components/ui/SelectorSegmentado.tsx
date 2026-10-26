import { useLayoutEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface Opcion {
  id: string;
  label: string;
  /** Cuántos elementos hay detrás de la opción; se muestra al lado. */
  total?: number;
  icono?: LucideIcon;
}

interface Props {
  opciones: Opcion[];
  activa: string;
  onCambio: (id: string) => void;
  etiqueta: string;
  className?: string;
}

/**
 * Selector en píldora de vidrio con una pastilla de metal que se desliza a
 * la opción elegida.
 *
 * Las opciones tienen anchos distintos —"Pestañas 6" no mide lo mismo que
 * "Uñas 4"—, así que la pastilla se mide contra el botón activo en vez de
 * repartir el ancho en partes iguales. Si no cabe en la pantalla, la fila
 * se desliza con el dedo y la opción activa se trae a la vista.
 */
export default function SelectorSegmentado({ opciones, activa, onCambio, etiqueta, className = '' }: Props) {
  const fila = useRef<HTMLDivElement>(null);
  const botones = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pastilla, setPastilla] = useState<{ x: number; ancho: number } | null>(null);

  useLayoutEffect(() => {
    const medir = () => {
      const boton = botones.current[activa];
      if (!boton) return;
      setPastilla({ x: boton.offsetLeft, ancho: boton.offsetWidth });
    };
    medir();
    /*
     * Trae la opción activa a la vista corriendo solo la fila. Con
     * `scrollIntoView` el navegador también movía la página en vertical si
     * el selector estaba fuera de pantalla.
     */
    const boton = botones.current[activa];
    const contenedor = fila.current?.parentElement;
    if (boton && contenedor && contenedor.scrollWidth > contenedor.clientWidth) {
      contenedor.scrollTo({ left: boton.offsetLeft - 24, behavior: 'smooth' });
    }
    // Las fuentes web cambian el ancho de las palabras al terminar de cargar.
    const observador = new ResizeObserver(medir);
    if (fila.current) observador.observe(fila.current);
    return () => observador.disconnect();
  }, [activa, opciones.length]);

  return (
    <div className={`vidrio max-w-full overflow-x-auto rounded-full border p-1 sin-barra ${className}`}>
      <div ref={fila} role="tablist" aria-label={etiqueta} className="relative flex w-max">
        {pastilla && (
          <span
            aria-hidden="true"
            className="boton-metal absolute inset-y-0 rounded-full transition-[transform,width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ width: pastilla.ancho, transform: `translateX(${pastilla.x}px)` }}
          />
        )}
        {opciones.map(({ id, label, total, icono: Icono }) => {
          const activo = id === activa;
          return (
            <button
              key={id}
              ref={(el) => {
                botones.current[id] = el;
              }}
              type="button"
              role="tab"
              aria-selected={activo}
              onClick={() => onCambio(id)}
              className={`relative z-10 flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2.5 texto--2 font-medium uppercase espaciado-medio transition-colors duration-500 active:scale-95 sm:gap-2 sm:px-5 ${
                activo ? 'text-vino-900' : 'text-nacar-200/80 hover:text-crema-100'
              }`}
            >
              {/* El ícono entra desde sm: en el teléfono es lo que hacía
                  que la última opción quedara fuera de la píldora. */}
              {Icono && <Icono size={14} strokeWidth={1.6} aria-hidden="true" className="hidden sm:block" />}
              {label}
              {total !== undefined && (
                <span
                  className={`tabular-nums transition-colors duration-500 ${
                    activo ? 'text-vino-900/60' : 'text-nacar-300'
                  }`}
                >
                  {total}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
