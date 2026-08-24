import { useRef, useState, useEffect } from 'react';
import { Play, ArrowRight, Volume2, VolumeX } from 'lucide-react';
import { Section, SectionHeading } from '../ui/Section';
import { INSTAGRAM_URL, INSTAGRAM_USUARIO } from '../../lib/contacto';

/**
 * Reels del estudio, en carrusel horizontal con formato vertical 9:16.
 *
 * No usamos el embed de Instagram a propósito: carga varios cientos de kB de
 * scripts de Meta, rastrea a quien visita y se rompe cuando cambian su API.
 * Acá los videos son propios; se ven igual y pesan una fracción.
 *
 * El que entra en pantalla se reproduce solo y se pausa al salir, como en
 * Instagram. Arranca en silencio porque ningún navegador deja que un video
 * con sonido empiece sin que la persona haya tocado algo; el botón de
 * altavoz lo activa, y esa preferencia se mantiene para los demás.
 */
interface Reel {
  id: string;
  video: string;
  poster: string;
  titulo: string;
}

/*
 * Videos del estudio. Mientras el arreglo esté vacío la sección no se muestra:
 * antes apuntaba a archivos que no existían y, como Vercel responde el
 * index.html para lo que no encuentra, se veían cuatro tarjetas que al
 * tocarlas no reproducían nada.
 */
const REELS: Reel[] = [
  { id: 'r1', video: '/videos/reel-1.mp4', poster: '/images/p-reel-1.jpg', titulo: 'Transformación en uñas' },
  { id: 'r2', video: '/videos/reel-2.mp4', poster: '/images/p-reel-2.jpg', titulo: 'Diseño de cejas' },
  { id: 'r3', video: '/videos/reel-3.mp4', poster: '/images/p-reel-3.jpg', titulo: 'Uñas, paso a paso' },
  { id: 'r4', video: '/videos/reel-4.mp4', poster: '/images/p-reel-4.jpg', titulo: 'Extensión de pestañas' },
];

/** Cuánto tiene que asomar un reel para que se reproduzca solo. */
const VISIBLE_MINIMO = 0.6;

export default function Reels() {
  const refs = useRef<Record<string, HTMLVideoElement | null>>({});
  const tarjetas = useRef<Record<string, HTMLElement | null>>({});
  /** Reels que la clienta pausó a mano: no se reanudan solos mientras siga ahí. */
  const pausadosAMano = useRef<Set<string>>(new Set());
  const [activo, setActivo] = useState<string | null>(null);
  const [conSonido, setConSonido] = useState(false);

  function pausarOtros(id: string) {
    Object.entries(refs.current).forEach(([k, v]) => {
      if (k !== id && v && !v.paused) {
        v.pause();
        v.currentTime = 0;
      }
    });
  }

  /*
   * Solo suena el que se está viendo. Si sonaran todos a la vez sería un
   * ruido incomprensible, y además el navegador silencia de vuelta cualquier
   * video que intente arrancar con audio por su cuenta.
   */
  useEffect(() => {
    Object.entries(refs.current).forEach(([id, v]) => {
      if (v) v.muted = !(conSonido && id === activo);
    });
  }, [conSonido, activo]);

  /*
   * Reproducción automática al entrar en pantalla.
   *
   * Se reproduce el que más asoma y nada más: cuatro videos decodificando a
   * la vez calientan el teléfono y gastan datos de quien quizá solo venía a
   * ver precios.
   */
  useEffect(() => {
    if (REELS.length === 0 || typeof IntersectionObserver === 'undefined') return;
    // Quien pidió menos movimiento reproduce con el botón, no solo.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const visibilidad = new Map<string, number>();

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          const id = (e.target as HTMLElement).dataset.reel;
          if (id) visibilidad.set(id, e.intersectionRatio);
        }

        let elegido: string | null = null;
        let mayor = VISIBLE_MINIMO;
        visibilidad.forEach((ratio, id) => {
          if (ratio >= mayor && !pausadosAMano.current.has(id)) {
            mayor = ratio;
            elegido = id;
          }
        });

        // El que salió de pantalla deja de contar como pausado a mano: si
        // vuelve, vuelve a reproducirse solo.
        visibilidad.forEach((ratio, id) => {
          if (ratio < VISIBLE_MINIMO) pausadosAMano.current.delete(id);
        });

        if (!elegido) {
          pausarOtros('');
          setActivo(null);
          return;
        }

        const v = refs.current[elegido];
        if (!v) return;
        pausarOtros(elegido);
        if (v.paused) {
          v.play()
            .then(() => setActivo(elegido))
            .catch(() => setActivo(null));
        }
      },
      { threshold: [0, 0.3, VISIBLE_MINIMO, 0.9] }
    );

    Object.values(tarjetas.current).forEach((el) => el && observador.observe(el));
    return () => observador.disconnect();
  }, []);

  function reproducir(id: string) {
    // Pausamos el resto: varios videos sonando a la vez es lo peor que puede
    // pasar en una galería de este tipo.
    pausarOtros(id);

    const v = refs.current[id];
    if (!v) return;
    if (v.paused) {
      pausadosAMano.current.delete(id);
      v.play().catch(() => setActivo(null));
      setActivo(id);
    } else {
      // Pausa deliberada: que no se lo vuelva a reanudar el observador.
      pausadosAMano.current.add(id);
      v.pause();
      setActivo(null);
    }
  }

  /** El altavoz enciende el sonido y, de paso, reproduce ese reel. */
  function alternarSonido(id: string) {
    const encender = !(conSonido && id === activo);
    setConSonido(encender);

    const v = refs.current[id];
    if (!v) return;
    if (encender && v.paused) {
      pausadosAMano.current.delete(id);
      pausarOtros(id);
      v.play().catch(() => setActivo(null));
      setActivo(id);
    }
  }

  if (REELS.length === 0) return null;

  return (
    <Section className="fondo-rosado">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          align="left"
          tono="rosa"
        eyebrow="Portafolio"
          title="Nuestros trabajos"
          subtitle="Mira cómo queda cada servicio antes de reservar."
        />

        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          /* py-3 con -my-3 lleva el alto táctil a 44px sin correr el enlace
             de su sitio: el texto queda donde estaba y el dedo acierta. */
          className="group -my-3 inline-flex items-center gap-2 py-3 texto--1 uppercase espaciado-medio text-rosa-300 transition-colors duration-300 hover:text-crema-100"
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
      <div className="-mx-5 mt-12 flex snap-x snap-mandatory gap-4 sin-barra overflow-x-auto px-5 pb-4 sm:mx-0 sm:px-0">
        {REELS.map((reel, i) => {
          const reproduciendo = activo === reel.id;
          const sonando = conSonido && reproduciendo;
          return (
            <article
              key={reel.id}
              ref={(el) => {
                tarjetas.current[reel.id] = el;
              }}
              data-reel={reel.id}
              className="anim-entrada group w-[62%] shrink-0 snap-center sm:w-[42%] lg:w-[23%]"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/*
                Contenedor y no <button>: adentro va el altavoz, y un botón
                dentro de otro botón es HTML inválido. La capa de reproducción
                es un botón propio que cubre toda la tarjeta.
              */}
              <div className="relative overflow-hidden rounded-[var(--radius-foto)] bg-tinta-850 transition-shadow duration-500 sombra-sutil hover:sombra-hover">
                {/*
                  La tarjeta pausada respira: el mismo acercamiento lentísimo
                  del hero, seis por ciento en veintiocho segundos. Cuatro
                  pósters completamente quietos no se leen como algo que se
                  pueda tocar.

                  El retraso negativo arranca a cada uno en un punto distinto
                  del ciclo —sin esperar a que pase— para que no respiren los
                  cuatro al unísono, que se vería mecánico. Y al reproducirse
                  la animación se pausa en vez de quitarse: quitarla devuelve
                  el zoom a cero de golpe, y ese salto se nota.
                */}
                <div
                  className="deriva"
                  style={{
                    animationDelay: `-${i * 7}s`,
                    animationPlayState: reproduciendo ? 'paused' : 'running',
                  }}
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
                </div>

                <button
                  type="button"
                  onClick={() => reproducir(reel.id)}
                  aria-label={activo === reel.id ? `Pausar ${reel.titulo}` : `Reproducir ${reel.titulo}`}
                  className="absolute inset-0 h-full w-full"
                />

                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-t from-tinta-900/70 via-transparent to-transparent transition-opacity duration-500 ${
                    activo === reel.id ? 'opacity-0' : 'opacity-100'
                  }`}
                />

                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-tinta-900/95 transition-all duration-500 ease-out group-hover:scale-110 ${
                    activo === reel.id ? 'scale-75 opacity-0' : 'opacity-100'
                  }`}
                >
                  <Play size={17} strokeWidth={1.5} className="ml-0.5 text-crema-100" />
                </span>

                {/* 44px de lado: el mínimo para que el dedo acierte sin pelear
                    con la capa de reproducción que tiene debajo. */}
                <button
                  type="button"
                  onClick={() => alternarSonido(reel.id)}
                  aria-pressed={sonando}
                  aria-label={sonando ? `Silenciar ${reel.titulo}` : `Activar sonido de ${reel.titulo}`}
                  className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-tinta-950/70 text-crema-100 backdrop-blur-sm transition-colors duration-300 hover:bg-tinta-950"
                >
                  {sonando ? (
                    <Volume2 size={16} strokeWidth={1.5} aria-hidden="true" />
                  ) : (
                    <VolumeX size={16} strokeWidth={1.5} aria-hidden="true" />
                  )}
                </button>

                <span
                  className={`pointer-events-none absolute inset-x-0 bottom-0 p-4 text-left texto--1 text-crema-100 transition-opacity duration-500 ${
                    activo === reel.id ? 'opacity-0' : 'opacity-100'
                  }`}
                >
                  {reel.titulo}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </Section>
  );
}
