import { useRef, useState } from 'react';
import { Play, ArrowRight } from 'lucide-react';
import { Section, SectionHeading } from '../ui/Section';
import { INSTAGRAM_URL, INSTAGRAM_USUARIO } from '../../lib/contacto';

/**
 * Reels del estudio, en carrusel horizontal con formato vertical 9:16.
 *
 * No usamos el embed de Instagram a propósito: carga varios cientos de kB de
 * scripts de Meta, rastrea a quien visita y se rompe cuando cambian su API.
 * Acá los videos son propios; se ven igual y pesan una fracción.
 *
 * Cada reel se reproduce en silencio al tocarlo, y solo uno a la vez.
 */
interface Reel {
  id: string;
  video: string;
  poster: string;
  titulo: string;
}

const REELS: Reel[] = [
  { id: 'r1', video: '/videos/reel-1.mp4', poster: '/images/g-unas-esmaltado.jpg', titulo: 'Esmaltado permanente' },
  { id: 'r2', video: '/videos/reel-2.mp4', poster: '/images/g-pestanas-extension.jpg', titulo: 'Extensión de pestañas' },
  { id: 'r3', video: '/videos/reel-3.mp4', poster: '/images/g-cejas-diseno.jpg', titulo: 'Diseño de cejas' },
  { id: 'r4', video: '/videos/reel-4.mp4', poster: '/images/g-unas-diseno.jpg', titulo: 'Uñas con diseño' },
];

export default function Reels() {
  const refs = useRef<Record<string, HTMLVideoElement | null>>({});
  const [activo, setActivo] = useState<string | null>(null);

  function reproducir(id: string) {
    // Pausamos el resto: varios videos sonando a la vez es lo peor que puede
    // pasar en una galería de este tipo.
    Object.entries(refs.current).forEach(([k, v]) => {
      if (k !== id && v) {
        v.pause();
        v.currentTime = 0;
      }
    });

    const v = refs.current[id];
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => setActivo(null));
      setActivo(id);
    } else {
      v.pause();
      setActivo(null);
    }
  }

  return (
    <Section className="fondo-rosado">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          align="left"
          tono="rosa"
        eyebrow="En movimiento"
          title="Nuestros trabajos"
          subtitle="Mira cómo queda cada servicio antes de reservar."
        />

        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2 texto--1 uppercase espaciado-medio text-rosa-300 transition-colors duration-300 hover:text-crema-100"
        >
          @{INSTAGRAM_USUARIO}
          <ArrowRight
            size={14}
            strokeWidth={1.5}
            aria-hidden="true"
            className="transition-transform duration-300 group-hover:translate-x-1"
          />
        </a>
      </div>

      {/*
        Carrusel con scroll-snap: en móvil se desliza uno a uno y en escritorio
        se ven todos. Los márgenes negativos permiten que sangre hasta el borde.
      */}
      <div className="-mx-5 mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
        {REELS.map((reel, i) => (
          <article
            key={reel.id}
            className="anim-entrada group w-[62%] shrink-0 snap-center sm:w-[42%] lg:w-[23%]"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <button
              type="button"
              onClick={() => reproducir(reel.id)}
              aria-label={`Reproducir ${reel.titulo}`}
              className="relative block w-full overflow-hidden rounded-[var(--radius-medio)] bg-tinta-850 transition-shadow duration-500 sombra-sutil hover:sombra-hover"
            >
              <video
                ref={(el) => {
                  refs.current[reel.id] = el;
                }}
                className="aspect-[9/16] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                poster={reel.poster}
                preload="none"
                muted
                loop
                playsInline
                onPause={() => setActivo((a) => (a === reel.id ? null : a))}
              >
                <source src={reel.video} type="video/mp4" />
              </video>

              <span
                aria-hidden="true"
                className={`absolute inset-0 bg-gradient-to-t from-tinta-900/70 via-transparent to-transparent transition-opacity duration-500 ${
                  activo === reel.id ? 'opacity-0' : 'opacity-100'
                }`}
              />

              <span
                aria-hidden="true"
                className={`absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-tinta-900/95 transition-all duration-500 ease-out group-hover:scale-110 ${
                  activo === reel.id ? 'scale-75 opacity-0' : 'opacity-100'
                }`}
              >
                <Play size={17} strokeWidth={1.5} className="ml-0.5 text-crema-100" />
              </span>

              <span
                className={`absolute inset-x-0 bottom-0 p-4 text-left texto--1 text-crema-100 transition-opacity duration-500 ${
                  activo === reel.id ? 'opacity-0' : 'opacity-100'
                }`}
              >
                {reel.titulo}
              </span>
            </button>
          </article>
        ))}
      </div>
    </Section>
  );
}
