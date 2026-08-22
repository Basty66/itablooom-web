import { Sparkles, ShieldCheck, HeartHandshake } from 'lucide-react';
import { Section, SectionHeading } from '../ui/Section';
import Button from '../ui/Button';
import { CIUDAD } from '../../lib/contacto';

/**
 * CONTENIDO PROVISORIO.
 *
 * El nombre es real; la trayectoria, las cifras y la foto son de relleno para
 * maquetar. Antes de publicar hay que confirmarlos con Ignacia y reemplazar
 * `/images/g-ignacia.jpg` por una foto suya: la actual es de banco y no la
 * retrata, justamente para no atribuirle el rostro de otra persona.
 */
const NOMBRE = 'Ignacia Ramírez';

const PILARES = [
  {
    icono: Sparkles,
    titulo: 'Trabajo personalizado',
    texto: 'Cada diseño se conversa antes de empezar, según tu estilo y el largo que te acomode.',
  },
  {
    icono: ShieldCheck,
    titulo: 'Higiene y materiales',
    texto: 'Instrumental esterilizado y productos de marcas profesionales en cada atención.',
  },
  {
    icono: HeartHandshake,
    titulo: 'Una clienta a la vez',
    texto: 'Reservas con hora fija: sin esperas ni apuros, con el tiempo que tu servicio necesita.',
  },
];

export default function SobreMi() {
  return (
    <Section id="sobre-mi" className="fondo-rosado">
      <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-16">
        {/*
          Columna de identidad: retrato circular con el nombre debajo. El
          círculo lee como perfil —quién te va a atender— mientras que el
          rectángulo leía como foto de catálogo.
        */}
        <div className="lg:col-span-4">
          <figure className="mx-auto max-w-[15rem] text-center lg:mx-0 lg:max-w-none">
            <div className="relative mx-auto aspect-square w-full max-w-[15rem]">
              {/* Aro desplazado: el mismo recurso de línea fina, en círculo. */}
              <div
                aria-hidden="true"
                className="linea-rosa absolute inset-0 scale-105 rounded-full border"
              />
              <img
                src="/images/g-ignacia.jpg"
                alt={`${NOMBRE}, especialista de Goddess Studio`}
                loading="lazy"
                decoding="async"
                width={600}
                height={600}
                className="relative h-full w-full rounded-full object-cover object-top"
              />
            </div>

            <figcaption className="mt-6">
              <p className="font-display texto-2 leading-tight text-crema-100">{NOMBRE}</p>
              <p className="mt-1.5 texto--2 uppercase espaciado-medio text-rosa-300">
                Especialista en uñas, pestañas y cejas
              </p>
            </figcaption>
          </figure>
        </div>

        <div className="lg:col-span-8">
          <SectionHeading
            align="left"
            tono="rosa"
        eyebrow="Sobre mí"
            title="Mi historia"
            subtitle={`Llevo más de cinco años dedicada a las uñas, pestañas y cejas. Empecé atendiendo a amigas en mi casa y hoy tengo mi propio espacio en ${CIUDAD}, donde recibo a cada clienta con hora reservada.`}
          />

          <p className="mt-4 max-w-xl texto--1 text-crema-100/70 sm:texto-0">
            Me gusta que salgas sintiéndote regia, pero también que el resultado te dure. Por eso
            trabajo con productos de calidad y me tomo el tiempo de explicarte cómo cuidar tu
            trabajo en casa.
          </p>

          <ul className="mt-6 space-y-3 sm:mt-8 sm:space-y-4">
            {PILARES.map(({ icono: Icono, titulo, texto }, i) => (
              <li
                key={titulo}
                className="anim-entrada flex items-start gap-3 sm:gap-4"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span className="linea-rosa flex h-10 w-10 shrink-0 items-center justify-center rounded-full border">
                  <Icono size={17} strokeWidth={1.5} className="text-rosa-300" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="texto-0 font-medium text-crema-100">{titulo}</h3>
                  <p className="mt-0.5 texto--1 text-crema-100/70">{texto}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-7 sm:mt-9">
            <Button to="/agendar" size="md" variant="primary">
              Reservar mi hora
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}
