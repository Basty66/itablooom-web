import { useMemo } from 'react';

/**
 * Corazones que suben en loop detrás del hero.
 *
 * CSS puro y no canvas: no ocupa el hilo principal, no repinta cuando la
 * pestaña está en segundo plano y desaparece solo con prefers-reduced-motion
 * (la regla global de index.css colapsa la animación).
 *
 * Es decorativo: aria-hidden y pointer-events-none para que no interfiera
 * con lectores de pantalla ni con los botones del hero.
 */

interface Particula {
  izquierda: number;
  tamano: number;
  duracion: number;
  retraso: number;
  opacidad: number;
  deriva: number;
}

function crearParticulas(cantidad: number): Particula[] {
  return Array.from({ length: cantidad }, (_, i) => {
    // Repartimos en columnas y desordenamos dentro de cada una: evita que se
    // amontonen al azar dejando zonas vacías.
    const columna = (i / cantidad) * 100;
    return {
      izquierda: columna + (Math.random() * 12 - 6),
      tamano: 10 + Math.random() * 16,
      duracion: 14 + Math.random() * 12,
      retraso: Math.random() * -26,
      opacidad: 0.2 + Math.random() * 0.35,
      deriva: Math.random() * 60 - 30,
    };
  });
}

export default function FloatingHearts({ cantidad = 14 }: { cantidad?: number }) {
  const particulas = useMemo(() => crearParticulas(cantidad), [cantidad]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <style>{`
        @keyframes flotar {
          0%   { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; }
          10%  { opacity: var(--op); }
          90%  { opacity: var(--op); }
          100% { transform: translateY(-115vh) translateX(var(--deriva)) rotate(24deg); opacity: 0; }
        }
      `}</style>

      {particulas.map((p, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          fill="currentColor"
          className="absolute bottom-[-6rem] text-rosa-300"
          style={{
            left: `${p.izquierda}%`,
            width: `${p.tamano}px`,
            height: `${p.tamano}px`,
            ['--op' as string]: p.opacidad,
            ['--deriva' as string]: `${p.deriva}px`,
            animation: `flotar ${p.duracion}s linear ${p.retraso}s infinite`,
            willChange: 'transform, opacity',
          }}
        >
          <path d="M12 21s-6.7-4.35-9.3-8.2C.9 10 2 6.4 5.1 5.3c2-.7 4.1.1 5.3 1.8l1.6 2.2 1.6-2.2c1.2-1.7 3.3-2.5 5.3-1.8 3.1 1.1 4.2 4.7 2.4 7.5C18.7 16.65 12 21 12 21z" />
        </svg>
      ))}
    </div>
  );
}
