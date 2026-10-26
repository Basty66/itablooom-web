import { Link, useLocation } from 'react-router-dom';
import { Mail, Phone, MapPin, Clock3 } from 'lucide-react';
import { Container } from './ui/Section';
import IconoInstagram from './ui/IconoInstagram';
import Emblema from './ui/Emblema';
import BotonLujo from './ui/BotonLujo';
import { linkWhatsApp, EMAIL, INSTAGRAM_URL, INSTAGRAM_USUARIO, WHATSAPP_VISIBLE } from '../lib/contacto';

const NAVEGACION = [
  { to: '/', label: 'Inicio' },
  { to: '/servicios', label: 'Servicios' },
  { to: '/agendar', label: 'Reservar hora' },
];

const HORARIOS = [
  ['Lunes a viernes', '10:00 — 20:00'],
  ['Sábados', '10:00 — 15:00'],
  ['Domingos', 'Cerrado'],
];

const REDES = [
  { href: INSTAGRAM_URL, icono: <IconoInstagram />, label: 'Instagram' },
  {
    href: linkWhatsApp('Hola! Quiero consultar por un tratamiento'),
    icono: <Phone size={17} strokeWidth={1.5} aria-hidden="true" />,
    label: 'WhatsApp',
  },
  {
    href: `mailto:${EMAIL}`,
    icono: <Mail size={17} strokeWidth={1.5} aria-hidden="true" />,
    label: 'Correo',
  },
];

/**
 * Pie del sitio.
 *
 * Arriba, el emblema y la última invitación a reservar; al medio, lo que se
 * busca en un pie (contacto, páginas, horario); y abajo de todo el nombre a
 * todo el ancho, en itálica de metal, que sube cuando el pie entra en
 * pantalla. Es la firma de la página: lo último que se ve es la marca.
 */
export default function Footer() {
  const { pathname } = useLocation();
  return (
    <footer className="textura-papel relative overflow-hidden bg-tinta-950 text-nacar-200">
      {/* Filo de luz en el borde superior, en vez de una línea plana. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cobre-300/60 to-transparent"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-1/3 left-1/2 h-[60%] w-[90%] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-vino-700)_45%,transparent),transparent)]"
      />

      <Container className="relative pt-16 md:pt-20">
        <div className="flex flex-col items-center text-center">
          <Emblema className="h-20 w-20 md:h-24 md:w-24" titulo="Emblema de Goddess Studio" />
          {/* No repite el "diosa." del cierre, que queda justo encima. */}
          <p className="mt-6 max-w-[22ch] font-display texto-3 text-crema-100">
            Te esperamos en <span className="texto-metal pr-1 italic">Melipilla.</span>
          </p>
          {/* En la agenda el botón sobra: ya se está reservando. */}
          {!pathname.startsWith('/agendar') && (
            <div className="mt-8">
              <BotonLujo to="/agendar">Reservar hora</BotonLujo>
            </div>
          )}
        </div>

        <div className="linea-cobre mt-16 grid gap-10 border-t pt-12 sm:grid-cols-2 md:grid-cols-12">
          <div className="md:col-span-4">
            <h2 className="texto--1 mb-4 font-medium uppercase espaciado-amplio text-cobre-300">Contacto</h2>
            <div className="flex items-center gap-3">
              {REDES.map(({ href, icono, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="group relative flex h-11 w-11 items-center justify-center rounded-full text-nacar-200/85 transition-transform duration-300 ease-out hover:-translate-y-0.5 hover:text-cobre-100 active:scale-95"
                >
                  <span aria-hidden="true" className="pointer-events-none canto-metal absolute inset-0 rounded-full" />
                  {icono}
                </a>
              ))}
            </div>
            <a
              href={linkWhatsApp()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block py-1 texto-0 text-nacar-200/85 transition-colors duration-200 hover:text-cobre-200"
            >
              {WHATSAPP_VISIBLE}
            </a>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block py-1 texto-0 text-nacar-200/85 transition-colors duration-200 hover:text-cobre-200"
            >
              @{INSTAGRAM_USUARIO}
            </a>
          </div>

          <nav aria-label="Pie de página" className="md:col-span-3">
            <h2 className="texto--1 mb-4 font-medium uppercase espaciado-amplio text-cobre-300">Páginas</h2>
            <ul className="space-y-1">
              {NAVEGACION.map((item) => (
                <li key={item.to}>
                  {/* El relleno vertical lleva el alto táctil a 44px. */}
                  <Link
                    to={item.to}
                    className="group inline-flex items-center py-2.5 texto-0 text-nacar-200/85 transition-colors duration-200 hover:text-crema-100"
                  >
                    {/* La raya aparece al pasar el cursor; sin el `gap` fijo, en
                        reposo el texto queda alineado con su título. */}
                    <span
                      aria-hidden="true"
                      className="mr-0 h-px w-0 bg-cobre-300 transition-all duration-300 ease-out group-hover:mr-2 group-hover:w-4"
                    />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="sm:col-span-2 md:col-span-5">
            <h2 className="texto--1 mb-4 flex items-center gap-2 font-medium uppercase espaciado-amplio text-cobre-300">
              <Clock3 size={14} strokeWidth={1.5} aria-hidden="true" />
              Atención
            </h2>
            <dl className="space-y-2.5">
              {HORARIOS.map(([dia, horas]) => (
                <div key={dia} className="flex items-baseline gap-3">
                  <dt className="texto-0 text-nacar-200/85">{dia}</dt>
                  <span aria-hidden="true" className="puntos-guia" />
                  <dd className={`texto-0 tabular-nums ${horas === 'Cerrado' ? 'text-nacar-300' : 'text-crema-100'}`}>
                    {horas}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 flex items-center gap-2 texto-0 text-nacar-200/85">
              <MapPin size={15} strokeWidth={1.5} aria-hidden="true" className="text-cobre-300" />
              Melipilla, Chile
            </p>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-2 texto--1 text-nacar-300 sm:flex-row">
          <p>© {new Date().getFullYear()} Goddess Studio</p>
          <p>Diseñado y desarrollado por BS Digital Tech</p>
        </div>
      </Container>

      {/*
        El nombre a todo el ancho. Decorativo —el nombre ya está arriba—, así
        que los lectores de pantalla lo saltan. Se corta abajo a propósito:
        se lee como un sello estampado en el borde de la página.
      */}
      <div aria-hidden="true" className="firma-pie pointer-events-none relative mt-6 select-none">
        <p className="metal-vivo metal-oro-rosa whitespace-nowrap px-[0.06em] text-center font-display text-[clamp(6rem,30vw,26rem)] italic leading-[0.78]">
          Goddess
        </p>
      </div>
    </footer>
  );
}
