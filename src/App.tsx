import { BrowserRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom';
import { Component, useEffect, type ReactNode } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BotonWhatsApp from './components/ui/BotonWhatsApp';
import BotonSubir from './components/ui/BotonSubir';
import BotonLujo from './components/ui/BotonLujo';
import PantallaEstado from './components/PantallaEstado';
import { linkWhatsApp } from './lib/contacto';
import { Sparkles, RefreshCw, MessageCircle } from 'lucide-react';
import { useScrollSuave, desplazarA } from './lib/scroll-suave';
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import BookingPage from './pages/BookingPage';
import ConfirmationPage from './pages/ConfirmationPage';
import ReschedulePage from './pages/ReschedulePage';

/** Sin esto, al navegar entre páginas el scroll se queda donde estaba. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    desplazarA(0, { inmediato: true });
  }, [pathname]);
  return null;
}

/**
 * Página que no existe. Con humor de la casa y tres salidas a la vista: una
 * dirección rota no tiene por qué ser el final de la visita.
 */
function NotFound() {
  return (
    <PantallaEstado
      codigo="404"
      rotulo="Página no encontrada"
      titulo="Esta página se fue a hacer las"
      acento="uñas."
      texto="La dirección no existe o cambió. Tu próxima cita, en cambio, sí te está esperando."
      extra={
        <>
          <Link to="/agendar" className="py-2 transition-colors hover:text-crema-100">
            Agendar hora
          </Link>
          <a href={linkWhatsApp('Hola! Llegué a una página que no existe')} target="_blank" rel="noopener noreferrer" className="py-2 transition-colors hover:text-crema-100">
            WhatsApp
          </a>
        </>
      }
    >
      <BotonLujo to="/">Volver al inicio</BotonLujo>
      <BotonLujo to="/servicios" variante="vidrio" icono={Sparkles}>
        Ver servicios
      </BotonLujo>
    </PantallaEstado>
  );
}

/**
 * Si algo de la página se cae, se muestra esto en vez de una pantalla en
 * blanco. El error es del sitio, no de la clienta, y el mensaje lo dice.
 */
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <PantallaEstado
          icono={RefreshCw}
          rotulo="Algo no cargó bien"
          titulo="Fue un error"
          acento="nuestro."
          texto="No es nada que hayas hecho tú. Recarga la página; si se repite, escríbenos y te agendamos por WhatsApp."
        >
          <BotonLujo onClick={() => window.location.reload()}>Recargar</BotonLujo>
          <BotonLujo href={linkWhatsApp('Hola! La página me dio un error')} variante="vidrio" icono={MessageCircle}>
            Escríbenos
          </BotonLujo>
        </PantallaEstado>
      );
    }
    return this.props.children;
  }
}

function Layout() {
  const { pathname } = useLocation();
  useScrollSuave(true);

  return (
    <div className="flex min-h-screen flex-col bg-tinta-900">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-tinta-900 focus:px-5 focus:py-3 focus:text-crema-100"
      >
        Saltar al contenido
      </a>

      <Navbar />

      {/*
        La clave por ruta remonta el contenido en cada navegación, que es lo
        que hace correr la aparición de nuevo. Va en el propio <main> para no
        agregar un nodo de más.

        La animación es solo de opacidad, a propósito: un `transform` acá
        convertiría a <main> en el contenedor de referencia de todo lo que
        tenga `position: fixed` adentro —los botones flotantes, el panel del
        menú— y dejarían de anclarse a la pantalla.
      */}
      <main id="contenido" key={pathname} className="anim-pagina flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/servicios" element={<ServicesPage />} />
          <Route path="/agendar" element={<BookingPage />} />
          <Route path="/confirmacion" element={<ConfirmationPage />} />
          <Route path="/reagendar" element={<ReschedulePage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />

      <BotonWhatsApp />
      <BotonSubir />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <ErrorBoundary>
        <Layout />
      </ErrorBoundary>
    </Router>
  );
}
