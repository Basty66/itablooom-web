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
      <div className="grid items-start gap-8 lg:grid-cols-12 lg:gap-16">
        {/*
          Columna de identidad: retrato circular con el nombre debajo. El
          círculo lee como perfil —quién te va a atender— mientras que el
          rectángulo leía como foto de catálogo.
        */}
        <div className="lg:col-span-4">
          <figure className="mx-auto max-w-[11rem] text-center sm:max-w-[16rem] lg:mx-0 lg:max-w-none">
            {/* Aro discontinuo de oro alrededor del retrato: enmarca sin
                encerrar, y el aire entre línea y foto es parte del gesto.
                En móvil el retrato baja a 11rem: a 16rem se comía media
                pantalla antes de que empezara la historia. */}
            <div className="anillo-retrato relative mx-auto aspect-square w-full max-w-[11rem] rounded-full sm:max-w-[16rem]">
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

            <figcaption className="mt-4 sm:mt-6">
              <p className="font-display texto-2 text-crema-100 sm:texto-3">{NOMBRE}</p>
              <p className="mt-2 texto--2 uppercase espaciado-amplio text-rosa-300">
                Especialista en uñas, pestañas y cejas
              </p>
            </figcaption>
          </figure>
        </div>

        <div className="lg:col-span-8">
          <SectionHeading
            align="left"
            tono="rosa"
            eyebrow="Fundadora & artista"
            title="Mi historia"
            subtitle={`Llevo más de cinco años dedicada a las uñas, pestañas y cejas. Empecé atendiendo a amigas en mi casa y hoy tengo mi propio espacio en ${CIUDAD}, donde recibo a cada clienta con hora reservada.`}
          />

          <p className="mt-3 max-w-[58ch] texto--1 leading-relaxed text-nacar-200/80 sm:mt-4 sm:texto-0">
            Me gusta que salgas sintiéndote regia, pero también que el resultado te dure. Por eso
            trabajo con productos de calidad y me tomo el tiempo de explicarte cómo cuidar tu
            trabajo en casa.
          </p>

          <ul className="mt-5 space-y-3 sm:mt-8 sm:space-y-4">
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
                  <p className="mt-0.5 texto--1 text-nacar-200/80">{texto}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 sm:mt-9">
            <Button to="/agendar" size="md" variant="primary">
              Reservar mi hora
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}
