import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';

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
  const alto = conWhatsApp ? 'bottom-24 sm:bottom-28' : 'bottom-5 sm:bottom-8';

  function subir() {
    const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: suave ? 'smooth' : 'auto' });
  }

  return (
    <button
      type="button"
      onClick={subir}
      aria-label="Volver arriba"
      className={`vidrio fixed right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-cobre-400/30 text-cobre-300 transition-all duration-500 ease-out hover:border-cobre-400 hover:text-crema-100 active:scale-95 sm:right-8 sm:h-14 sm:w-14 ${alto} ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      <ArrowUp size={20} strokeWidth={1.5} aria-hidden="true" />
    </button>
  );
}
