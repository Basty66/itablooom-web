import type { CSSProperties } from 'react';

/**
 * Posiciones fijas de las motas, en porcentajes, con su tamaño, velocidad y
 * desfase. Son fijas y no aleatorias para que el polvo sea el mismo en cada
 * visita y no cambie al volver a montar el componente.
 */
const MOTAS: { x: number; y: number; t: number; dur: number; retraso: number; grande?: boolean; escritorio?: boolean }[] = [
  { x: 6, y: 18, t: 2, dur: 19, retraso: -3 },
  { x: 14, y: 72, t: 3, dur: 23, retraso: -11, grande: true },
  { x: 22, y: 40, t: 1.5, dur: 17, retraso: -7 },
  { x: 31, y: 88, t: 2, dur: 26, retraso: -15 },
  { x: 38, y: 12, t: 2.5, dur: 21, retraso: -2, grande: true },
  { x: 46, y: 60, t: 1.5, dur: 18, retraso: -9 },
  { x: 53, y: 30, t: 2, dur: 24, retraso: -5 },
  { x: 61, y: 80, t: 3, dur: 20, retraso: -13, grande: true },
  { x: 68, y: 22, t: 1.5, dur: 16, retraso: -1 },
  { x: 74, y: 52, t: 2, dur: 22, retraso: -8 },
  { x: 82, y: 10, t: 2.5, dur: 25, retraso: -17 },
  { x: 89, y: 66, t: 1.5, dur: 19, retraso: -4, grande: true },
  { x: 95, y: 34, t: 2, dur: 27, retraso: -12 },
  { x: 10, y: 50, t: 1.5, dur: 21, retraso: -6, escritorio: true },
  { x: 27, y: 8, t: 2, dur: 18, retraso: -14, escritorio: true },
  { x: 42, y: 92, t: 2.5, dur: 24, retraso: -10, escritorio: true, grande: true },
  { x: 57, y: 46, t: 1.5, dur: 20, retraso: -3, escritorio: true },
  { x: 71, y: 94, t: 2, dur: 23, retraso: -16, escritorio: true },
  { x: 86, y: 42, t: 1.5, dur: 17, retraso: -9, escritorio: true },
  { x: 33, y: 64, t: 2, dur: 25, retraso: -1, escritorio: true },
];

/**
 * Polvo dorado que sube despacio y titila.
 *
 * Antes era un canvas redibujado en cada cuadro. Medido con la CPU de un
 * teléfono modesto, junto a lo demás del hero bajaba el scroll del inicio
 * a 22 fps: el canvas competía con el scroll por el hilo principal.
 *
 * Ahora cada mota es un elemento que solo anima `transform` y `opacity`,
 * las dos propiedades que la tarjeta de video anima sola, sin pasar por el
 * hilo principal: el scroll no las siente. Son pocas a propósito —trece en
 * el teléfono, veinte desde md—, porque cada una es una capa.
 */
export default function PolvoDorado({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none overflow-hidden ${className}`}>
      {MOTAS.map(({ x, y, t, dur, retraso, grande, escritorio }, i) => (
        <span
          key={i}
          className={`mota ${grande ? 'mota-grande' : ''} ${escritorio ? 'hidden md:block' : ''}`}
          style={
            {
              left: `${x}%`,
              top: `${y}%`,
              width: t,
              height: t,
              '--dur': `${dur}s`,
              '--retraso': `${retraso}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
