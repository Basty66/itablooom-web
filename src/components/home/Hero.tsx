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
    <section className="relative bg-crema-100 lg:[@media(min-height:720px)]:min-h-[calc(100svh-4.5rem)] lg:flex lg:items-center">
      <Container className="relative w-full">
        <div className="grid items-center gap-12 py-16 md:py-24 lg:grid-cols-12 lg:gap-16 lg:pb-40 lg:pt-12">
          <div className="lg:col-span-7">
            <p
              className="anim-entrada texto--1 uppercase espaciado-amplio text-dorado-700"
              style={{ animationDelay: '60ms' }}
            >
              {RUBRO}
            </p>

            {/* Regla fina: separa el rótulo del titular sin ocupar espacio. */}
            <div
              aria-hidden="true"
              className="anim-entrada linea-oro mt-6 w-16 border-t"
              style={{ animationDelay: '120ms' }}
            />

            <h1
              className="anim-entrada mt-8 texto-5 leading-[0.95] text-tinta-900"
              style={{ animationDelay: '180ms' }}
            >
              <span className="block">Goddess</span>
              <span className="mt-1 block italic text-dorado-600">Studio</span>
            </h1>

            <p
              className="anim-entrada mt-8 max-w-md text-tinta-600"
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
              className="anim-entrada mt-8 texto--1 text-tinta-500"
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
                className="aspect-[4/5] w-full object-cover"
              />
              {/* Marco desplazado: profundidad con una línea, no con sombra. */}
              <div
                aria-hidden="true"
                className="linea-oro pointer-events-none absolute -bottom-4 -right-4 h-full w-full border"
              />
            </div>
          </div>
        </div>
      </Container>

      <ScrollIndicator destino="#como-funciona" />
    </section>
  );
}
