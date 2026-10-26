import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ShieldCheck, CreditCard, HeartHandshake, Sparkles } from 'lucide-react';
import { Container } from '../ui/Section';
import BotonLujo from '../ui/BotonLujo';
import Magnetico from '../ui/Magnetico';
import PolvoDorado from '../ui/PolvoDorado';
import { CIUDAD } from '../../lib/contacto';

/**
 * Los tres rubros del estudio, cada uno con su video corto.
 *
 * Los videos salen de los reels propios: recortados a 3:4 para sacar los
 * textos de Instagram, en cámara lenta, de ida y vuelta para que el loop no
 * tenga corte, y con el color entibiado hacia la paleta. Pesan entre 250 y
 * 520 KB y solo se descarga el que está a la vista.
 */
const RUBROS = [
  {
    id: 'facial',
    nombre: 'Uñas',
    palabra: 'uñas',
    video: 'unas',
    alt: 'Manos con uñas color carey, recién terminadas en el estudio',
  },
  {
    id: 'laser',
    nombre: 'Pestañas',
    palabra: 'pestañas',
    video: 'pestanas',
    alt: 'Extensión de pestañas pelo a pelo, con pinza, en primer plano',
  },
  {
    id: 'course',
    nombre: 'Cejas',
    palabra: 'cejas',
    video: 'cejas',
    alt: 'Clienta con las cejas recién diseñadas',
  },
] as const;

/** Lo que dura cada rubro a la vista antes de pasar al siguiente. */
const DURACION_MS = 6500;

/** Lo que corre por la cinta del pie: el menú dicho de corrido. */
const CINTA = [
  'Esmaltado permanente',
  'Soft Gel',
  'Builder Gel',
  'Pestañas clásicas',
  'Efecto rímel',
  'Pestañas wispy',
  'Laminado de cejas',
  'Diseño de cejas',
];

/** Lo que hace distinto al estudio, en tres líneas verificables. */
const CONFIANZA = [
  { icono: ShieldCheck, texto: 'Garantía de 72 horas' },
  { icono: CreditCard, texto: 'Pago seguro con Mercado Pago' },
  { icono: HeartHandshake, texto: 'Una clienta a la vez' },
];

/**
 * Gradiente de oro rosa para los destellos, definido una sola vez. Va en un
 * SVG de tamaño cero y no con `display: none`: oculto así, Firefox deja de
 * pintar los gradientes que otros SVG toman prestados.
 */
function DefinicionesMetal() {
  return (
    <svg aria-hidden="true" width="0" height="0" className="absolute">
      <defs>
        <linearGradient id="chispa-metal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff3ec" />
          <stop offset="0.45" stopColor="#f2c7b6" />
          <stop offset="0.55" stopColor="#b9705e" />
          <stop offset="1" stopColor="#fbe0d4" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const TRAZO_CHISPA = 'M12 0C12.9 7.6 16.4 11.1 24 12 16.4 12.9 12.9 16.4 12 24 11.1 16.4 7.6 12.9 0 12 7.6 11.1 11.1 7.6 12 0Z';

/** Destello de cuatro puntas: la estrella de las uñas de la foto principal. */
function Chispa({
  className = '',
  style,
  metal = false,
}: {
  className?: string;
  style?: CSSProperties;
  metal?: boolean;
}) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} style={style}>
      <path fill={metal ? 'url(#chispa-metal)' : 'currentColor'} d={TRAZO_CHISPA} />
    </svg>
  );
}

/**
 * Una palabra del titular: letras que entran una a una y, encima, la misma
 * palabra en lámina de metal que se enciende cuando terminan de llegar.
 *
 * Los lectores de pantalla no ven ninguna de las dos: deletrearían
 * "G, o, d…". El nombre completo va aparte, en texto oculto del <h1>.
 */
function PalabraMetal({
  texto,
  desde = 0,
  metal,
  encendido,
  reflejo,
  className = '',
}: {
  texto: string;
  desde?: number;
  metal: 'metal-champan' | 'metal-oro-rosa';
  /** Cuándo aparece el metal y cuándo pasa el primer reflejo. */
  encendido: string;
  reflejo: string;
  className?: string;
}) {
  return (
    <span aria-hidden="true" className={`relative w-fit whitespace-nowrap ${className}`}>
      {[...texto].map((letra, i) => (
        <span key={i} className="letra" style={{ '--i': desde + i } as CSSProperties}>
          {letra}
        </span>
      ))}
      <span
        className={`metal-capa ${metal} pointer-events-none absolute`}
        style={{ '--encendido': encendido, '--reflejo': reflejo } as CSSProperties}
      >
        {texto}
      </span>
    </span>
  );
}

/** Clase de cada lámina según si entra, sale o espera. */
function estadoLamina(indice: number, actual: number, anterior: number | null) {
  if (indice === actual) return 'lamina activa';
  if (indice === anterior) return 'lamina saliente';
  return 'lamina';
}

interface ArcoProps {
  /** Posición y ancho dentro de la escena, en porcentajes. */
  className: string;
  /** Cuánto se mueve con el puntero y el scroll; más alto, más cerca. */
  profundidad: number;
  retraso: number;
  /** Las fotos chicas van sobre la grande: el anillo oscuro las recorta. */
  enmarcada?: boolean;
  /** Lo que va fuera del arco: filetes y etiquetas. */
  adorno?: ReactNode;
  /** Si el arco es un botón: qué hace y cómo se anuncia. */
  alElegir?: () => void;
  etiqueta?: string;
  children: ReactNode;
}

function Arco({
  className,
  profundidad,
  retraso,
  enmarcada = false,
  adorno,
  alElegir,
  etiqueta,
  children,
}: ArcoProps) {
  const clasesFoto = `arco-forma arco-velo relative block aspect-[3/4] w-full overflow-hidden bg-tinta-850 ${
    enmarcada ? 'ring-[3px] ring-tinta-900' : ''
  }`;

  return (
    <div className={`capa absolute ${className}`} style={{ '--prof': profundidad } as CSSProperties}>
      {adorno}
      {/*
        Canto de metal con la luz girando. En las fotos chicas el anillo
        oscuro de la foto tapa la parte interior del relleno: queda metal
        afuera, una franja negra y recién la foto, que así se recorta limpia
        sobre la grande.
      */}
      <div
        className={`arco-forma arco-entrada relative ${enmarcada ? 'p-[5px]' : 'p-[1.5px]'}`}
        style={{ animationDelay: `${retraso}ms` }}
      >
        <span aria-hidden="true" className="arco-forma marco-metal" />
        {alElegir ? (
          <button
            type="button"
            onClick={alElegir}
            aria-label={etiqueta}
            className={`${clasesFoto} group/arco cursor-pointer transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.03] active:scale-[0.98]`}
          >
            {children}
          </button>
        ) : (
          <div className={clasesFoto}>{children}</div>
        )}
      </div>
    </div>
  );
}

/**
 * Portada: el nombre en grande y, al lado, un escaparate vivo del estudio.
 *
 * El arco grande pasa por los tres rubros con video real; los dos chicos
 * muestran los otros dos y al tocarlos pasan a primer plano. El selector de
 * abajo hace lo mismo y marca con una barra cuánto falta para el siguiente.
 *
 * En móvil la escena va debajo del texto: los botones siguen en la primera
 * pantalla y el escaparate asoma abajo invitando a bajar.
 */
export default function Hero() {
  const escena = useRef<HTMLElement>(null);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const [{ actual, anterior }, setRubro] = useState<{ actual: number; anterior: number | null }>({
    actual: 0,
    anterior: null,
  });
  const [enPantalla, setEnPantalla] = useState(true);
  const [enPausa, setEnPausa] = useState(false);
  /*
   * Quien pidió menos movimiento no recibe cambios solos ni videos; quien
   * activó el ahorro de datos, tampoco videos: ve las fotos fijas de cada
   * rubro, que pesan quince veces menos.
   */
  const [movimiento, setMovimiento] = useState(true);
  const [conVideo, setConVideo] = useState(true);

  useEffect(() => {
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ahorro = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    setMovimiento(!reducido);
    setConVideo(!reducido && !ahorro);
  }, []);

  function elegir(indice: number) {
    setRubro((previo) => (previo.actual === indice ? previo : { actual: indice, anterior: previo.actual }));
  }
  const avanzar = () => elegir((actual + 1) % RUBROS.length);

  /* Solo corre el video del rubro a la vista, y solo con el hero en pantalla. */
  useEffect(() => {
    videos.current.forEach((video, i) => {
      if (!video) return;
      if (i === actual && enPantalla && conVideo) video.play().catch(() => {});
      else video.pause();
    });
  }, [actual, enPantalla, conVideo]);

  useEffect(() => {
    const el = escena.current;
    if (!el) return;
    const observador = new IntersectionObserver(([e]) => setEnPantalla(e.isIntersecting), { threshold: 0.15 });
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  /*
   * Parallax del puntero. Se persigue la posición del mouse con un poco de
   * inercia (cada cuadro recorre el 7% de lo que falta) y se publica como
   * dos variables CSS; el render de React no se entera. El bucle se apaga
   * solo cuando la escena alcanza al puntero.
   */
  useEffect(() => {
    const el = escena.current;
    if (!el) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let objetivoX = 0;
    let objetivoY = 0;
    let x = 0;
    let y = 0;
    let cuadro = 0;

    const paso = () => {
      x += (objetivoX - x) * 0.07;
      y += (objetivoY - y) * 0.07;
      el.style.setProperty('--px', x.toFixed(4));
      el.style.setProperty('--py', y.toFixed(4));
      cuadro =
        Math.abs(objetivoX - x) + Math.abs(objetivoY - y) > 0.001 ? requestAnimationFrame(paso) : 0;
    };

    const alMover = (e: PointerEvent) => {
      // Con el hero fuera de pantalla no hay nada que mover.
      if (window.scrollY > el.offsetHeight) return;
      objetivoX = (e.clientX / window.innerWidth) * 2 - 1;
      objetivoY = (e.clientY / window.innerHeight) * 2 - 1;
      if (!cuadro) cuadro = requestAnimationFrame(paso);
    };

    window.addEventListener('pointermove', alMover, { passive: true });
    return () => {
      window.removeEventListener('pointermove', alMover);
      cancelAnimationFrame(cuadro);
    };
  }, []);

  const rubro = RUBROS[actual];
  /* Los arcos chicos muestran siempre los otros dos rubros. */
  const enB = (k: number) => (k + 1) % RUBROS.length;
  const enC = (k: number) => (k + 2) % RUBROS.length;
  const detenido = enPausa || !enPantalla;

  return (
    <section
      ref={escena}
      className="textura-papel relative isolate flex flex-col overflow-hidden bg-tinta-900 md:min-h-[calc(100svh-4.5rem)]"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <span className="aura aura-vino" />
        <span className="aura aura-rosa" />
        <span className="aura aura-cobre" />
        <span className="haz-luz" />
        <span className="foco-puntero" />
        <PolvoDorado className="absolute inset-0 h-full w-full" />
      </div>
      <DefinicionesMetal />

      <Container className="relative grid flex-1 items-center gap-14 pb-14 pt-12 sm:pt-16 md:grid-cols-12 md:gap-6 md:py-12">
        <div className="heroe-texto md:col-span-7">
          {/* Rótulo con la palabra del rubro a la vista, que rueda junto
              con el escaparate. */}
          <div className="anim-entrada flex items-center gap-3" style={{ animationDelay: '60ms' }}>
            <span
              aria-hidden="true"
              className="filete-entrada h-px w-10 bg-gradient-to-r from-cobre-600 via-cobre-100 to-cobre-400"
            />
            <p className="texto--1 uppercase espaciado-amplio text-rosa-300">
              Especialistas en{' '}
              <span className="relative inline-grid overflow-hidden align-bottom text-cobre-200">
                {RUBROS.map((r, i) => (
                  <span
                    key={r.id}
                    aria-hidden={i !== actual}
                    className={`rodante ${i === actual ? 'entra' : i === anterior ? 'sale' : 'espera'}`}
                  >
                    {r.palabra}
                  </span>
                ))}
              </span>
            </p>
          </div>

          {/*
            Sin kerning a propósito: las letras animadas van cada una en su
            caja y no se ajustan entre sí, y la lámina de metal tiene que
            calzarles encima letra por letra.

            El tamaño también mira el alto: en una notebook de 650px el
            titular a puro ancho dejaba los botones bajo el pliegue.
          */}
          <h1 className="mt-6 flex flex-col text-[clamp(4.5rem,min(14vw,21svh),10.5rem)] leading-[0.88] text-crema-100 [font-kerning:none] sm:mt-8">
            <span className="sr-only">Goddess Studio</span>
            <PalabraMetal texto="Goddess" metal="metal-champan" encendido="1.45s" reflejo="2.4s" />
            {/* Corrido a la derecha, como en el logo: rompe el bloque y
                hace que el nombre respire. */}
            <PalabraMetal
              texto="Studio"
              desde={7}
              metal="metal-oro-rosa"
              encendido="1.75s"
              reflejo="2.75s"
              className="ml-[0.5em] italic text-rosa-300"
            />
          </h1>

          <p
            className="anim-entrada mt-8 max-w-[40ch] texto-1 text-nacar-200/90"
            style={{ animationDelay: '700ms' }}
          >
            Esmaltado permanente, extensión de pestañas y diseño de cejas en {CIUDAD}.
            Atención con hora reservada, una clienta a la vez.
          </p>

          <div
            className="anim-entrada mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
            style={{ animationDelay: '820ms' }}
          >
            <Magnetico className="w-full sm:w-auto">
              <BotonLujo to="/agendar" className="w-full sm:w-auto">
                Agendar hora
              </BotonLujo>
            </Magnetico>
            <BotonLujo to="/servicios" variante="vidrio" icono={Sparkles}>
              Ver servicios
            </BotonLujo>
          </div>

          {/* Tres garantías con ícono en vez de una línea suelta: se leen
              de un vistazo y responden la duda antes de que aparezca. */}
          <ul
            className="anim-entrada linea-cobre mt-9 grid max-w-xl grid-cols-3 gap-3 border-t pt-6 sm:gap-6"
            style={{ animationDelay: '950ms' }}
          >
            {CONFIANZA.map(({ icono: Icono, texto }) => (
              <li key={texto} className="flex flex-col items-start gap-2.5 sm:flex-row sm:items-center sm:gap-3">
                <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
                  <span aria-hidden="true" className="pointer-events-none canto-metal activo absolute inset-0 rounded-full" />
                  <Icono size={16} strokeWidth={1.5} className="text-cobre-200" aria-hidden="true" />
                </span>
                <span className="texto--1 leading-snug text-nacar-200/85">{texto}</span>
              </li>
            ))}
          </ul>
        </div>

        {/*
          La escena se mide por ancho y no por alto: todas las piezas van en
          porcentajes de ella, así la composición es la misma en un teléfono y
          en un monitor. El tope en svh evita que en una notebook baja empuje
          la cinta fuera de la primera pantalla.
        */}
        <div
          className="md:col-span-5"
          onPointerEnter={() => setEnPausa(true)}
          onPointerLeave={() => setEnPausa(false)}
          onFocus={() => setEnPausa(true)}
          onBlur={() => setEnPausa(false)}
        >
          <div className="relative mx-auto aspect-[5/6] w-full max-w-[22rem] md:max-w-[min(100%,50svh,500px)]">
            <span aria-hidden="true" className="halo-escena absolute -inset-[12%] -z-10 rounded-full" />

            {/* Arco grande: el video del rubro a la vista. */}
            <Arco
              className="left-[28%] top-[7%] w-[58%]"
              profundidad={1}
              retraso={300}
              adorno={
                <span
                  aria-hidden="true"
                  className="arco-forma aparecer-tarde absolute inset-0 translate-x-3 -translate-y-3 border border-cobre-400/35"
                  style={{ animationDelay: '1300ms' }}
                />
              }
            >
              {RUBROS.map((r, i) => (
                <span key={r.id} className={estadoLamina(i, actual, anterior)}>
                  {conVideo ? (
                    <video
                      ref={(v) => {
                        videos.current[i] = v;
                      }}
                      className="h-full w-full object-cover"
                      poster={`/images/hero/${r.video}-poster.webp`}
                      muted
                      loop
                      playsInline
                      /* Solo el primero se pide al cargar; los demás, cuando
                         les toca. `play()` dispara su descarga. */
                      preload={i === 0 ? 'auto' : 'none'}
                      aria-label={r.alt}
                    >
                      <source src={`/videos/hero/${r.video}.webm`} type="video/webm" />
                      <source src={`/videos/hero/${r.video}.mp4`} type="video/mp4" />
                    </video>
                  ) : (
                    <img
                      src={`/images/hero/${r.video}-poster.webp`}
                      alt={r.alt}
                      width={480}
                      height={640}
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  )}
                </span>
              ))}
            </Arco>

            {/* Arcos chicos: los otros dos rubros, que al tocarlos pasan al
                arco grande. */}
            {[
              { lugar: 'left-0 top-[50%] w-[40%]', prof: 1.8, retraso: 550, posicion: enB },
              { lugar: 'left-[66%] top-[62%] w-[32%]', prof: 2.4, retraso: 720, posicion: enC },
            ].map(({ lugar, prof, retraso, posicion }) => {
              const muestra = RUBROS[posicion(actual)];
              return (
                <Arco
                  key={lugar}
                  className={`${lugar} z-10`}
                  profundidad={prof}
                  retraso={retraso}
                  enmarcada
                  alElegir={() => elegir(posicion(actual))}
                  etiqueta={`Ver ${muestra.nombre.toLowerCase()}`}
                >
                  {RUBROS.map((r, i) => (
                    <span
                      key={r.id}
                      className={estadoLamina(i, posicion(actual), anterior === null ? null : posicion(anterior))}
                    >
                      <img
                        src={`/images/hero/${r.video}-poster.webp`}
                        alt=""
                        width={480}
                        height={640}
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover/arco:scale-105"
                      />
                    </span>
                  ))}
                  <span className="vidrio absolute bottom-2.5 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border px-2.5 py-0.5 texto--2 uppercase espaciado-medio text-nacar-100">
                    {muestra.nombre}
                  </span>
                </Arco>
              );
            })}

            {/* Etiqueta del arco grande: lleva al rubro en el menú. Anclada
                por la derecha, así crece hacia adentro de la escena y no se
                sale de la pantalla con el rubro más largo. */}
            <span className="capa absolute right-0 top-[38%] z-30" style={{ '--prof': 2 } as CSSProperties}>
              <Link
                key={actual}
                to={`/servicios?rubro=${rubro.id}`}
                className="aparecer-tarde vidrio group/etiqueta flex items-center gap-2 whitespace-nowrap rounded-full border py-1.5 pl-3 pr-2 texto--2 uppercase espaciado-medio text-nacar-100 transition-colors duration-300 hover:border-cobre-300/60"
                style={{ animationDelay: anterior === null ? '1700ms' : '250ms' }}
              >
                <Chispa metal className="h-2.5 w-2.5" />
                {rubro.nombre}
                <span className="hidden sm:inline">· trabajo real</span>
                <ArrowUpRight
                  size={13}
                  strokeWidth={1.6}
                  aria-hidden="true"
                  className="transition-transform duration-300 group-hover/etiqueta:rotate-45"
                />
              </Link>
            </span>

            {/*
              Sello que gira sobre el arco principal. Repite el destino del
              botón, así que se saca del orden de tabulación y de los lectores:
              es un atajo para el mouse, no un control más.
            */}
            <span
              className="capa absolute left-[12%] top-[1%] z-20 aspect-square w-[30%]"
              style={{ '--prof': 2.8 } as CSSProperties}
            >
              <Link
                to="/agendar"
                aria-hidden="true"
                tabIndex={-1}
                className="sello group aparecer-tarde absolute inset-0"
                style={{ animationDelay: '1100ms' }}
              >
                <span className="vidrio absolute inset-0 rounded-full border" />
                {/* Dos frases, una por mitad del círculo, separadas por
                    destellos dibujados: un carácter ✦ se ve distinto en cada
                    teléfono, el trazo es siempre el mismo. */}
                <svg viewBox="0 0 120 120" className="sello-giro absolute inset-0 h-full w-full">
                  <defs>
                    <path id="sello-circulo" d="M16,60 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" />
                  </defs>
                  <text className="fill-cobre-100" style={{ fontSize: 9, letterSpacing: '0.2em' }}>
                    <textPath href="#sello-circulo" startOffset="25%" textAnchor="middle">
                      RESERVA ONLINE
                    </textPath>
                  </text>
                  <text className="fill-cobre-100" style={{ fontSize: 9, letterSpacing: '0.2em' }}>
                    <textPath href="#sello-circulo" startOffset="75%" textAnchor="middle">
                      UNA CLIENTA A LA VEZ
                    </textPath>
                  </text>
                  <path d={TRAZO_CHISPA} fill="url(#chispa-metal)" transform="translate(11 55) scale(0.42)" />
                  <path d={TRAZO_CHISPA} fill="url(#chispa-metal)" transform="translate(99 55) scale(0.42)" />
                </svg>
                <span className="boton-metal absolute inset-0 m-auto flex h-[34%] w-[34%] items-center justify-center rounded-full text-vino-900 transition-transform duration-500 ease-out group-hover:rotate-45 group-hover:scale-110">
                  <ArrowUpRight className="h-1/2 w-1/2" strokeWidth={1.5} />
                </span>
              </Link>
            </span>

            {[
              { pos: 'left-[3%] top-[28%] w-[8%]', prof: 3, delay: 1400 },
              { pos: 'left-[90%] top-[4%] w-[5.5%]', prof: 1.4, delay: 1700 },
              { pos: 'left-[47%] top-[90%] w-[4.5%]', prof: 2.2, delay: 2000 },
              { pos: 'left-[93%] top-[50%] w-[3.5%]', prof: 3.4, delay: 2300 },
            ].map(({ pos, prof, delay }) => (
              <span
                key={pos}
                aria-hidden="true"
                className={`capa absolute ${pos}`}
                style={{ '--prof': prof } as CSSProperties}
              >
                <span className="aparecer-tarde chispa-halo block" style={{ animationDelay: `${delay}ms` }}>
                  <Chispa metal className="chispa block w-full" style={{ animationDelay: `${delay}ms` }} />
                </span>
              </span>
            ))}
          </div>

          {/*
            Selector de rubro: una píldora de metal que se desliza a la
            opción elegida. En la activa, una barra marca cuánto falta para
            el cambio; al terminar su animación pasa al siguiente rubro, así
            que pausarla (mouse encima, foco, hero fuera de pantalla) pausa
            también el escaparate.
          */}
          <div
            role="group"
            aria-label="Ver trabajos por rubro"
            className="anim-entrada vidrio relative mx-auto mt-8 grid w-full max-w-[21rem] grid-cols-3 rounded-full border p-1"
            style={{ animationDelay: '1200ms' }}
          >
            <span
              aria-hidden="true"
              className="boton-metal absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-full transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ transform: `translateX(${actual * 100}%)` }}
            />
            {RUBROS.map((r, i) => {
              const activo = i === actual;
              return (
                <button
                  key={r.id}
                  type="button"
                  aria-pressed={activo}
                  onClick={() => elegir(i)}
                  className={`relative z-10 rounded-full px-2 py-2.5 texto--1 font-medium uppercase espaciado-medio transition-colors duration-500 ${
                    activo ? 'text-vino-900' : 'text-nacar-200/80 hover:text-crema-100'
                  }`}
                >
                  {r.nombre}
                  {activo && movimiento && (
                    <span
                      key={actual}
                      aria-hidden="true"
                      onAnimationEnd={avanzar}
                      className="avance absolute bottom-1 left-1/2 h-[1.5px] w-7 -translate-x-1/2 rounded-full bg-vino-900/60"
                      style={
                        {
                          '--duracion': `${DURACION_MS}ms`,
                          animationPlayState: detenido ? 'paused' : 'running',
                        } as CSSProperties
                      }
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </Container>

      {/*
        Cinta de servicios al pie. Es decorativa —el menú real está en la
        sección de servicios—, así que los lectores de pantalla la saltan.
      */}
      <div
        aria-hidden="true"
        className="cinta linea-cobre anim-entrada relative overflow-hidden border-y bg-tinta-950/40 py-4"
        style={{ animationDelay: '1200ms' }}
      >
        <div className="cinta-pista flex w-max">
          {[0, 1].map((copia) => (
            <ul key={copia} className="flex shrink-0 items-center">
              {CINTA.map((servicio) => (
                <li key={servicio} className="flex items-center">
                  {/* El padding vertical deja espacio a la cola itálica:
                      fuera de la caja, el metal no se pinta. */}
                  <span className="texto-metal px-7 py-1 font-display texto-2 italic">{servicio}</span>
                  <Chispa metal className="h-3 w-3" />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
