import type { ReactNode } from 'react';

/**
 * Ancho de lectura consistente en todo el sitio: 1200px de caja, 20px de
 * margen en móvil y 24px de canaleta en escritorio.
 */
export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1200px] px-5 sm:px-6 ${className}`}>{children}</div>;
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
  tono = 'rosa',
}: HeadingProps) {
  const centrado = align === 'center';
  return (
    <div className={`max-w-2xl ${centrado ? 'mx-auto text-center' : 'text-left'}`}>
      {eyebrow && (
        <p
          className={`texto--1 font-medium uppercase espaciado-amplio ${
            tono === 'oro' ? 'text-dorado-400' : 'text-rosa-300'
          }`}
        >
          {eyebrow}
        </p>
      )}

      {/* Regla fina bajo el rótulo: el separador del sistema, en vez de peso. */}
      {eyebrow && (
        <div
          aria-hidden="true"
          className={`${tono === 'oro' ? 'linea-oro' : 'linea-rosa'} mb-6 mt-4 w-10 border-t ${centrado ? 'mx-auto' : ''}`}
        />
      )}

      <Tag className={`${Tag === 'h1' ? 'texto-5' : 'texto-4'} text-crema-100`}>
        {title}
      </Tag>

      {subtitle && <p className="mt-4 texto-1 leading-relaxed text-nacar-200/80">{subtitle}</p>}
    </div>
  );
}
