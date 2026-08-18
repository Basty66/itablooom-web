import { BrowserRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom';
import { Component, useEffect, type ReactNode } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import BookingPage from './pages/BookingPage';
import ConfirmationPage from './pages/ConfirmationPage';
import AdminPage from './pages/AdminPage';

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
      <p className="texto-5 font-display text-tinta-900">404</p>
      <p className="mt-3 texto-1 text-tinta-600">Esta página no existe</p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center rounded-full bg-tinta-900 px-7 py-3 texto-0 font-medium text-crema-100 transition-all hover:bg-tinta-800 active:scale-95"
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
          <p className="texto-3 font-display text-tinta-900">Algo salió mal</p>
          <p className="mt-3 texto-0 text-tinta-600">Intentá recargar la página.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-8 inline-flex items-center rounded-full bg-tinta-900 px-7 py-3 texto-0 font-medium text-crema-100 transition-all hover:bg-tinta-800 active:scale-95"
          >
            Recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <ErrorBoundary>
        <div className="flex min-h-screen flex-col bg-crema-100">
          <a
            href="#contenido"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-tinta-900 focus:px-5 focus:py-3 focus:text-crema-100"
          >
            Saltar al contenido
          </a>

          <Navbar />

          <main id="contenido" className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/servicios" element={<ServicesPage />} />
              <Route path="/agendar" element={<BookingPage />} />
              <Route path="/confirmacion" element={<ConfirmationPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </ErrorBoundary>
    </Router>
  );
}
