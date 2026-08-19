import { Link } from 'react-router-dom';
import type { ReactNode, ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

/*
 * Sin sombras ni degradados: en este sistema el peso lo dan el contraste y el
 * espacio, no la profundidad falsa. Esquinas rectas —el pill redondeado leía
 * más "app" que "estudio de belleza"— y línea fina como recurso principal.
 */
const VARIANTES: Record<Variant, string> = {
  primary: 'bg-tinta-900 text-crema-100 hover:bg-tinta-800',
  secondary: 'bg-dorado-400 text-tinta-900 hover:bg-dorado-300',
  outline: 'border border-dorado-400/45 text-tinta-900 hover:border-dorado-500 hover:bg-dorado-100/40',
  ghost: 'text-tinta-700 hover:text-tinta-900',
};

/** Botones anchos y bajos: el aire horizontal es parte del gesto editorial. */
const TAMANOS: Record<Size, string> = {
  sm: 'px-5 py-2.5 gap-2',
  md: 'px-7 py-3 gap-2.5',
  lg: 'px-9 py-4 gap-3',
};

const BASE =
  'inline-flex items-center justify-center texto--1 font-medium uppercase espaciado-medio ' +
  'transition-all duration-300 ease-out active:scale-[0.98] ' +
  'disabled:opacity-40 disabled:pointer-events-none';

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
