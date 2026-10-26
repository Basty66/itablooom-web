import { useId } from 'react';

/**
 * Emblema de Goddess Studio: corona de laurel con la estrella de la marca
 * arriba y la G en itálica al centro.
 *
 * El laurel es el atributo de las diosas griegas, y es lo que le faltaba al
 * sitio para que el nombre tuviera una imagen. La estrella de cuatro puntas
 * es la misma de las uñas de la foto principal y de los destellos: así el
 * emblema no es un adorno aparte sino el centro del sistema.
 *
 * Las hojas no están dibujadas a mano: se calculan a lo largo de un arco,
 * alternando hacia afuera y hacia adentro del tallo y achicándose hacia la
 * punta, como crece una rama de verdad. Así la corona queda simétrica en
 * cualquier tamaño y se puede ajustar cambiando dos números.
 */

const CENTRO = { x: 50, y: 53 };
const RADIO = 37;
/** Ángulos del tallo, en grados (0 = derecha, 90 = abajo, como en SVG). */
const DESDE = 110;
const HASTA = 248;
const HOJAS = 12;

/** Hoja apuntando hacia arriba desde su base en (0,0). */
const HOJA = 'M0 0C3.4-3.6 3.6-9.4 0-14C-3.6-9.4-3.4-3.6 0 0Z';

function rama(espejo: boolean) {
  const hojas: { x: number; y: number; giro: number; escala: number }[] = [];
  for (let i = 0; i < HOJAS; i++) {
    const t = i / (HOJAS - 1);
    const grados = DESDE + (HASTA - DESDE) * t;
    const rad = (grados * Math.PI) / 180;
    const x = CENTRO.x + RADIO * Math.cos(rad);
    const y = CENTRO.y + RADIO * Math.sin(rad);
    // La tangente del arco en el sentido en que crece la rama. La hoja nace
    // apuntando hacia arriba (-90°), de ahí los 90° de más al girarla.
    const tangente = grados + 90;
    const lado = i % 2 === 0 ? -38 : 38;
    const giro = tangente + 90 + lado;
    hojas.push({
      x: espejo ? 100 - x : x,
      y,
      // Reflejar una rama invierte el sentido de giro de sus hojas.
      giro: espejo ? -giro : giro,
      escala: 1.05 - t * 0.45,
    });
  }
  return hojas;
}

const IZQUIERDA = rama(false);
const DERECHA = rama(true);

/**
 * El tallo de cada rama, como arco del mismo círculo. Las dos ramas no se
 * tocan abajo: el hueco lo cierra un destello chico, de broche.
 */
function tallo(espejo: boolean) {
  const punto = (g: number) => {
    const r = (g * Math.PI) / 180;
    const x = CENTRO.x + RADIO * Math.cos(r);
    return `${(espejo ? 100 - x : x).toFixed(2)} ${(CENTRO.y + RADIO * Math.sin(r)).toFixed(2)}`;
  };
  return `M${punto(DESDE - 8)}A${RADIO} ${RADIO} 0 0 ${espejo ? 0 : 1} ${punto(HASTA)}`;
}

interface Props {
  className?: string;
  /** Sin la letra: para usarlo de sello detrás de otro texto. */
  sinLetra?: boolean;
  titulo?: string;
}

export default function Emblema({ className = '', sinLetra = false, titulo }: Props) {
  const id = useId();
  const metal = `emblema-metal-${id}`;

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role={titulo ? 'img' : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
    >
      <defs>
        <linearGradient id={metal} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff3ec" />
          <stop offset="0.42" stopColor="#f2c7b6" />
          <stop offset="0.5" stopColor="#b9705e" />
          <stop offset="0.62" stopColor="#e9b9a8" />
          <stop offset="1" stopColor="#fbe0d4" />
        </linearGradient>
      </defs>

      <g fill={`url(#${metal})`}>
        <path d={tallo(false)} fill="none" stroke={`url(#${metal})`} strokeWidth="0.9" strokeLinecap="round" />
        <path d={tallo(true)} fill="none" stroke={`url(#${metal})`} strokeWidth="0.9" strokeLinecap="round" />
        {[...IZQUIERDA, ...DERECHA].map(({ x, y, giro, escala }, i) => (
          <path
            key={i}
            d={HOJA}
            transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${giro.toFixed(1)}) scale(${escala.toFixed(3)})`}
          />
        ))}
        {/* Estrella de la diosa, en el hueco de arriba de la corona. */}
        <path
          d="M50 4.5C50.5 9.8 52.4 11.7 57.7 12.2 52.4 12.7 50.5 14.6 50 19.9 49.5 14.6 47.6 12.7 42.3 12.2 47.6 11.7 49.5 9.8 50 4.5Z"
        />
        {/* Broche: el mismo destello, chico, donde nacen las ramas. */}
        <path d="M50 84.6C50.25 87.2 51.2 88.15 53.8 88.4 51.2 88.65 50.25 89.6 50 92.2 49.75 89.6 48.8 88.65 46.2 88.4 48.8 88.15 49.75 87.2 50 84.6Z" />
        {!sinLetra && (
          <text
            x="50.5"
            y="66"
            textAnchor="middle"
            fontFamily="'EB Garamond', Georgia, serif"
            fontStyle="italic"
            fontSize="40"
          >
            G
          </text>
        )}
      </g>
    </svg>
  );
}
