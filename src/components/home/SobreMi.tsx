import { Sparkles, ShieldCheck, HeartHandshake } from 'lucide-react';
import { Section, SectionHeading } from '../ui/Section';
import BotonLujo from '../ui/BotonLujo';
import Emblema from '../ui/Emblema';
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
    <Section id="sobre-mi" className="tono-ciruela">
      <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-20">
        {/*
          Retrato en arco con canto de metal, el mismo marco de las fotos del
          hero, y detrás el laurel del emblema como marca de agua: la persona
          dentro de la corona de la marca.
        */}
        <figure className="relative mx-auto w-full max-w-[17rem] sm:max-w-[21rem] lg:col-span-5 lg:max-w-none">
          <Emblema sinLetra className="pointer-events-none absolute -inset-[14%] opacity-[0.16]" />

          <div className="arco-forma relative p-[1.5px]">
            <span aria-hidden="true" className="arco-forma marco-metal" />
            <img
              src="/images/g-ignacia.jpg"
              alt={`${NOMBRE}, especialista de Goddess Studio`}
              loading="lazy"
              decoding="async"
              width={600}
              height={800}
              className="arco-forma relative aspect-[3/4] w-full object-cover object-top"
            />
          </div>

          {/* Sello que gira sobre el hombro del retrato. */}
          <span
            aria-hidden="true"
            className="vidrio absolute -right-3 top-[10%] flex aspect-square w-[34%] items-center justify-center rounded-full border sm:-right-6"
          >
            <svg viewBox="0 0 120 120" className="sello-giro absolute inset-0 h-full w-full">
              <defs>
                <path id="sello-fundadora" d="M16,60 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" />
              </defs>
              <text className="fill-cobre-100" style={{ fontSize: 9, letterSpacing: '0.22em' }}>
                <textPath href="#sello-fundadora" startOffset="25%" textAnchor="middle">
                  FUNDADORA
                </textPath>
              </text>
              <text className="fill-cobre-100" style={{ fontSize: 9, letterSpacing: '0.22em' }}>
                <textPath href="#sello-fundadora" startOffset="75%" textAnchor="middle">
                  GODDESS STUDIO
                </textPath>
              </text>
            </svg>
            <Emblema className="relative h-[46%] w-[46%]" />
          </span>

          {/* El nombre en una tarjeta de vidrio que flota sobre el pie del
              retrato: se lee como una firma, no como un pie de foto. */}
          <figcaption className="vidrio absolute -bottom-7 left-1/2 w-max -translate-x-1/2 rounded-2xl border px-6 py-3.5 text-center">
            <span aria-hidden="true" className="pointer-events-none canto-metal absolute inset-0 rounded-[inherit]" />
            <p className="font-display texto-2 text-crema-100">{NOMBRE}</p>
            <p className="mt-1 texto--2 uppercase espaciado-amplio text-cobre-300">
              Uñas · Pestañas · Cejas
            </p>
          </figcaption>
        </figure>

        <div className="lg:col-span-7">
          <SectionHeading
            align="left"
            tono="rosa"
            eyebrow="Fundadora & artista"
            title="Mi historia"
            destacar="historia"
            subtitle={`Llevo más de cinco años dedicada a las uñas, pestañas y cejas. Empecé atendiendo a amigas en mi casa y hoy tengo mi propio espacio en ${CIUDAD}, donde recibo a cada clienta con hora reservada.`}
          />

          {/* Su frase, en grande: es lo que una clienta recuerda de ella. */}
          <blockquote className="relative mt-9 border-l border-cobre-400/40 pl-6">
            <p className="font-display text-[clamp(1.5rem,2.6vw,2.2rem)] italic leading-snug">
              <span className="texto-metal pr-1">
                “Me gusta que salgas sintiéndote regia, pero también que el resultado te dure.”
              </span>
            </p>
            <p className="mt-4 max-w-[52ch] texto-0 leading-relaxed text-nacar-200/80">
              Por eso trabajo con productos de calidad y me tomo el tiempo de explicarte cómo cuidar
              tu trabajo en casa.
            </p>
          </blockquote>

          <ul className="mt-10 grid gap-3 sm:grid-cols-3 sm:gap-4">
            {PILARES.map(({ icono: Icono, titulo, texto }, i) => (
              <li
                key={titulo}
                className="anim-entrada relative rounded-[1.4rem] bg-tinta-880/70 p-5"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <span aria-hidden="true" className="pointer-events-none canto-metal absolute inset-0 rounded-[inherit]" />
                <span className="relative flex h-10 w-10 items-center justify-center rounded-full">
                  <span aria-hidden="true" className="pointer-events-none canto-metal activo absolute inset-0 rounded-full" />
                  <Icono size={17} strokeWidth={1.5} className="text-cobre-200" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-display texto-1 text-crema-100">{titulo}</h3>
                <p className="mt-1.5 texto--1 leading-relaxed text-nacar-200/80">{texto}</p>
              </li>
            ))}
          </ul>

          <div className="mt-10">
            <BotonLujo to="/agendar">Reservar con Ignacia</BotonLujo>
          </div>
        </div>
      </div>
    </Section>
  );
}
