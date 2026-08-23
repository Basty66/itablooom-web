import { useState, useEffect, useRef } from 'react';
import { Section, SectionHeading } from '../ui/Section';
import { getGaleria, type TrabajoGaleria } from '../../lib/api';

/**
 * Comparador de dos fotos con una manija que se arrastra.
 *
 * Mostrarlas lado a lado obliga a comparar de memoria; superpuestas, el ojo ve
 * el cambio exacto en el mismo punto. La manija es un input de rango real: se
 * arrastra con el dedo, con el mouse y también con las flechas del teclado,
 * que es lo que un div con eventos de puntero no da gratis.
 */
function Comparador({ trabajo }: { trabajo: TrabajoGaleria }) {
  const [pos, setPos] = useState(50);
  const contenedor = useRef<HTMLDivElement>(null);

  return (
    <figure className="overflow-hidden rounded-[var(--radius-foto)] border border-crema-100/8 bg-tinta-880">
      <div ref={contenedor} className="relative aspect-[4/5] select-none">
        {/* El "después" va al fondo y el "antes" se recorta encima: así el
            deslizador descubre el resultado, que es el sentido de la lectura. */}
        <img
          src={trabajo.despues_url}
          alt={`${trabajo.titulo}, después`}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        >
          <img
            src={trabajo.antes_url}
            alt={`${trabajo.titulo}, antes`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        </div>

        {/* Línea y manija, decorativas: quien manda es el input de abajo. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 w-px bg-crema-100/80"
          style={{ left: `${pos}%` }}
        >
          <span className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-crema-100/40 bg-tinta-950/70 backdrop-blur-sm">
            <span className="texto--2 text-crema-100">↔</span>
          </span>
        </div>

        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-3 rounded-full bg-tinta-950/70 px-3 py-1 texto--2 uppercase espaciado-medio text-nacar-200 backdrop-blur-sm"
        >
          Antes
        </span>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-3 rounded-full bg-rosa-300/90 px-3 py-1 texto--2 uppercase espaciado-medio text-vino-900 backdrop-blur-sm"
        >
          Después
        </span>

        <input
          type="range"
          min={0}
          max={100}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label={`Comparar antes y después de ${trabajo.titulo}`}
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
        />
      </div>

      <figcaption className="flex items-baseline justify-between gap-3 px-4 py-3">
        <span className="texto-0 text-crema-100">{trabajo.titulo}</span>
        {trabajo.categoria && (
          <span className="texto--2 uppercase espaciado-medio text-rosa-300">{trabajo.categoria}</span>
        )}
      </figcaption>
    </figure>
  );
}

export default function AntesDespues() {
  const [trabajos, setTrabajos] = useState<TrabajoGaleria[]>([]);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    let vigente = true;
    getGaleria()
      .then((d) => vigente && setTrabajos(d))
      .finally(() => vigente && setCargado(true));
    return () => {
      vigente = false;
    };
  }, []);

  // Sin trabajos publicados la sección no aparece: un titular sobre un hueco
  // vacío se lee como algo roto.
  if (!cargado || trabajos.length === 0) return null;

  return (
    <Section id="antes-despues" className="bg-tinta-900">
      <SectionHeading
        eyebrow="El resultado"
        title="Antes y después"
        subtitle="Desliza sobre cada foto para ver el cambio."
      />

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {trabajos.slice(0, 6).map((t) => (
          <Comparador key={t.id} trabajo={t} />
        ))}
      </div>
    </Section>
  );
}
