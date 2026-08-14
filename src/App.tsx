import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
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

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="flex min-h-screen flex-col bg-crema-100">
        {/* Salto directo al contenido: primer tab de quien navega con teclado. */}
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
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}
