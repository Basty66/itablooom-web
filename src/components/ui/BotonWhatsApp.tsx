import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { linkWhatsApp } from '../../lib/contacto';

/** Rutas donde estorbaría: el agendador ya tiene su barra fija abajo. */
const RUTAS_OCULTAS = ['/agendar', '/reagendar'];

/**
 * Acceso directo a WhatsApp, flotando sobre el contenido.
 *
 * En este rubro la consulta previa suele ir por ahí —qué color, cuánto dura,
 * si alcanza hoy— y tenerlo solo en el pie obligaba a recorrer la página
 * entera para preguntar.
 *
 * Aparece recién después del hero: sobre la primera pantalla competiría con
 * los botones de reservar, que son la acción que el sitio quiere.
 */
export default function BotonWhatsApp() {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const alScrollear = () => setVisible(window.scrollY > window.innerHeight * 0.6);
    alScrollear();
    window.addEventListener('scroll', alScrollear, { passive: true });
    return () => window.removeEventListener('scroll', alScrollear);
  }, []);

  if (RUTAS_OCULTAS.some((r) => pathname.startsWith(r))) return null;

  return (
    <a
      href={linkWhatsApp('Hola! Quiero consultar por un servicio')}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Consultar por WhatsApp"
      className={`vidrio fixed bottom-5 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full text-cobre-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)] transition-all duration-500 ease-out hover:text-crema-100 active:scale-95 sm:bottom-8 sm:right-8 sm:h-14 sm:w-14 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      <span aria-hidden="true" className="canto-metal activo absolute inset-0 rounded-full" />
      <MessageCircle size={20} strokeWidth={1.5} aria-hidden="true" />
    </a>
  );
}
