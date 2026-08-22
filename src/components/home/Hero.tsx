import { Container } from '../ui/Section';
import Button from '../ui/Button';
import ScrollIndicator from '../ui/ScrollIndicator';
import { RUBRO, CIUDAD } from '../../lib/contacto';


/**
 * Hero minimalista.
 *
 * Sin degradados, sin sombras y sin la foto de fondo al 18%, que se leía como
 * una mancha en vez de una imagen. Ahora la foto es un bloque contenido con
 * proporción de retrato y el peso lo llevan la tipografía y el aire.
 */
export default function Hero() {
  return (
    <section className="fondo-rosado relative lg:[@media(min-height:720px)]:min-h-[90svh] lg:flex lg:items-center">
      <Container className="relative w-full">
        <div className="grid items-center gap-12 py-16 md:py-24 lg:grid-cols-12 lg:gap-16 lg:pb-40 lg:pt-12">
          <div className="lg:col-span-7">
            {/* Línea corta al costado del rótulo: el gesto de apertura del
                diseño, más elegante que una regla debajo. */}
            <div
              className="anim-entrada inline-flex items-center gap-3"
              style={{ animationDelay: '60ms' }}
            >
              <span aria-hidden="true" className="h-px w-8 bg-rosa-300" />
              <p className="texto--1 uppercase espaciado-amplio text-rosa-300">{RUBRO}</p>
            </div>

            <h1
              className="anim-entrada mt-8 flex flex-col gap-1 leading-[0.9] text-crema-100"
              style={{ animationDelay: '180ms' }}
            >
              <span className="texto-5">Goddess</span>
              {/* El desplazamiento a la derecha es del diseño: rompe la
                  alineación y hace que el nombre respire. */}
              <span className="ml-8 texto-4 italic text-dorado-300 sm:ml-12">Studio</span>
            </h1>

            <p
              className="anim-entrada mt-8 max-w-md text-crema-100/70"
              style={{ animationDelay: '260ms' }}
            >
              Esmaltado permanente, extensión de pestañas y diseño de cejas en {CIUDAD}.
              Atención con hora reservada, una clienta a la vez.
            </p>

            <div
              className="anim-entrada mt-10 flex flex-col gap-3 sm:flex-row"
              style={{ animationDelay: '340ms' }}
            >
              <Button to="/agendar" size="lg" variant="primary">
                Agendar hora
              </Button>
              <Button to="/servicios" size="lg" variant="outline">
                Ver servicios
              </Button>
            </div>

            <p
              className="anim-entrada mt-8 texto--1 text-crema-100/55"
              style={{ animationDelay: '400ms' }}
            >
              Reserva con un abono · Pago seguro con Mercado Pago
            </p>
          </div>

          {/* La foto entra completa y contenida, no como fondo difuminado. */}
          <div className="anim-velo lg:col-span-5" style={{ animationDelay: '300ms' }}>
            <div className="relative mx-auto max-w-sm lg:max-w-none">
              <img
                src="/images/g-hero.jpg"
                alt="Sesión de extensión de pestañas en Goddess Studio"
                fetchPriority="high"
                decoding="async"
                width={900}
                height={1100}
                className="aspect-[4/3] w-full rounded-[var(--radius-medio)] object-cover sm:aspect-[4/5]"
              />
              {/* Marco desplazado: profundidad con una línea, no con sombra. */}
              <div
                aria-hidden="true"
                className="linea-oro pointer-events-none absolute inset-0 h-full w-full rounded-[var(--radius-medio)] border sm:-bottom-4 sm:-right-4 sm:inset-auto"
              />
            </div>
          </div>
        </div>
      </Container>

      <ScrollIndicator destino="#como-funciona" />
    </section>
  );
}
