import { BrowserRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom';
import { Component, useEffect, type ReactNode } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BotonWhatsApp from './components/ui/BotonWhatsApp';
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import BookingPage from './pages/BookingPage';
import ConfirmationPage from './pages/ConfirmationPage';
import AdminPage from './pages/AdminPage';
import ReschedulePage from './pages/ReschedulePage';

/** Sin esto, al navegar entre páginas el scroll se queda donde estaba. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="texto-5 font-display text-crema-100">404</p>
      <p className="mt-3 texto-1 text-nacar-200/80">Esta página no existe</p>
      <Link
        to="/"
        className="brillo brillo-hover mt-8 inline-flex items-center rounded-[var(--radius-suave)] bg-rosa-300 px-7 py-3.5 texto--1 font-medium uppercase espaciado-medio text-vino-900 transition-all duration-300 hover:bg-rosa-200 active:scale-[0.98]"
      >
        Volver al inicio
      </Link>
    </div>
  );
}

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
          <p className="texto-3 font-display text-crema-100">Algo salió mal</p>
          <p className="mt-3 texto-0 text-nacar-200/80">Intenta recargar la página.</p>
          <button
            onClick={() => window.location.reload()}
            className="brillo brillo-hover mt-8 inline-flex items-center rounded-[var(--radius-suave)] bg-rosa-300 px-7 py-3.5 texto--1 font-medium uppercase espaciado-medio text-vino-900 transition-all duration-300 hover:bg-rosa-200 active:scale-[0.98]"
          >
            Recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function Layout() {
  const { pathname } = useLocation();
  /*
   * El panel trae su propia barra lateral, su propia cabecera y su propio
   * ancho: la cáscara pública se le montaba encima. La barra superior quedaba
   * flotando sobre las métricas y el pie del sitio aparecía dentro del panel,
   * con el contenido pasando por debajo de la barra lateral.
   */
  const esPanel = pathname.startsWith('/admin');

  return (
    <div className="flex min-h-screen flex-col bg-tinta-900">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-tinta-900 focus:px-5 focus:py-3 focus:text-crema-100"
      >
        Saltar al contenido
      </a>

      {!esPanel && <Navbar />}

      <main id="contenido" className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/servicios" element={<ServicesPage />} />
          <Route path="/agendar" element={<BookingPage />} />
          <Route path="/confirmacion" element={<ConfirmationPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/reagendar" element={<ReschedulePage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {!esPanel && <Footer />}

      <BotonWhatsApp />
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
