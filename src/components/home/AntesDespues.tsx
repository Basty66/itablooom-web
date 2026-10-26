import { useState, useEffect, useRef } from 'react';
import { ChevronsLeftRight } from 'lucide-react';
import { Section, SectionHeading } from '../ui/Section';
import BotonLujo from '../ui/BotonLujo';
import { getGaleria, type TrabajoGaleria } from '../../lib/api';

/**
 * Comparador de dos fotos con una manija que se arrastra.
 *
 * Mostrarlas lado a lado obliga a comparar de memoria; superpuestas, el ojo ve
 * el cambio exacto en el mismo punto. La manija es un input de rango real: se
 * arrastra con el dedo, con el mouse y también con las flechas del teclado,
 * que es lo que un div con eventos de puntero no da gratis.
 */
function Comparador({ trabajo }: { trabajo: TrabajoGaleria }) {
  const [pos, setPos] = useState(50);
  const caja = useRef<HTMLDivElement>(null);
  const tocado = useRef(false);

  /*
   * La primera vez que el comparador aparece, la manija se desliza sola a un
   * lado y al otro: sin esa pista, mucha gente no descubre que se arrastra y
   * ve solo una foto partida al medio. Si ya la tocaron, no se mueve sola.
   */
  useEffect(() => {
    const el = caja.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let cuadro = 0;
    const observador = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        observador.disconnect();
        const inicio = performance.now();
        const DURACION = 1800;
        const paso = (t: number) => {
          if (tocado.current) return;
          const p = Math.min((t - inicio) / DURACION, 1);
          // Una onda que va a 72%, vuelve a 28% y se asienta en 50%.
          setPos(50 + Math.sin(p * Math.PI * 2) * 22 * (1 - p * 0.25));
          if (p < 1) cuadro = requestAnimationFrame(paso);
          else setPos(50);
        };
        cuadro = requestAnimationFrame(paso);
      },
      { threshold: 0.6 }
    );
    observador.observe(el);
    return () => {
      observador.disconnect();
      cancelAnimationFrame(cuadro);
    };
  }, []);

  return (
    <figure className="anim-entrada relative">
      <div
        ref={caja}
        className="canto-metal activo group relative aspect-[4/5] select-none overflow-hidden rounded-[2rem] bg-tinta-880 sm:aspect-square"
      >
        {/* El "después" va al fondo y el "antes" se recorta encima: así el
            deslizador descubre el resultado, que es el sentido de la lectura. */}
        <img
          src={trabajo.despues_url}
          alt={`${trabajo.titulo}, después`}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <img
            src={trabajo.antes_url}
            alt={`${trabajo.titulo}, antes`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        </div>

        {/* La línea y la manija son de metal: el único control de la foto
            tiene que verse como algo que se toma y se arrastra. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 w-[2px] -translate-x-1/2 bg-gradient-to-b from-cobre-100/20 via-cobre-100 to-cobre-100/20 shadow-[0_0_16px_rgba(246,220,207,0.55)]"
          style={{ left: `${pos}%` }}
        >
          <span className="boton-metal absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-vino-900 transition-transform duration-300 group-hover:scale-110">
            <ChevronsLeftRight size={20} strokeWidth={1.6} />
          </span>
        </div>

        <span
          aria-hidden="true"
          className="vidrio pointer-events-none absolute left-4 top-4 rounded-full border px-3.5 py-1.5 texto--2 uppercase espaciado-medio text-nacar-100"
        >
          Antes
        </span>
        <span
          aria-hidden="true"
          className="boton-metal pointer-events-none absolute right-4 top-4 rounded-full px-3.5 py-1.5 texto--2 font-medium uppercase espaciado-medio text-vino-900"
        >
          Después
        </span>

        {/*
          `touch-action: pan-y` reparte los gestos: el arrastre vertical
          scrollea la página y el horizontal mueve el comparador. Sin esto, el
          control cubre la foto entera y podría quedarse con el gesto de
          scroll, dejando el dedo trabado al pasar por la galería.
        */}
        <input
          type="range"
          min={0}
          max={100}
          value={pos}
          onChange={(e) => {
            tocado.current = true;
            setPos(Number(e.target.value));
          }}
          onPointerDown={() => {
            tocado.current = true;
          }}
          aria-label={`Comparar antes y después de ${trabajo.titulo}`}
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0 [touch-action:pan-y]"
        />
      </div>
    </figure>
  );
}

/**
 * Antes y después, como vitrina: un comparador grande y, al lado, de qué se
 * trata y cómo pedir ese resultado. Con varios trabajos se eligen con
 * miniaturas en vez de apilarlos en una grilla de comparadores chicos, que
 * con una sola foto dejaba la fila casi vacía y se leía como algo roto.
 */
export default function AntesDespues() {
  const [trabajos, setTrabajos] = useState<TrabajoGaleria[]>([]);
  const [cargado, setCargado] = useState(false);
  const [elegido, setElegido] = useState(0);

  useEffect(() => {
    let vigente = true;
    getGaleria()
      .then((d) => vigente && setTrabajos(d))
      .finally(() => vigente && setCargado(true));
    return () => {
      vigente = false;
    };
  }, []);

  // Sin trabajos publicados la sección no aparece: un titular sobre un hueco
  // vacío se lee como algo roto.
  if (!cargado || trabajos.length === 0) return null;

  const lista = trabajos.slice(0, 8);
  const actual = lista[Math.min(elegido, lista.length - 1)];

  return (
    <Section id="antes-despues" className="bg-tinta-950">
      <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <SectionHeading
            align="left"
            eyebrow="El resultado"
            title="Antes y después"
            destacar="después"
            subtitle="Arrastra la manija sobre la foto y mira el cambio en el mismo punto."
          />

          <div className="linea-cobre mt-8 border-t pt-6">
            {actual.categoria && (
              <p className="texto--2 uppercase espaciado-amplio text-cobre-300">{actual.categoria}</p>
            )}
            <p className="mt-1 font-display texto-3 text-crema-100">{actual.titulo}</p>
          </div>

          {lista.length > 1 && (
            <div role="tablist" aria-label="Elegir trabajo" className="mt-6 flex flex-wrap gap-3">
              {lista.map((t, i) => {
                const activo = t.id === actual.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={activo}
                    aria-label={t.titulo}
                    onClick={() => setElegido(i)}
                    className={`relative h-16 w-16 overflow-hidden rounded-2xl transition-all duration-500 ease-out active:scale-95 ${
                      activo ? 'scale-105' : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={t.despues_url} alt="" loading="lazy" className="h-full w-full object-cover" />
                    <span
                      aria-hidden="true"
                      className={`canto-metal absolute inset-0 rounded-[inherit] ${activo ? 'activo' : ''}`}
                    />
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-9 hidden lg:block">
            <BotonLujo to="/agendar">Quiero este resultado</BotonLujo>
          </div>
        </div>

        <div className="lg:col-span-7">
          <Comparador key={actual.id} trabajo={actual} />
          <div className="mt-8 flex justify-center lg:hidden">
            <BotonLujo to="/agendar">Quiero este resultado</BotonLujo>
          </div>
        </div>
      </div>
    </Section>
  );
}
