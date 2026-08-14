import { Droplets, Sparkle, Wand2, GraduationCap } from 'lucide-react';
import type { Service } from '../../types';

/**
 * Cabecera visual de cada servicio.
 *
 * Reemplaza los emojis que había antes (✨💫💅): renderizaban distinto en cada
 * sistema operativo y bajaban el nivel de una marca de estética. Acá va un
 * icono vectorial sobre un degradado propio por categoría.
 */

type Categoria = Service['category'];

const ESTILOS: Record<Categoria, { icono: typeof Droplets; fondo: string; etiqueta: string }> = {
  facial: {
    icono: Droplets,
    fondo: 'from-rosa-100 via-crema-200 to-crema-300',
    etiqueta: 'Facial',
  },
  laser: {
    icono: Sparkle,
    fondo: 'from-crema-200 via-rosa-100 to-rosa-200',
    etiqueta: 'Láser',
  },
  course: {
    icono: GraduationCap,
    fondo: 'from-rosa-200 via-rosa-100 to-crema-200',
    etiqueta: 'Curso',
  },
};

const RESPALDO = { icono: Wand2, fondo: 'from-crema-200 to-rosa-100', etiqueta: 'Servicio' };

export function etiquetaCategoria(categoria: Categoria): string {
  return (ESTILOS[categoria] ?? RESPALDO).etiqueta;
}

export default function ServiceVisual({ categoria }: { categoria: Categoria }) {
  const { icono: Icono, fondo } = ESTILOS[categoria] ?? RESPALDO;

  return (
    <div
      className={`relative flex aspect-[16/9] items-center justify-center overflow-hidden bg-gradient-to-br ${fondo}`}
    >
      {/* Anillos concéntricos: dan profundidad sin necesitar una foto. */}
      <div className="absolute h-40 w-40 rounded-full border border-white/40" />
      <div className="absolute h-28 w-28 rounded-full border border-white/50" />
      <Icono
        size={30}
        strokeWidth={1.25}
        className="relative text-tinta-800 transition-transform duration-500 ease-out group-hover:scale-110"
        aria-hidden="true"
      />
    </div>
  );
}
