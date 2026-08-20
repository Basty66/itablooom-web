import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import { Container } from './ui/Section';
import { linkWhatsApp, EMAIL, INSTAGRAM_URL, WHATSAPP_VISIBLE } from '../lib/contacto';

/** lucide-react quitó los iconos de marcas, así que Instagram va como SVG propio. */
function InstagramIcon({ size = 17 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

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

export default function Footer() {
  return (
    <footer className="textura-papel relative border-t border-crema-300/20 bg-tinta-900 text-crema-100">
      <Container className="relative py-16">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="flex items-baseline gap-2">
              <span className="font-display texto-2 font-medium text-crema-100">Goddess</span>
              <span className="texto--1 uppercase tracking-[0.25em] text-dorado-300">Studio</span>
            </div>
            <p className="mt-4 max-w-sm texto--1 text-crema-100/60">
              Esmaltado permanente, uñas acrílicas, extensión de pestañas y diseño de cejas.
              Atención personalizada con hora reservada.
            </p>

            <div className="mt-6 flex items-center gap-3">
              {[
                { href: INSTAGRAM_URL, icono: <InstagramIcon />, label: 'Instagram' },
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
              ].map(({ href, icono, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-crema-100/15 text-crema-100/70 transition-all duration-200 ease-out hover:border-dorado-400 hover:text-dorado-300 active:scale-95"
                >
                  {icono}
                </a>
              ))}
            </div>

            <a
              href={linkWhatsApp()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block py-1 texto--1 text-crema-100/60 transition-colors duration-200 hover:text-dorado-300"
            >
              {WHATSAPP_VISIBLE}
            </a>
          </div>

          <nav aria-label="Pie de página" className="md:col-span-3">
            <h2 className="texto--1 mb-4 font-medium uppercase tracking-[0.2em] text-dorado-300">
              Navegación
            </h2>
            <ul className="space-y-2.5">
              {NAVEGACION.map((item) => (
                <li key={item.to}>
                  {/* inline-block + py-1 lleva el área táctil al mínimo de 24px (WCAG 2.2). */}
                  <Link
                    to={item.to}
                    className="inline-block py-1 texto--1 text-crema-100/70 transition-colors duration-200 hover:text-crema-100"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-4">
            <h2 className="texto--1 mb-4 font-medium uppercase tracking-[0.2em] text-dorado-300">
              Atención
            </h2>
            <dl className="space-y-2.5">
              {HORARIOS.map(([dia, horas]) => (
                <div key={dia} className="flex items-baseline justify-between gap-4">
                  <dt className="texto--1 text-crema-100/60">{dia}</dt>
                  <dd
                    className={`texto--1 ${
                      horas === 'Cerrado' ? 'text-crema-100/35' : 'text-crema-100'
                    }`}
                  >
                    {horas}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 flex items-center gap-2 texto--1 text-crema-100/60">
              <MapPin size={15} strokeWidth={1.5} aria-hidden="true" className="text-dorado-300" />
              Melipilla, Chile
            </p>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-crema-100/10 pt-8 texto--1 text-crema-100/45 sm:flex-row">
          <p>© {new Date().getFullYear()} Goddess Studio</p>
          <p>Diseñado y desarrollado por BS Digital Tech</p>
        </div>
      </Container>
    </footer>
  );
}
