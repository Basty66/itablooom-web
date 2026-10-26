import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import { desplazarA } from '../../lib/scroll-suave';

/** Rutas sin botón: el agendador ya tiene su barra fija ocupando ese rincón. */
const RUTAS_OCULTAS = ['/agendar'];

/** Rutas donde convive con el botón de WhatsApp y hay que dejarle su sitio. */
const RUTAS_CON_WHATSAPP = ['/', '/servicios', '/confirmacion'];

/**
 * Vuelta al inicio de la página.
 *
 * El inicio mide más de ocho pantallas y el catálogo cerca de tres: sin esto,
 * volver al menú desde el pie es un arrastre largo con el pulgar.
 *
 * Aparece recién pasadas dos pantallas, que es cuando el gesto empieza a
 * doler; antes solo sería un botón tapando contenido.
 */
export default function BotonSubir() {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const alScrollear = () => setVisible(window.scrollY > window.innerHeight * 2);
    alScrollear();
    window.addEventListener('scroll', alScrollear, { passive: true });
    return () => window.removeEventListener('scroll', alScrollear);
  }, []);

  if (RUTAS_OCULTAS.some((r) => pathname.startsWith(r))) return null;

  // Cuando el de WhatsApp está en pantalla, este se apila encima.
  const conWhatsApp = RUTAS_CON_WHATSAPP.includes(pathname);
  const alto = conWhatsApp ? 'bottom-20 sm:bottom-28' : 'bottom-5 sm:bottom-8';

  function subir() {
    const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    desplazarA(0, { inmediato: !suave });
  }

  return (
    <button
      type="button"
      onClick={subir}
      aria-label="Volver arriba"
      /* Más chico que el de WhatsApp y centrado sobre él: es la acción
         secundaria de las dos. */
      className={`vidrio fixed right-[1.125rem] z-40 flex h-11 w-11 items-center justify-center rounded-full text-cobre-200 transition-all duration-500 ease-out hover:text-crema-100 active:scale-95 sm:right-[2.125rem] sm:h-12 sm:w-12 ${alto} ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      <span aria-hidden="true" className="canto-metal absolute inset-0 rounded-full" />
      <ArrowUp size={18} strokeWidth={1.5} aria-hidden="true" />
    </button>
  );
}
