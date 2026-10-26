import { useEffect, useRef, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Qué fracción de la distancia al puntero recorre el contenido. */
  fuerza?: number;
  className?: string;
}

/**
 * Atrae su contenido hacia el puntero mientras está encima, y al soltarlo
 * vuelve con un rebote corto.
 *
 * Solo en dispositivos con mouse: en pantalla táctil no hay "encima", y el
 * botón se movería recién al tocarlo, justo cuando hay que apretarlo.
 */
export default function Magnetico({ children, fuerza = 0.28, className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    /*
     * La caja se mide al entrar y no en cada movimiento: medida ya
     * desplazada, el centro se corre junto con el botón y el tirón tiembla.
     */
    let caja = el.getBoundingClientRect();

    const entrar = () => {
      caja = el.getBoundingClientRect();
    };
    const mover = (e: PointerEvent) => {
      const dx = e.clientX - (caja.left + caja.width / 2);
      const dy = e.clientY - (caja.top + caja.height / 2);
      el.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
      el.style.transform = `translate3d(${dx * fuerza}px, ${dy * fuerza}px, 0)`;
    };
    const soltar = () => {
      el.style.transition = 'transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)';
      el.style.transform = '';
    };

    el.addEventListener('pointerenter', entrar);
    el.addEventListener('pointermove', mover);
    el.addEventListener('pointerleave', soltar);
    return () => {
      el.removeEventListener('pointerenter', entrar);
      el.removeEventListener('pointermove', mover);
      el.removeEventListener('pointerleave', soltar);
    };
  }, [fuerza]);

  return (
    <div ref={ref} className={`flex will-change-transform ${className}`}>
      {children}
    </div>
  );
}
