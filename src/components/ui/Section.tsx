import { Fragment, type CSSProperties, type ReactNode } from 'react';
import Revelar from './Revelar';

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
      {/* Cada sección se revela al entrar en pantalla, en vez de animarse
          toda junta al cargar la página. */}
      <Container>
        <Revelar>{children}</Revelar>
      </Container>
    </section>
  );
}

interface HeadingProps {
  /** Línea corta sobre el título; ubica la sección sin robarle jerarquía. */
  eyebrow?: string;
  title: string;
  /**
   * Palabras del título que van en itálica de oro rosa. Una sola por título:
   * es el acento, y dos ya compiten entre sí.
   */
  destacar?: string;
  subtitle?: string;
  as?: 'h1' | 'h2';
  align?: 'left' | 'center';
  /** El rosa marca las secciones cálidas; el cobre, las de negocio. */
  tono?: 'cobre' | 'rosa';
}

export function SectionHeading({
  eyebrow,
  title,
  destacar,
  subtitle,
  as: Tag = 'h2',
  align = 'center',
  tono = 'rosa',
}: HeadingProps) {
  const centrado = align === 'center';
  const acentos = new Set(destacar?.split(' ') ?? []);
  return (
    <div className={`max-w-2xl ${centrado ? 'mx-auto text-center' : 'text-left'}`}>
      {eyebrow && (
        <p
          className={`texto--1 font-medium uppercase espaciado-amplio ${
            tono === 'cobre' ? 'text-cobre-400' : 'text-rosa-300'
          }`}
        >
          {eyebrow}
        </p>
      )}

      {/* Filete de metal bajo el rótulo: el separador del sistema, que se
          traza cuando la sección aparece. */}
      {eyebrow && (
        <div
          aria-hidden="true"
          className={`filete-entrada mb-6 mt-4 h-px w-10 bg-gradient-to-r from-cobre-600 via-cobre-100 to-cobre-400 ${
            centrado ? 'mx-auto' : ''
          }`}
          /* Centrado crece desde el medio; a la izquierda, desde su borde. */
          style={centrado ? { transformOrigin: 'center' } : undefined}
        />
      )}

      {/*
        Palabra por palabra. Los espacios quedan como texto entre las cajas,
        así el título se sigue leyendo y cortando de renglón como una frase.
      */}
      <Tag className={`${Tag === 'h1' ? 'texto-5' : 'texto-4'} text-crema-100`}>
        {title.split(' ').map((palabra, i) => (
          <Fragment key={i}>
            {i > 0 && ' '}
            <span
              className={`palabra ${acentos.has(palabra) ? 'texto-metal pr-[0.08em] italic' : ''}`}
              style={{ '--i': i } as CSSProperties}
            >
              {palabra}
            </span>
          </Fragment>
        ))}
      </Tag>

      {subtitle && <p className="mt-4 texto-1 leading-relaxed text-nacar-200/80">{subtitle}</p>}
    </div>
  );
}
