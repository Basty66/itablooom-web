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
    <section className="luz-vino relative flex min-h-[calc(100svh-4.5rem)] flex-col justify-center overflow-hidden [@media(max-height:520px)]:min-h-0">
      {/*
        La figura vive fuera del contenedor de texto y solo aparece desde lg.

        En móvil no existe una "columna derecha" donde ponerla: metida ahí
        abajo empujaría los botones fuera de la pantalla, que es justo lo que
        costó dejar bien. Y como es decorativa, se oculta a los lectores de
        pantalla en vez de inventarle una descripción.

        Se apoya sobre el halo de vino, que queda detrás y la recorta contra el
        negro sin necesidad de marco.
      */}
      <div
        aria-hidden="true"
        /*
          En móvil va detrás del texto y muy lavada. No es una decisión
          estética: la línea del abono le pasa por encima, y el delantal
          blanco al 22% dejaba ese texto en 3.59:1, bajo el mínimo legible.
          Al 12% el fondo tras la letra se mantiene lo bastante oscuro.
        */
        className="pointer-events-none absolute bottom-0 right-[-8%] h-[40%] select-none opacity-[0.12] sm:right-[-2%] sm:h-[46%] lg:right-[6%] lg:h-[76%] lg:opacity-100 xl:right-[10%]"
      >
        <div className="flota relative h-full">
          <img
            src="/images/g-profesional.png"
            alt=""
            width={196}
            height={314}
            decoding="async"
            className="h-full w-auto object-contain object-bottom"
          />
          {/* El destello usa la misma imagen como máscara: la luz recorre a la
              persona y no el rectángulo que la contiene. */}
          <span
            className="destello absolute inset-0"
            style={{ '--silueta': 'url(/images/g-profesional.png)' } as React.CSSProperties}
          />
        </div>
      </div>

      <Container className="relative w-full">
        {/*
          El colchón de abajo no es estético: el indicador de scroll va anclado
          al pie del hero y el contenido va centrado, así que en pantallas
          cortas —un teléfono de 664px con las barras del navegador— la línea
          del abono terminaba pasando por encima de "Descubre más".

          Se reserva justo en el tramo donde el indicador aparece, que es a
          partir de 600px de alto; por debajo no se muestra y el colchón sobra.
        */}
        {/* El tope de ancho desde lg deja libre la columna donde va la figura:
            sin él, el párrafo y los botones le pasarían por encima. */}
        <div className="py-16 md:py-24 lg:max-w-[58%] [@media(min-height:600px)]:pb-36 [@media(max-height:520px)]:py-8">
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
