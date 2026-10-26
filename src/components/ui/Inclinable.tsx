import { useRef, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  /** Grados máximos de giro en cada eje. */
  grados?: number;
}

/**
 * Se inclina hacia el puntero, como una tarjeta que se toma con la mano, y
 * un reflejo sigue al cursor por encima.
 *
 * Solo reacciona al mouse: en el teléfono un toque no tiene "encima", y la
 * tarjeta se quedaría torcida después de tocarla.
 */
export default function Inclinable({ children, className = '', grados = 6 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  function mover(e: React.PointerEvent) {
    if (e.pointerType !== 'mouse') return;
    const el = ref.current;
    if (!el) return;
    const caja = el.getBoundingClientRect();
    const x = (e.clientX - caja.left) / caja.width;
    const y = (e.clientY - caja.top) / caja.height;
    el.style.setProperty('--ry', `${(x - 0.5) * grados * 2}deg`);
    el.style.setProperty('--rx', `${(0.5 - y) * grados * 2}deg`);
    el.style.setProperty('--gx', `${x * 100}%`);
    el.style.setProperty('--gy', `${y * 100}%`);
  }

  function soltar() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  }

  return (
    <div ref={ref} onPointerMove={mover} onPointerLeave={soltar} className={`inclinable relative ${className}`}>
      {children}
      <span aria-hidden="true" className="inclinable-reflejo pointer-events-none absolute inset-0 rounded-[inherit]" />
    </div>
  );
}
