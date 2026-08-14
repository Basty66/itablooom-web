import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import Button from './ui/Button';

const LINKS = [
  { path: '/', label: 'Inicio' },
  { path: '/servicios', label: 'Servicios' },
  { path: '/agendar', label: 'Agendar' },
];

export default function Navbar() {
  const [abierto, setAbierto] = useState(false);
  const [conScroll, setConScroll] = useState(false);
  const location = useLocation();

  // Arriba del todo la barra es transparente y se funde con el hero; al bajar
  // aparece el fondo para que el texto no compita con el contenido.
  useEffect(() => {
    const alScrollear = () => setConScroll(window.scrollY > 16);
    alScrollear();
    window.addEventListener('scroll', alScrollear, { passive: true });
    return () => window.removeEventListener('scroll', alScrollear);
  }, []);

  // Cerramos el menú al navegar, si no queda abierto sobre la página nueva.
  useEffect(() => setAbierto(false), [location.pathname]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ease-out ${
        conScroll ? 'border-b border-tinta-900/8 bg-crema-100/85 backdrop-blur-md' : 'bg-transparent'
      }`}
    >
      <nav aria-label="Principal" className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="flex h-18 items-center justify-between py-4">
          <Link to="/" className="group flex items-baseline gap-2">
            <span className="font-display texto-2 font-medium tracking-tight text-tinta-900">
              Itablooom
            </span>
            <span className="texto--1 uppercase tracking-[0.25em] text-rosa-500 transition-colors duration-200 group-hover:text-rosa-400">
              Studio
            </span>
          </Link>

          <div className="hidden items-center gap-9 md:flex">
            {LINKS.map((link) => {
              const activo = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  aria-current={activo ? 'page' : undefined}
                  className="group relative inline-block py-1 texto--1 font-medium tracking-wide text-tinta-700 transition-colors duration-200 hover:text-tinta-900"
                >
                  {link.label}
                  {/* Subrayado que crece desde el centro; queda fijo si es la página actual. */}
                  <span
                    className={`absolute bottom-0 left-0 h-px bg-rosa-400 transition-all duration-300 ease-out ${
                      activo ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                  />
                </Link>
              );
            })}
            <Button to="/agendar" size="sm" variant="primary">
              Reservar hora
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setAbierto(!abierto)}
            aria-expanded={abierto}
            aria-controls="menu-movil"
            aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
            className="rounded-full p-2 text-tinta-800 transition-colors duration-200 hover:bg-tinta-900/5 md:hidden"
          >
            {abierto ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
          </button>
        </div>
      </nav>

      {abierto && (
        <div
          id="menu-movil"
          className="border-t border-tinta-900/8 bg-crema-100/95 backdrop-blur-md md:hidden"
        >
          <div className="space-y-1 px-5 py-4">
            {LINKS.map((link, i) => (
              <Link
                key={link.path}
                to={link.path}
                className="anim-entrada block rounded-xl px-4 py-3 font-medium text-tinta-800 transition-colors duration-200 hover:bg-rosa-100"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {link.label}
              </Link>
            ))}
            <Button to="/agendar" size="md" className="mt-2 w-full">
              Reservar hora
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
