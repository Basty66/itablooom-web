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
  // El ritmo del sistema: 80px en móvil, 120px en escritorio.
  const alto = espaciado === 'amplio' ? 'ritmo md:py-32' : 'ritmo';
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
  /** El rosa marca las secciones cálidas; el oro, las de negocio. */
  tono?: 'oro' | 'rosa';
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  as: Tag = 'h2',
  align = 'center',
  tono = 'oro',
}: HeadingProps) {
  const centrado = align === 'center';
  return (
    <div className={`max-w-2xl ${centrado ? 'mx-auto text-center' : 'text-left'}`}>
      {eyebrow && (
        <p className={`texto--1 uppercase espaciado-amplio ${tono === 'rosa' ? 'text-rosa-300' : 'text-dorado-300'}`}>{eyebrow}</p>
      )}

      {/* Regla fina bajo el rótulo: el separador del sistema, en vez de peso. */}
      {eyebrow && (
        <div
          aria-hidden="true"
          className={`${tono === 'rosa' ? 'linea-rosa' : 'linea-oro'} mb-7 mt-5 w-12 border-t ${centrado ? 'mx-auto' : ''}`}
        />
      )}

      <Tag className={`${Tag === 'h1' ? 'texto-4' : 'texto-3'} leading-tight text-crema-100`}>
        {title}
      </Tag>

      {subtitle && <p className="mt-5 texto-0 leading-relaxed text-crema-100/70">{subtitle}</p>}
    </div>
  );
}
