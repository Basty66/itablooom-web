import { MessageCircle } from 'lucide-react';
import { Container } from '../ui/Section';
import BotonLujo from '../ui/BotonLujo';
import Revelar from '../ui/Revelar';
import Magnetico from '../ui/Magnetico';
import PolvoDorado from '../ui/PolvoDorado';
import { linkWhatsApp } from '../../lib/contacto';

/**
 * Cierre de la portada: la última oportunidad de reservar antes del pie.
 *
 * Antes era el único bloque crema del sitio. Cortaba el negro, pero en
 * el momento de decidir se sentía como salir del estudio; acá el vino sube
 * como una luz de escenario, el polvo dorado vuelve a aparecer como en la
 * entrada, y la palabra que la marca promete es lo más grande de la página.
 */
export default function Cierre() {
  return (
    <section className="fondo-cierre relative isolate overflow-hidden py-24 md:py-36">
      <PolvoDorado className="pointer-events-none absolute inset-0 -z-10 h-full w-full" />

      <Container className="relative text-center">
        <Revelar>
          <p className="texto--1 font-medium uppercase espaciado-amplio text-rosa-200">Reserva tu hora</p>
          <h2 className="mt-6 text-crema-100">
            <span className="block texto-4">Sal de aquí sintiéndote</span>
            {/* El padding guarda la cola itálica: fuera de la caja el metal
                no se pinta y la "a" quedaba mocha. */}
            <span className="metal-vivo metal-oro-rosa mx-auto block w-fit px-[0.12em] pb-[0.08em] text-[clamp(5rem,22vw,12rem)] italic leading-[0.95]">
              diosa.
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-[40ch] texto-1 text-nacar-200/85">
            Elige tu servicio, el día y la hora. Te confirmamos al instante.
          </p>
        </Revelar>

        <Revelar delay={160}>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Magnetico className="w-full sm:w-auto">
              <BotonLujo to="/agendar" className="w-full sm:w-auto">
                Reservar mi hora
              </BotonLujo>
            </Magnetico>
            <BotonLujo
              href={linkWhatsApp('Hola! Quiero consultar por un servicio')}
              variante="vidrio"
              icono={MessageCircle}
              className="w-full sm:w-auto"
            >
              Escríbenos
            </BotonLujo>
          </div>
        </Revelar>
      </Container>
    </section>
  );
}
