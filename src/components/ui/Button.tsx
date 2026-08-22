import { Link } from 'react-router-dom';
import type { ReactNode, ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'lujo';
type Size = 'sm' | 'md' | 'lg';

/*
 * El canto vivo se veía editorial pero rígido: un radio contenido moderniza
 * sin volver a las cajas del sistema anterior. La sombra solo aparece en
 * hover, para que el botón se despegue al tocarlo y no antes.
 */
const VARIANTES: Record<Variant, string> = {
  /*
   * Relleno rosa claro con la letra en vino: es la pareja que define el
   * sistema y mide 7.71:1. Antes usaba un rosa oscurecido con letra crema
   * porque el rosa claro parecía necesitar texto oscuro "de advertencia";
   * el vino resuelve eso y además contrasta casi el doble.
   */
  primary:
    'brillo bg-rosa-300 text-vino-900 sombra-sutil ' +
    'brillo-hover hover:bg-rosa-200 hover:sombra-hover hover:-translate-y-0.5',
  /* Secundario del sistema: fantasma con canto y letra de oro. */
  secondary:
    'border border-dorado-400/55 text-dorado-300 ' +
    'hover:border-dorado-400 hover:bg-dorado-400/10 hover:-translate-y-0.5',
  outline:
    'border border-crema-100/20 text-crema-100 ' +
    'hover:border-rosa-300/60 hover:bg-crema-100/5 hover:-translate-y-0.5',
  ghost: 'text-nacar-200/80 hover:text-crema-100 hover:bg-crema-100/8',
  /* Máximo contraste sobre el fondo oscuro: se reserva para el CTA principal. */
  lujo:
    'brillo bg-crema-100 text-tinta-900 sombra-sutil ' +
    'hover:bg-crema-50 hover:sombra-hover hover:-translate-y-0.5',
};

/** Botones anchos y bajos: el aire horizontal es parte del gesto editorial. */
/* Botones anchos: el diseño usa px-12 py-4 en los principales. El ancho es
   parte del gesto de lujo; apretados se ven de formulario. */
const TAMANOS: Record<Size, string> = {
  sm: 'px-6 py-2.5 gap-2',
  md: 'px-8 py-3.5 gap-2.5',
  lg: 'px-12 py-4 gap-3',
};

const BASE =
  'relative overflow-hidden rounded-[var(--radius-suave)] ' +
  'inline-flex items-center justify-center texto--1 font-medium uppercase espaciado-medio ' +
  'transition-all duration-300 ease-out active:scale-[0.98] active:translate-y-0 ' +
  'disabled:opacity-40 disabled:pointer-events-none disabled:hover:translate-y-0';

interface BaseProps {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
}

interface AsButton extends BaseProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> {
  to?: never;
  href?: never;
}

interface AsLink extends BaseProps {
  /** Ruta interna: renderiza un <Link> de react-router. */
  to: string;
  href?: never;
}

interface AsAnchor extends BaseProps {
  /** URL externa: renderiza un <a> con rel de seguridad. */
  href: string;
  to?: never;
}

type ButtonProps = AsButton | AsLink | AsAnchor;

/**
 * Un único botón para todo el sitio. Antes cada página repetía sus clases,
 * así que los estados de hover/focus/disabled no coincidían entre pantallas.
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const clases = `${BASE} ${VARIANTES[variant]} ${TAMANOS[size]} ${className}`;

  if ('to' in props && props.to) {
    const { to, ...resto } = props as AsLink;
    return (
      <Link to={to} className={clases} {...resto}>
        {children}
      </Link>
    );
  }

  if ('href' in props && props.href) {
    const { href, ...resto } = props as AsAnchor;
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={clases} {...resto}>
        {children}
      </a>
    );
  }

  return (
    <button className={clases} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
