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
  facial: { icono: Sparkles, fondo: 'from-rosa-100 via-nude-200 to-nude-300', etiqueta: 'Uñas' },
  laser: { icono: Eye, fondo: 'from-nude-200 via-rosa-100 to-rosa-200', etiqueta: 'Pestañas' },
  course: { icono: Feather, fondo: 'from-dorado-300/40 via-nude-200 to-rosa-100', etiqueta: 'Cejas' },
};

const RESPALDO = { icono: Wand2, fondo: 'from-nude-200 to-rosa-100', etiqueta: 'Servicio' };

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
  const { icono: Icono, fondo } = ESTILOS[categoria] ?? RESPALDO;

  // aspect-[16/9] reserva el espacio antes de que cargue la imagen y evita
  // que la tarjeta salte cuando aparece (CLS).
  return (
    <div className={`relative aspect-[16/9] overflow-hidden bg-gradient-to-br ${fondo}`}>
      {imagen && !fallo ? (
        <>
          <img
            src={imagen}
            alt={nombre ? `${nombre} en Itablooom Studio` : 'Tratamiento estético'}
            loading={prioritaria ? 'eager' : 'lazy'}
            decoding="async"
            width={800}
            height={450}
            onError={() => setFallo(true)}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          {/* Velo crema: integra fotos de temperaturas distintas con la paleta. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-tinta-900/25 via-transparent to-crema-100/15"
          />
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <div aria-hidden="true" className="absolute h-40 w-40 rounded-full border border-white/40" />
          <div aria-hidden="true" className="absolute h-28 w-28 rounded-full border border-white/50" />
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
