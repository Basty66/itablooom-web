import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import Emblema from './ui/Emblema';
import PolvoDorado from './ui/PolvoDorado';

interface Props {
  /** Cifra grande dentro del laurel ("404"). Sin ella, va el ícono. */
  codigo?: string;
  icono?: LucideIcon;
  rotulo: string;
  /** El título; `acento` es la parte que va en itálica de metal. */
  titulo: string;
  acento?: string;
  texto: string;
  /** Botones principales. */
  children: ReactNode;
  /** Enlaces chicos bajo los botones. */
  extra?: ReactNode;
}

/**
 * Pantalla completa para lo que no salió como se esperaba: una página que
 * no existe, un error de la app, un pago que no pasó.
 *
 * Es la misma escena del sitio —luz vino, polvo dorado, el laurel— y no una
 * página técnica: quien llega acá tiene que sentir que sigue en el estudio y
 * ver de inmediato por dónde seguir.
 */
export default function PantallaEstado({
  codigo,
  icono: Icono,
  rotulo,
  titulo,
  acento,
  texto,
  children,
  extra,
}: Props) {
  return (
    <section className="luz-vino relative isolate flex min-h-[calc(100svh-4.5rem)] items-center overflow-hidden px-5 py-16">
      <PolvoDorado className="absolute inset-0 -z-10 h-full w-full" />

      <div className="relative mx-auto flex w-full max-w-xl flex-col items-center text-center">
        {codigo ? (
          /* La cifra dentro de la corona de laurel, como una moneda. */
          <div className="anim-velo relative flex aspect-square w-[min(78vw,22rem)] items-center justify-center">
            <Emblema sinLetra className="absolute inset-0 h-full w-full opacity-90" />
            <span className="metal-vivo metal-oro-rosa relative -mt-[6%] px-[0.06em] font-display text-[clamp(4.5rem,22vw,8.5rem)] italic leading-none">
              {codigo}
            </span>
          </div>
        ) : (
          Icono && (
            <span className="anim-velo relative flex h-24 w-24 items-center justify-center rounded-full">
              <Emblema sinLetra className="absolute -inset-6 opacity-60" />
              <span aria-hidden="true" className="pointer-events-none canto-metal activo absolute inset-0 rounded-full" />
              <Icono size={34} strokeWidth={1.3} className="text-cobre-100" aria-hidden="true" />
            </span>
          )
        )}

        <p
          className="anim-entrada mt-8 texto--1 uppercase espaciado-amplio text-rosa-300"
          style={{ animationDelay: '120ms' }}
        >
          {rotulo}
        </p>
        <h1 className="anim-entrada mt-4 font-display texto-4 text-crema-100" style={{ animationDelay: '200ms' }}>
          {titulo}
          {acento && (
            <>
              {' '}
              <span className="texto-metal pr-1 italic">{acento}</span>
            </>
          )}
        </h1>
        <p
          className="anim-entrada mx-auto mt-4 max-w-[42ch] texto-1 leading-relaxed text-nacar-200/85"
          style={{ animationDelay: '280ms' }}
        >
          {texto}
        </p>

        <div
          className="anim-entrada mt-10 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row"
          style={{ animationDelay: '360ms' }}
        >
          {children}
        </div>

        {extra && (
          <div
            className="anim-entrada mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 texto--1 uppercase espaciado-medio text-nacar-300"
            style={{ animationDelay: '440ms' }}
          >
            {extra}
          </div>
        )}
      </div>
    </section>
  );
}
