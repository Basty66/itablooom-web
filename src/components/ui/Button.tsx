import { Link } from 'react-router-dom';
import type { ReactNode, ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const VARIANTES: Record<Variant, string> = {
  primary: 'bg-tinta-900 text-crema-100 hover:bg-tinta-800 shadow-sm hover:shadow-md',
  secondary: 'bg-rosa-300 text-tinta-900 hover:bg-rosa-400 shadow-sm hover:shadow-md',
  outline: 'border border-tinta-900/25 text-tinta-900 hover:border-tinta-900 hover:bg-tinta-900/5',
  ghost: 'text-tinta-700 hover:text-tinta-900 hover:bg-tinta-900/5',
};

const TAMANOS: Record<Size, string> = {
  sm: 'px-4 py-2 texto--1 gap-1.5',
  md: 'px-6 py-3 texto-0 gap-2',
  lg: 'px-8 py-4 texto-0 gap-2.5',
};

const BASE =
  'inline-flex items-center justify-center rounded-full font-medium tracking-wide ' +
  'transition-all duration-200 ease-out active:scale-95 ' +
  'disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none';

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
    <button type="button" className={clases} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
