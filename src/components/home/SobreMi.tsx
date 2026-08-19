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
    <Section id="sobre-mi" className="bg-nude-100">
      <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-14">
        {/* La foto va primero en móvil: pone rostro antes que texto. */}
        <div className="lg:col-span-5">
          <div className="relative mx-auto max-w-sm lg:max-w-none">
            {/* Marco dorado desplazado: da profundidad sin recargar. */}
            <div
              aria-hidden="true"
              className="absolute -bottom-3 -right-3 h-full w-full rounded-3xl border border-dorado-400/40"
            />
            <img
              src="/images/g-ignacia.jpg"
              alt={`${NOMBRE}, especialista de Goddess Studio, trabajando en una sesión`}
              loading="lazy"
              decoding="async"
              width={900}
              height={1100}
              /* En móvil un 4/5 se comía media pantalla: ahí va apaisada y
                 recupera el retrato vertical recién en escritorio. */
              className="relative aspect-[3/2] w-full rounded-3xl object-cover object-top shadow-[0_24px_60px_-32px_rgba(20,16,14,0.5)] sm:aspect-[4/3] lg:aspect-[4/5]"
            />
          </div>
        </div>

        <div className="lg:col-span-7">
          <SectionHeading
            align="left"
            eyebrow="Sobre mí"
            title={`Hola, soy ${NOMBRE}`}
            subtitle={`Llevo más de cinco años dedicada a las uñas, pestañas y cejas. Empecé atendiendo a amigas en mi casa y hoy tengo mi propio espacio en ${CIUDAD}, donde recibo a cada clienta con hora reservada.`}
          />

          <p className="mt-4 max-w-xl texto--1 text-tinta-600 sm:texto-0">
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
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-dorado-100">
                  <Icono size={17} strokeWidth={1.5} className="text-dorado-700" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="texto-0 font-medium text-tinta-900">{titulo}</h3>
                  <p className="mt-0.5 texto--1 text-tinta-600">{texto}</p>
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
