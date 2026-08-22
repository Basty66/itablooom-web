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
    /*
     * Una pantalla exacta, descontando la barra superior (que es sticky y sí
     * ocupa alto). Antes la foto usaba proporción fija: apilada bajo el texto
     * en móvil, el hero medía más de un viewport y obligaba a scrollear antes
     * de terminar de leer el titular.
     *
     * Con el teléfono acostado quedan unos 375px de alto: ahí "pantalla
     * completa" apilada dejaba los botones a 463px, fuera de vista. En esas
     * alturas el hero deja de estirarse y pasa a dos columnas, que es lo que
     * cabe en un viewport apaisado.
     */
    <section className="fondo-rosado relative flex min-h-[calc(100svh-4.5rem)] flex-col justify-center [@media(max-height:520px)]:min-h-0">
      <Container className="relative w-full">
        <div className="grid items-center gap-8 py-10 sm:gap-10 md:py-14 lg:grid-cols-12 lg:gap-16 lg:py-12 [@media(min-width:700px)_and_(max-height:520px)]:grid-cols-12 [@media(min-width:700px)_and_(max-height:520px)]:gap-10 [@media(min-width:700px)_and_(max-height:520px)]:py-6">
          <div className="lg:col-span-6 [@media(min-width:700px)_and_(max-height:520px)]:col-span-6">
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
              className="anim-entrada mt-5 flex flex-col gap-1 leading-[0.9] text-crema-100 sm:mt-8 [@media(min-width:700px)_and_(max-height:520px)]:mt-4"
              style={{ animationDelay: '180ms' }}
            >
              <span className="texto-5 [@media(min-width:700px)_and_(max-height:520px)]:text-[2.6rem]">Goddess</span>
              {/* El desplazamiento a la derecha es del diseño: rompe la
                  alineación y hace que el nombre respire. */}
              <span className="ml-8 texto-4 italic text-rosa-300 sm:ml-12 [@media(min-width:700px)_and_(max-height:520px)]:text-[2rem]">Studio</span>
            </h1>

            <p
              className="anim-entrada mt-5 max-w-md text-nacar-200/80 sm:mt-7 [@media(min-width:700px)_and_(max-height:520px)]:mt-3"
              style={{ animationDelay: '260ms' }}
            >
              Esmaltado permanente, extensión de pestañas y diseño de cejas en {CIUDAD}.
              Atención con hora reservada, una clienta a la vez.
            </p>

            <div
              className="anim-entrada mt-7 flex flex-col gap-3 sm:mt-9 sm:flex-row [@media(min-width:700px)_and_(max-height:520px)]:mt-5"
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
              className="anim-entrada mt-5 texto--1 text-nacar-300 sm:mt-7 [@media(min-width:700px)_and_(max-height:520px)]:hidden"
              style={{ animationDelay: '400ms' }}
            >
              Reserva con un abono · Pago seguro con Mercado Pago
            </p>
          </div>

          {/* La foto entra completa y contenida, no como fondo difuminado. */}
          <div className="anim-velo lg:col-span-6 [@media(min-width:700px)_and_(max-height:520px)]:col-span-6" style={{ animationDelay: '300ms' }}>
            <div className="relative mx-auto max-w-sm lg:max-w-none">
              <img
                src="/images/g-hero.jpg"
                alt="Sesión de extensión de pestañas en Goddess Studio"
                fetchPriority="high"
                decoding="async"
                width={900}
                height={1100}
                /* Alto atado al viewport, no a una proporción: así la foto
                   crece con la pantalla pero nunca empuja el hero más allá
                   de una pantalla. */
                className="h-[30svh] w-full rounded-[var(--radius-foto)] object-cover sm:h-[36svh] lg:h-[min(64svh,600px)] [@media(min-width:700px)_and_(max-height:520px)]:h-[62svh]"
              />
              {/* Marco desplazado: profundidad con una línea, no con sombra. */}
              <div
                aria-hidden="true"
                className="linea-oro pointer-events-none absolute inset-0 h-full w-full rounded-[var(--radius-foto)] border sm:-bottom-4 sm:-right-4 sm:inset-auto"
              />
            </div>
          </div>
        </div>
      </Container>

      <ScrollIndicator destino="#como-funciona" />
    </section>
  );
}
