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

  useEffect(() => {
    const alScrollear = () => setConScroll(window.scrollY > 16);
    alScrollear();
    window.addEventListener('scroll', alScrollear, { passive: true });
    return () => window.removeEventListener('scroll', alScrollear);
  }, []);

  useEffect(() => setAbierto(false), [location.pathname]);

  // Bloquear scroll del body cuando el menú está abierto
  useEffect(() => {
    document.body.style.overflow = abierto ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [abierto]);

  return (
    <header
      /* Al scrollear pasa a vidrio oscuro. Antes usaba un crema translúcido
         heredado del tema claro: sobre el fondo negro aparecía una banda
         blanca que partía la página en dos. */
      className={`sticky top-0 z-50 transition-all duration-300 ease-out ${
        conScroll ? 'vidrio border-b' : 'border-b border-transparent bg-transparent'
      }`}
    >
      <nav aria-label="Principal" className="mx-auto w-full max-w-[1200px] px-5 sm:px-6">
        <div className="flex h-18 items-center justify-between py-4">
          <Link to="/" className="group flex items-baseline gap-2">
            <span className="font-display texto-2 font-medium tracking-tight text-crema-100">
              Goddess
            </span>
            <span className="texto--1 uppercase tracking-[0.25em] text-rosa-300 transition-colors duration-200 group-hover:text-rosa-200">
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
                  /* Versalitas espaciadas y, para la página actual, una línea
                     de oro debajo: el sistema marca el activo con esa regla y
                     no cambiando el color de la letra. */
                  className="group relative inline-block py-1 texto--1 font-medium uppercase espaciado-amplio text-nacar-200/80 transition-colors duration-200 hover:text-crema-100"
                >
                  {link.label}
                  <span
                    className={`absolute -bottom-0.5 left-0 h-px bg-dorado-400 transition-all duration-300 ease-out ${
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
            className="p-2 text-crema-100/90 transition-colors duration-200 hover:bg-crema-100/5 md:hidden"
          >
            {abierto ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
          </button>
        </div>
      </nav>

      {/* Backdrop + menú overlay — siempre renderizado, controlado por CSS */}
      <div
        id="menu-movil"
        className={`fixed inset-0 top-18 z-40 md:hidden ${
          abierto ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-tinta-950/70 backdrop-blur-sm transition-opacity duration-300 ease-out ${
            abierto ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setAbierto(false)}
          aria-hidden="true"
        />

        {/* Panel del menú */}
        <div
          className={`tarjeta relative mx-auto mt-2 w-[calc(100%-2.5rem)] max-w-sm p-3 transition-all duration-300 ease-out ${
            abierto
              ? 'translate-y-0 opacity-100 scale-100'
              : '-translate-y-3 opacity-0 scale-95'
          }`}
        >
          <div className="space-y-1">
            {LINKS.map((link, i) => {
              const activo = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block rounded-[var(--radius-suave)] px-4 py-3 texto--1 uppercase espaciado-amplio transition-colors duration-300 ${
                    activo
                      ? 'bg-tinta-900 text-dorado-300'
                      : 'text-nacar-100/90 hover:bg-tinta-900'
                  }`}
                  style={{ transitionDelay: abierto ? `${i * 50}ms` : '0ms' }}
                >
                  {link.label}
                </Link>
              );
            })}
            <Button to="/agendar" size="md" className="mt-2 w-full">
              Reservar hora
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
