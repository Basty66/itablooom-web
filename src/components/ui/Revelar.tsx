import { useRef, useState, useEffect, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Retraso en ms, para escalonar varios elementos de una misma fila. */
  delay?: number;
  className?: string;
}

/**
 * Revela su contenido cuando entra en pantalla.
 *
 * Las animaciones de entrada se disparaban al montar el componente, así que
 * en una página de ocho pantallas todo lo de abajo terminaba de animarse
 * mientras la clienta seguía leyendo el encabezado: al llegar ya estaba
 * puesto y el gesto se perdía.
 *
 * El contenido arranca visible y solo se oculta si hay soporte para observar
 * la intersección: si algo falla, se ve igual en vez de quedar en blanco.
 */
export default function Revelar({ children, delay = 0, className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    // Quien pidió menos movimiento no recibe el desplazamiento ni la espera.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    setVisible(false);
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisible(true);
          observador.disconnect();
        }
      },
      // El margen negativo abajo evita que dispare con solo el borde asomando.
      { threshold: 0.08, rootMargin: '0px 0px -8% 0px' }
    );
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  /*
   * Las dos clases no son decorativas: `revelador` marca el territorio y
   * `revelado` avisa que ya entró. El CSS las usa para retener las animaciones
   * de entrada que viven adentro, que si no se gastarían al cargar la página
   * —mientras la clienta sigue leyendo el encabezado— y al llegar acá ya
   * estarían puestas.
   */
  return (
    <div
      ref={ref}
      className={`revelador ${visible ? 'revelado' : ''} ${className}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(1.5rem)',
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
