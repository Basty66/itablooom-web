import { useState, useRef } from 'react';
import { Play, Pause } from 'lucide-react';
import { Section, SectionHeading } from '../ui/Section';

/**
 * Video de bienvenida.
 *
 * `preload="none"` y sin `autoplay`: el video no se descarga hasta que la
 * clienta lo pide. Un video de bienvenida que arranca solo dispara datos en
 * móvil y suele molestar más de lo que suma.
 *
 * Mientras no exista el archivo, el póster hace de portada y el reproductor
 * no se rompe: basta subir /videos/bienvenida.mp4 para activarlo.
 */
const VIDEO = '/videos/bienvenida.mp4';
const POSTER = '/images/g-hero.jpg';

export default function VideoBienvenida() {
  const ref = useRef<HTMLVideoElement>(null);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [iniciado, setIniciado] = useState(false);

  function alternar() {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      setIniciado(true);
      v.play().catch(() => setReproduciendo(false));
    } else {
      v.pause();
    }
  }

  return (
    <Section className="fondo-rosado">
      <SectionHeading
        tono="rosa"
        eyebrow="Conócenos"
        title="Un minuto en el estudio"
        subtitle="Así trabajamos, así te vas a sentir."
      />

      <div className="mx-auto mt-12 max-w-3xl">
        <div className="group relative overflow-hidden rounded-[var(--radius-medio)] bg-tinta-900 sombra-sutil transition-shadow duration-500 hover:sombra-hover">
          <video
            ref={ref}
            className="aspect-video w-full object-cover"
            poster={POSTER}
            preload="none"
            playsInline
            controls={iniciado}
            onPlay={() => setReproduciendo(true)}
            onPause={() => setReproduciendo(false)}
            onEnded={() => setReproduciendo(false)}
          >
            <source src={VIDEO} type="video/mp4" />
          </video>

          {/* El botón desaparece cuando el video corre, para no tapar la imagen. */}
          <button
            type="button"
            onClick={alternar}
            aria-label={reproduciendo ? 'Pausar video' : 'Reproducir video de bienvenida'}
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${
              reproduciendo ? 'pointer-events-none opacity-0' : 'opacity-100'
            }`}
          >
            <span className="absolute inset-0 bg-tinta-900/25 transition-colors duration-500 group-hover:bg-tinta-900/35" />
            <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-tinta-900/95 transition-transform duration-500 ease-out group-hover:scale-110 sm:h-20 sm:w-20">
              {reproduciendo ? (
                <Pause size={22} strokeWidth={1.5} className="text-crema-100" aria-hidden="true" />
              ) : (
                <Play size={22} strokeWidth={1.5} className="ml-1 text-crema-100" aria-hidden="true" />
              )}
            </span>
          </button>
        </div>
      </div>
    </Section>
  );
}
