import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { MapPin } from 'lucide-react';
import { Container } from '../ui/Section';
import Emblema from '../ui/Emblema';
import { CIUDAD } from '../../lib/contacto';

/**
 * Tramos del manifiesto. Los marcados como `acento` van en itálica de oro
 * rosa: son las dos ideas que tienen que quedar después de leerlo.
 */
const TRAMOS: { texto: string; acento?: boolean }[] = [
  { texto: 'Un espacio íntimo,' },
  { texto: 'una clienta a la vez.', acento: true },
  { texto: 'Instrumental esterilizado, productos profesionales y el tiempo que tu servicio necesita, para que salgas de aquí sintiéndote' },
  { texto: 'una diosa.', acento: true },
];

/** Cada palabra con el tramo al que pertenece, en orden de lectura. */
const PALABRAS = TRAMOS.flatMap(({ texto, acento }) =>
  texto.split(' ').map((palabra) => ({ palabra, acento: Boolean(acento) }))
);

/*
 * El encendido ocupa del 18% al 58% del paso del párrafo por la pantalla:
 * empieza cuando ya asomó entero en un teléfono y termina antes de que se
 * vaya. Cada palabra se enciende en su tramo, solapada con las vecinas para
 * que la luz corra en vez de saltar.
 */
const INICIO = 18;
const RECORRIDO = 40;

/**
 * Video corto del estudio: manos recién hechas frente a la repisa de
 * esmaltes. Corre solo mientras está a la vista, y quien pidió menos
 * movimiento o ahorro de datos ve la foto fija.
 */
function VideoEstudio() {
  const ref = useRef<HTMLVideoElement>(null);
  const [conVideo, setConVideo] = useState(true);

  useEffect(() => {
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ahorro = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (reducido || ahorro) {
      setConVideo(false);
      return;
    }
    const video = ref.current;
    if (!video) return;
    const observador = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) video.play().catch(() => {});
      else video.pause();
    });
    observador.observe(video);
    return () => observador.disconnect();
  }, []);

  if (!conVideo) {
    return (
      <img
        src="/images/hero/estudio-poster.webp"
        alt="Manos con uñas recién terminadas frente a la repisa de esmaltes del estudio"
        width={480}
        height={640}
        loading="lazy"
        className="h-full w-full object-cover"
      />
    );
  }
  return (
    <video
      ref={ref}
      className="h-full w-full object-cover"
      poster="/images/hero/estudio-poster.webp"
      muted
      loop
      playsInline
      preload="none"
      aria-label="Manos con uñas recién terminadas frente a la repisa de esmaltes del estudio"
    >
      <source src="/videos/hero/estudio.webm" type="video/webm" />
      <source src="/videos/hero/estudio.mp4" type="video/mp4" />
    </video>
  );
}

/**
 * Manifiesto: una frase grande que se va iluminando palabra por palabra a
 * medida que se baja, como si se leyera en voz alta.
 *
 * Reemplaza al video de bienvenida, que apuntaba a un archivo que nunca se
 * subió: el botón de reproducir no hacía nada.
 */
export default function Manifiesto() {
  const total = PALABRAS.length;

  return (
    <section className="tono-vino relative overflow-hidden py-24 md:py-40">
      <Container className="grid items-center gap-16 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-7">
          <p className="texto--1 font-medium uppercase espaciado-amplio text-rosa-300">La experiencia</p>
          <div
            aria-hidden="true"
            className="mb-8 mt-4 h-px w-10 bg-gradient-to-r from-cobre-600 via-cobre-100 to-cobre-400"
          />

          <p className="manifiesto max-w-[24ch] font-display text-[clamp(2rem,4.2vw,3.7rem)] leading-[1.18] text-crema-100">
            {PALABRAS.map(({ palabra, acento }, i) => {
              const desde = INICIO + (i / total) * RECORRIDO;
              const hasta = desde + (RECORRIDO / total) * 4;
              return (
                <span key={i}>
                  {i > 0 && ' '}
                  <span
                    className={`encender inline-block ${acento ? 'texto-metal pr-[0.06em] italic' : ''}`}
                    style={{ animationRange: `cover ${desde}% cover ${hasta}%` } as CSSProperties}
                  >
                    {palabra}
                  </span>
                </span>
              );
            })}
          </p>
        </div>

        {/*
          El espacio, en imagen: el arco con el video del estudio, un sello que
          gira y una etiqueta que flota. Sube a otra velocidad que el texto
          con el scroll, así la columna no se siente pegada a la otra.
        */}
        <div className="relative mx-auto w-full max-w-[16rem] sm:max-w-[19rem] lg:col-span-5 lg:max-w-[23rem]">
          <div className="parallax-suave" style={{ '--vel': 1.1 } as CSSProperties}>
            <span
              aria-hidden="true"
              className="arco-forma absolute inset-0 -translate-x-4 translate-y-4 border border-cobre-400/30"
            />
            <div className="arco-forma relative p-[1.5px]">
              <span aria-hidden="true" className="arco-forma marco-metal" />
              <div className="arco-forma arco-velo relative aspect-[3/4] overflow-hidden bg-tinta-850">
                <VideoEstudio />
              </div>
            </div>
          </div>

          <span
            aria-hidden="true"
            className="vidrio absolute -left-6 top-[8%] flex aspect-square w-[38%] items-center justify-center rounded-full border sm:-left-10"
          >
            <svg viewBox="0 0 120 120" className="sello-giro absolute inset-0 h-full w-full">
              <defs>
                <path id="sello-espacio" d="M16,60 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" />
              </defs>
              <text className="fill-cobre-100" style={{ fontSize: 9, letterSpacing: '0.22em' }}>
                <textPath href="#sello-espacio" startOffset="25%" textAnchor="middle">
                  UN ESPACIO
                </textPath>
              </text>
              <text className="fill-cobre-100" style={{ fontSize: 9, letterSpacing: '0.22em' }}>
                <textPath href="#sello-espacio" startOffset="75%" textAnchor="middle">
                  SOLO PARA TI
                </textPath>
              </text>
            </svg>
            <Emblema className="relative h-[46%] w-[46%]" />
          </span>

          <span className="vidrio absolute -right-3 bottom-[12%] flex items-center gap-2 rounded-full border px-4 py-2 texto--2 uppercase espaciado-medio text-nacar-100 sm:-right-8">
            <MapPin size={13} strokeWidth={1.6} className="text-cobre-200" aria-hidden="true" />
            {CIUDAD} · hora reservada
          </span>
        </div>
      </Container>
    </section>
  );
}
