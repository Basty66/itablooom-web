import { useRef, useState, useEffect } from 'react';

/**
 * Filete que se dibuja solo al entrar en pantalla, como una firma a mano.
 *
 * Es el gesto del boceto que no tenía equivalente en el sitio: en vez de una
 * regla horizontal entre secciones, una curva de cobre que se traza de
 * izquierda a derecha cuando la clienta llega. Cuesta unos pocos bytes —es un
 * `path` y nada más— y da el respiro que separa un bloque del siguiente.
 *
 * El truco es viejo y sigue siendo el mejor: se pinta la línea con un guion
 * tan largo como ella misma y se la desplaza fuera de vista; al devolver el
 * desplazamiento a cero, el guion entra y parece que alguien la traza.
 */

/** Dos curvas espejadas: alternarlas evita que el gesto se repita idéntico. */
const CURVAS = {
  baja: 'M20,44 C 80,8 140,8 180,36 C 210,58 260,50 300,16',
  sube: 'M20,16 C 70,52 130,52 170,26 C 210,2 260,10 300,44',
};

interface Props {
  /** Cuál de las dos curvas usar. */
  forma?: keyof typeof CURVAS;
  className?: string;
}

export default function Trazo({ forma = 'baja', className = '' }: Props) {
  const ref = useRef<SVGPathElement>(null);
  const [dibujado, setDibujado] = useState(false);
  const [largo, setLargo] = useState(420);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // El largo real del trazado, en vez de un número a ojo: si la curva
    // cambia, la animación sigue calzando sin tocar nada.
    setLargo(el.getTotalLength());

    if (typeof IntersectionObserver === 'undefined') return setDibujado(true);
    // Quien pidió menos movimiento ve la línea puesta, no dibujándose.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return setDibujado(true);

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setDibujado(true);
          observador.disconnect();
        }
      },
      { threshold: 0.6 }
    );
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  return (
    <div aria-hidden="true" className={`flex w-full justify-center py-12 md:py-16 ${className}`}>
      <svg
        viewBox="0 0 340 60"
        className="h-[60px] w-[min(90%,340px)] overflow-visible"
        fill="none"
      >
        <path
          ref={ref}
          d={CURVAS[forma]}
          stroke="var(--color-cobre-400)"
          strokeWidth={2}
          strokeLinecap="round"
          style={{
            strokeDasharray: largo,
            strokeDashoffset: dibujado ? 0 : largo,
            transition: 'stroke-dashoffset 1.3s cubic-bezier(0.22, 0.61, 0.36, 1)',
          }}
        />
      </svg>
    </div>
  );
}
