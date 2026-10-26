import { Link } from 'react-router-dom';
import { ArrowUpRight, type LucideIcon } from 'lucide-react';

interface Props {
  children: string;
  /** Ruta interna. */
  to?: string;
  /** Enlace externo: abre en otra pestaña. */
  href?: string;
  /** `metal` es la acción principal; `vidrio`, la que la acompaña. */
  variante?: 'metal' | 'vidrio';
  tamano?: 'sm' | 'lg';
  /** Ícono al inicio, solo para `vidrio`: el metal lleva su flecha. */
  icono?: LucideIcon;
  className?: string;
}

const EASE = 'ease-[cubic-bezier(0.16,1,0.3,1)]';

/**
 * Botón píldora para los llamados importantes de la portada.
 *
 * Al pasar el cursor el texto rueda —sale hacia arriba y la misma palabra
 * entra desde abajo— y la flecha se intercambia dentro de su círculo. En
 * el teléfono no hay "pasar el cursor": ahí responde al toque achicándose
 * apenas, que es la confirmación que el dedo espera.
 */
export default function BotonLujo({
  children,
  to,
  href,
  variante = 'metal',
  tamano = 'lg',
  icono: Icono,
  className = '',
}: Props) {
  const metal = variante === 'metal';
  const chico = tamano === 'sm';

  const clases =
    `group/boton relative isolate inline-flex items-center justify-center gap-3 overflow-hidden rounded-full ` +
    `texto--1 font-medium uppercase espaciado-medio transition-[transform,box-shadow] duration-500 ${EASE} ` +
    `active:scale-[0.97] ` +
    (metal
      ? `boton-metal text-vino-900 ${chico ? 'py-1.5 pl-5 pr-1.5' : 'py-2 pl-7 pr-2'} `
      : `vidrio canto-metal border-transparent text-crema-100 ${chico ? 'px-5 py-2.5' : 'px-7 py-4'} `) +
    className;

  const contenido = (
    <>
      {!metal && Icono && <Icono size={17} strokeWidth={1.5} aria-hidden="true" className="text-cobre-200" />}

      {/* Texto que rueda: la copia de abajo es decorativa. */}
      <span className="relative block overflow-hidden py-0.5">
        <span className={`block transition-transform duration-500 ${EASE} group-hover/boton:-translate-y-full`}>
          {children}
        </span>
        <span
          aria-hidden="true"
          className={`absolute inset-0 block translate-y-full py-0.5 transition-transform duration-500 ${EASE} group-hover/boton:translate-y-0`}
        >
          {children}
        </span>
      </span>

      {metal && (
        <span
          aria-hidden="true"
          className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-vino-900 text-rosa-100 ${
            chico ? 'h-8 w-8' : 'h-11 w-11'
          }`}
        >
          <ArrowUpRight
            size={chico ? 15 : 18}
            strokeWidth={1.6}
            className={`transition-transform duration-500 ${EASE} group-hover/boton:-translate-y-6 group-hover/boton:translate-x-6`}
          />
          <ArrowUpRight
            size={chico ? 15 : 18}
            strokeWidth={1.6}
            className={`absolute -translate-x-6 translate-y-6 transition-transform duration-500 ${EASE} group-hover/boton:translate-x-0 group-hover/boton:translate-y-0`}
          />
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={clases}>
        {contenido}
      </a>
    );
  }
  return (
    <Link to={to ?? '/'} className={clases}>
      {contenido}
    </Link>
  );
}
