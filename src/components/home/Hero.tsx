import { Container } from '../ui/Section';
import Button from '../ui/Button';
import ScrollIndicator from '../ui/ScrollIndicator';
import { RUBRO, CIUDAD } from '../../lib/contacto';

/**
 * Hero de solo tipografía, sobre el foco de luz vino.
 *
 * La foto salió a la espera de una de Ignacia en el estudio: la que había era
 * de su trabajo, pero puesta al costado competía con el titular y obligaba a
 * partir el ancho en dos. Sin ella el nombre ocupa lo que quiere, el halo de
 * vino llena el lado derecho y la pantalla completa queda para el texto y los
 * dos botones.
 *
 * Cuando llegue el retrato, el plan es al revés: foto a sangre completa con el
 * texto encima, que necesita una toma horizontal con aire a un costado.
 */
export default function Hero() {
  return (
    /*
     * Una pantalla exacta, descontando la barra superior. Sin la foto el
     * contenido ya no corre riesgo de desbordar en horizontal —es solo texto—,
     * pero el tope de altura se queda: con el teléfono acostado quedan unos
     * 375px y ahí conviene que la sección deje de estirarse.
     */
    <section className="luz-vino relative flex min-h-[calc(100svh-4.5rem)] flex-col justify-center [@media(max-height:520px)]:min-h-0">
      <Container className="relative w-full">
        {/*
          El colchón de abajo no es estético: el indicador de scroll va anclado
          al pie del hero y el contenido va centrado, así que en pantallas
          cortas —un teléfono de 664px con las barras del navegador— la línea
          del abono terminaba pasando por encima de "Descubre más".

          Se reserva justo en el tramo donde el indicador aparece, que es a
          partir de 600px de alto; por debajo no se muestra y el colchón sobra.
        */}
        <div className="py-16 md:py-24 [@media(min-height:600px)]:pb-36 [@media(max-height:520px)]:py-8">
          {/* Línea corta al costado del rótulo: el gesto de apertura del
              diseño, más elegante que una regla debajo. */}
          <div
            className="anim-entrada inline-flex items-center gap-3"
            style={{ animationDelay: '60ms' }}
          >
            <span aria-hidden="true" className="h-px w-10 bg-vino-700" />
            <p className="texto--1 uppercase espaciado-amplio text-rosa-300">{RUBRO}</p>
          </div>

          <h1
            className="anim-entrada mt-6 flex flex-col gap-1 leading-[0.95] text-crema-100 sm:mt-8"
            style={{ animationDelay: '180ms' }}
          >
            <span className="texto-5">Goddess</span>
            {/* El desplazamiento a la derecha es del diseño: rompe la
                alineación y hace que el nombre respire. */}
            <span className="ml-8 texto-5 italic text-rosa-300 sm:ml-12">Studio</span>
          </h1>

          <p
            className="anim-entrada mt-7 max-w-[40ch] text-nacar-200/90 sm:mt-8 [@media(max-height:520px)]:hidden"
            style={{ animationDelay: '260ms' }}
          >
            Esmaltado permanente, extensión de pestañas y diseño de cejas en {CIUDAD}.
            Atención con hora reservada, una clienta a la vez.
          </p>

          <div
            className="anim-entrada mt-9 flex flex-col gap-3 sm:flex-row [@media(max-height:520px)]:mt-5"
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
            className="anim-entrada mt-6 texto--1 text-cobre-400 sm:mt-7 [@media(max-height:520px)]:hidden"
            style={{ animationDelay: '400ms' }}
          >
            Reserva con un abono · Pago seguro con Mercado Pago
          </p>
        </div>
      </Container>

      <ScrollIndicator destino="#como-funciona" />
    </section>
  );
}
