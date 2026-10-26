import { useRef, useState, useEffect, useId } from 'react';

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

/** Dónde termina cada curva: ahí se enciende el destello al final del trazo. */
const FINALES = {
  baja: { x: 300, y: 16 },
  sube: { x: 300, y: 44 },
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
  // Un id por instancia: con dos trazos en la página, un id fijo haría que
  // ambos tomaran el gradiente del primero.
  const gradiente = useId();
  const fin = FINALES[forma];

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
    <div aria-hidden="true" className={`flex w-full justify-center py-2 md:py-16 ${className}`}>
      <svg
        viewBox="0 0 340 60"
        className="h-[60px] w-[min(90%,340px)] overflow-visible"
        fill="none"
      >
        <defs>
          <linearGradient id={gradiente} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#8a5540" stopOpacity="0" />
            <stop offset="0.25" stopColor="#c68f76" />
            <stop offset="0.55" stopColor="#fff3ec" />
            <stop offset="0.8" stopColor="#d6a992" />
            <stop offset="1" stopColor="#f6dccf" />
          </linearGradient>
        </defs>
        <path
          ref={ref}
          d={CURVAS[forma]}
          stroke={`url(#${gradiente})`}
          strokeWidth={1.6}
          strokeLinecap="round"
          style={{
            strokeDasharray: largo,
            strokeDashoffset: dibujado ? 0 : largo,
            transition: 'stroke-dashoffset 1.3s cubic-bezier(0.22, 0.61, 0.36, 1)',
          }}
        />
        {/* Destello de cuatro puntas donde termina la línea: aparece justo
            cuando la pluma llega, como el brillo al levantarla del papel. */}
        <path
          d="M0 -9C.6 -3 3 -.6 9 0 3 .6 .6 3 0 9-.6 3-3 .6-9 0-3-.6-.6-3 0-9Z"
          fill="#fff3ec"
          style={{
            opacity: dibujado ? 1 : 0,
            transform: `translate(${fin.x}px, ${fin.y}px) scale(${dibujado ? 1 : 0.2}) rotate(${dibujado ? 0 : -90}deg)`,
            transition: 'opacity 0.6s ease-out 1.1s, transform 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) 1.1s',
            filter: 'drop-shadow(0 0 5px rgba(246, 220, 207, 0.8))',
          }}
        />
      </svg>
    </div>
  );
}
