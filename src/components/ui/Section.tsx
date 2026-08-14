import type { ReactNode } from 'react';

/** Ancho de lectura consistente en todo el sitio. */
export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-5 sm:px-8 ${className}`}>{children}</div>;
}

interface SectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
  /** Ritmo vertical: `normal` para secciones de contenido, `amplio` para cierres. */
  espaciado?: 'normal' | 'amplio';
}

export function Section({ children, className = '', id, espaciado = 'normal' }: SectionProps) {
  const alto = espaciado === 'amplio' ? 'py-20 md:py-28' : 'py-16 md:py-24';
  return (
    <section id={id} className={`${alto} ${className}`}>
      <Container>{children}</Container>
    </section>
  );
}

interface HeadingProps {
  /** Línea corta sobre el título; ubica la sección sin robarle jerarquía. */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  as?: 'h1' | 'h2';
  align?: 'left' | 'center';
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  as: Tag = 'h2',
  align = 'center',
}: HeadingProps) {
  const alineacion = align === 'center' ? 'text-center mx-auto' : 'text-left';
  return (
    <div className={`max-w-2xl ${alineacion}`}>
      {eyebrow && (
        <p className="texto--1 mb-3 font-medium uppercase tracking-[0.2em] text-rosa-600">{eyebrow}</p>
      )}
      <Tag className={`${Tag === 'h1' ? 'texto-5' : 'texto-3'} text-tinta-900`}>{title}</Tag>
      {subtitle && <p className="mt-4 text-tinta-600">{subtitle}</p>}
    </div>
  );
}
