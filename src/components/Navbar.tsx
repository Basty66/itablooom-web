import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Phone, Mail } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Button from './ui/Button';
import IconoInstagram from './ui/IconoInstagram';
import { linkWhatsApp, EMAIL, INSTAGRAM_URL, WHATSAPP_VISIBLE } from '../lib/contacto';

const LINKS = [
  { path: '/', label: 'Inicio' },
  { path: '/servicios', label: 'Servicios' },
  { path: '/agendar', label: 'Agendar' },
];

/** Toques seguidos sobre la marca para entrar al panel, y ventana para darlos. */
const TOQUES_PANEL = 3;
const VENTANA_TOQUES_MS = 1200;

export default function Navbar() {
  const [abierto, setAbierto] = useState(false);
  const [conScroll, setConScroll] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  /*
   * Atajo al panel: tres toques sobre la marca.
   *
   * Ignacia entra desde su teléfono varias veces al día y escribir la ruta a
   * mano es incómodo. No es una medida de seguridad —la ruta sigue siendo
   * pública y protegida por contraseña—, solo evita el tipeo. La ventana de
   * tiempo hace que tres toques sueltos a lo largo de la visita no cuenten.
   */
  const toques = useRef<number[]>([]);
  function contarToque(e: React.MouseEvent) {
    const ahora = Date.now();
    toques.current = [...toques.current, ahora].filter((t) => ahora - t < VENTANA_TOQUES_MS);
    if (toques.current.length >= TOQUES_PANEL) {
      toques.current = [];
      /*
       * Cortar la navegación del enlace: sin esto el Link seguía su curso a la
       * portada justo después, deshaciendo el salto al panel.
       */
      e.preventDefault();
      navigate('/admin');
    }
  }

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
        {/*
          La barra se contrae al bajar, como en el boceto, pero solo desde
          escritorio: en móvil su alto está atado al panel del menú, que arranca
          en `top-18`, y a la altura que el hero descuenta para medir una
          pantalla. Contraerla ahí abriría un hueco entre barra y panel.

          Sin scroll conserva el alto de siempre por el mismo motivo: el hero
          calcula contra 4.5rem y cualquier otro valor le agregaría un scroll
          de unos pocos píxeles apenas cargada la página.
        */}
        <div
          className={`flex items-center justify-between transition-[height] duration-300 ease-out ${
            conScroll ? 'h-18 md:h-14' : 'h-18 md:h-18'
          }`}
        >
          {/* La marca completa en serif, con "Studio" en itálica rosa: en el
              boceto es una sola palabra compuesta, no un logo con bajada en
              versalitas. */}
          <Link to="/" onClick={contarToque} className="group flex items-baseline gap-2">
            <span className="font-display texto-2 font-medium tracking-tight text-crema-100">
              Goddess
            </span>
            <span className="font-display texto-2 italic text-rosa-300 transition-colors duration-200 group-hover:text-rosa-200">
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
                     de cobre debajo: el sistema marca el activo con esa regla y
                     no cambiando el color de la letra. */
                  className="group relative inline-block py-1 texto--1 font-medium uppercase espaciado-amplio text-nacar-200/80 transition-colors duration-200 hover:text-crema-100"
                >
                  {link.label}
                  <span
                    className={`absolute -bottom-0.5 left-0 h-px bg-cobre-400 transition-all duration-300 ease-out ${
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
            className="-mr-2 flex h-11 w-11 items-center justify-center rounded-[var(--radius-suave)] text-crema-100/90 transition-colors duration-200 hover:bg-crema-100/5 md:hidden"
          >
            {abierto ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
          </button>
        </div>
      </nav>

      {/*
        Panel a pantalla completa, no un desplegable flotante. El anterior era
        una tarjeta chica centrada con los enlaces en versalitas grises: se
        leía como un menú de plantilla y no como parte del sitio. Este usa los
        mismos recursos que el resto —numeración en rosa, serif grande, líneas
        finas de oro— y aprovecha el espacio para dejar el contacto a mano.
      */}
      <div
        id="menu-movil"
        className={`fixed inset-x-0 bottom-0 top-18 z-40 md:hidden ${
          abierto ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        <div
          className={`absolute inset-0 bg-tinta-950/60 transition-opacity duration-300 ease-out ${
            abierto ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setAbierto(false)}
          aria-hidden="true"
        />

        <div
          className={`textura-papel absolute inset-0 flex flex-col overflow-y-auto border-t border-cobre-400/15 bg-tinta-950 px-5 pb-8 pt-8 transition-all duration-500 ease-out ${
            abierto ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
          }`}
        >
          <p className="texto--2 uppercase espaciado-amplio text-rosa-300">Navegación</p>

          <nav className="mt-6 flex flex-col">
            {LINKS.map((link, i) => {
              const activo = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  aria-current={activo ? 'page' : undefined}
                  className="linea-cobre group flex items-baseline gap-4 border-b py-5 first:border-t"
                  /* Entrada escalonada: los enlaces aparecen en orden, como el
                     resto de las secciones del sitio. */
                  style={{
                    transitionDelay: abierto ? `${i * 60}ms` : '0ms',
                    opacity: abierto ? 1 : 0,
                    transform: abierto ? 'translateY(0)' : 'translateY(0.5rem)',
                    transition: 'opacity 0.4s ease-out, transform 0.4s ease-out',
                  }}
                >
                  <span className="texto--2 tabular-nums text-rosa-300">0{i + 1}</span>
                  <span
                    className={`font-display texto-3 transition-colors duration-300 ${
                      activo ? 'text-cobre-400' : 'text-crema-100'
                    }`}
                  >
                    {link.label}
                  </span>
                  {activo && (
                    <span aria-hidden="true" className="ml-auto self-center h-px w-6 bg-cobre-400" />
                  )}
                </Link>
              );
            })}
          </nav>

          <Button to="/agendar" size="lg" className="mt-8 w-full">
            Reservar hora
          </Button>

          {/* Contacto al pie del panel: en móvil es lo que más se busca
              después de la navegación. */}
          <div className="linea-cobre mt-auto border-t pt-6">
            <p className="texto--2 uppercase espaciado-amplio text-nacar-300">Escríbenos</p>
            <div className="mt-4 flex items-center gap-3">
              {[
                { href: linkWhatsApp('Hola! Quiero consultar por un tratamiento'), icono: Phone, label: 'WhatsApp' },
                { href: INSTAGRAM_URL, icono: IconoInstagram, label: 'Instagram' },
                { href: `mailto:${EMAIL}`, icono: Mail, label: 'Correo' },
              ].map(({ href, icono: Icono, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-crema-100/15 text-nacar-200/85 transition-colors duration-200 hover:border-cobre-400 hover:text-cobre-300"
                >
                  <Icono size={17} strokeWidth={1.5} aria-hidden="true" />
                </a>
              ))}
              <span className="ml-1 texto-0 text-nacar-200/80">{WHATSAPP_VISIBLE}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
