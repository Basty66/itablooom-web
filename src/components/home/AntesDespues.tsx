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
function Comparador({ trabajo, indice = 0 }: { trabajo: TrabajoGaleria; indice?: number }) {
  const [pos, setPos] = useState(50);
  const contenedor = useRef<HTMLDivElement>(null);

  return (
    /* Entran una tras otra, no las seis de golpe. El retraso queda retenido
       hasta que la sección aparece, como el resto de las entradas del sitio. */
    <figure
      className="anim-entrada overflow-hidden rounded-[var(--radius-foto)] border border-crema-100/8 bg-tinta-880"
      style={{ animationDelay: `${indice * 90}ms` }}
    >
      {/*
        Cuadrado y no retrato: las fotos del estudio suelen venir anotadas
        —flechas y texto que llegan a los dos bordes—, y un recorte 4:5 les
        comía las esquinas. Además, apiladas en móvil, seis retratos hacían de
        esta sección la más larga de la home.
      */}
      <div ref={contenedor} className="relative aspect-square select-none">
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

        {/*
          `touch-action: pan-y` reparte los gestos: el arrastre vertical
          scrollea la página y el horizontal mueve el comparador. Sin esto, el
          control cubre la foto entera y podría quedarse con el gesto de
          scroll, dejando el dedo trabado al pasar por la galería.
        */}
        <input
          type="range"
          min={0}
          max={100}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label={`Comparar antes y después de ${trabajo.titulo}`}
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0 [touch-action:pan-y]"
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
        {trabajos.slice(0, 6).map((t, i) => (
          <Comparador key={t.id} trabajo={t} indice={i} />
        ))}
      </div>
    </Section>
  );
}
