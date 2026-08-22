import { useState } from 'react';
import { Droplets, Sparkles, Eye, Feather, Wand2 } from 'lucide-react';
import type { Service } from '../../types';

/**
 * Cabecera visual de cada servicio.
 *
 * Muestra la foto de `image_url` si existe. Si falta o falla la carga, cae al
 * degradado con icono: nunca queda un hueco roto en la tarjeta.
 *
 * Los emojis anteriores (✨💫💅) renderizaban distinto en cada sistema
 * operativo y bajaban el nivel de una marca de estética.
 */

type Categoria = Service['category'];

/**
 * Las claves siguen siendo facial/laser/course porque así está la columna
 * `category` en la base; lo que cambia es a qué servicio de Goddess representan.
 * Al migrar los datos conviene renombrarlas a unas/pestanas/cejas.
 */
const ESTILOS: Record<Categoria, { icono: typeof Droplets; fondo: string; etiqueta: string }> = {
  facial: { icono: Sparkles, fondo: 'from-crema-200 via-nude-200 to-nude-300', etiqueta: 'Uñas' },
  laser: { icono: Eye, fondo: 'from-nude-200 via-nude-200 to-nude-300', etiqueta: 'Pestañas' },
  course: { icono: Feather, fondo: 'from-dorado-300/40 via-nude-200 to-nude-200', etiqueta: 'Cejas' },
};

const RESPALDO = { icono: Wand2, fondo: 'from-nude-200 to-nude-200', etiqueta: 'Servicio' };

export function etiquetaCategoria(categoria: Categoria): string {
  return (ESTILOS[categoria] ?? RESPALDO).etiqueta;
}

interface Props {
  categoria: Categoria;
  imagen?: string | null;
  /** Nombre del servicio: da un alt descriptivo en vez de uno genérico. */
  nombre?: string;
  /** La primera tarjeta visible carga con prioridad; el resto en diferido. */
  prioritaria?: boolean;
}

export default function ServiceVisual({ categoria, imagen, nombre, prioritaria = false }: Props) {
  const [fallo, setFallo] = useState(false);
  const { icono: Icono } = ESTILOS[categoria] ?? RESPALDO;

  // El aspect fija el espacio antes de que cargue la imagen y evita que la
  // tarjeta salte al aparecer (CLS).
  // Retrato 4/5 en escritorio; en móvil eso alarga demasiado la columna, así
  // que ahí va cuadrado: más contenido sin perder el aire.
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-medio)] bg-crema-200 sm:aspect-square">
      {imagen && !fallo ? (
        <>
          <img
            src={imagen}
            alt={nombre ? `${nombre} en Goddess Studio` : 'Tratamiento estético'}
            loading={prioritaria ? 'eager' : 'lazy'}
            decoding="async"
            width={800}
            height={450}
            onError={() => setFallo(true)}
            className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.03]"
          />
          {/* Velo mínimo: unifica fotos de temperaturas distintas sin ensuciar. */}
          <div aria-hidden="true" className="absolute inset-0 bg-crema-100/5" />
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <div aria-hidden="true" className="linea-oro absolute h-24 w-24 rounded-full border" />
          <Icono
            size={30}
            strokeWidth={1.25}
            className="relative text-tinta-800 transition-transform duration-500 ease-out group-hover:scale-110"
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
}
