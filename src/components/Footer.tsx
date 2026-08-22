import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import { Container } from './ui/Section';
import IconoInstagram from './ui/IconoInstagram';
import { linkWhatsApp, EMAIL, INSTAGRAM_URL, WHATSAPP_VISIBLE } from '../lib/contacto';

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
    /* El fondo era `bg-dorado-400`: oro sólido bajo un contenido escrito
       entero para fondo oscuro (crema, dorado-300, bordes claros), así que el
       pie entero quedaba en 1.5:1. Va al escalón más profundo de la escala,
       que además lo separa del cuerpo de la página. */
    <footer className="textura-papel relative border-t border-dorado-400/15 bg-tinta-950 text-nacar-200">
      <Container className="relative py-16">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="flex items-baseline gap-2">
              <span className="font-display texto-2 font-medium text-crema-100">Goddess</span>
              <span className="texto--1 uppercase tracking-[0.25em] text-rosa-300">Studio</span>
            </div>
            <p className="mt-4 max-w-sm texto-0 leading-relaxed text-nacar-200/80">
              Esmaltado permanente, uñas acrílicas, extensión de pestañas y diseño de cejas.
              Atención personalizada con hora reservada.
            </p>

            <div className="mt-6 flex items-center gap-3">
              {[
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
              ].map(({ href, icono, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-crema-100/15 text-nacar-200/80 transition-all duration-200 ease-out hover:border-dorado-400 hover:text-dorado-300 active:scale-95"
                >
                  {icono}
                </a>
              ))}
            </div>

            <a
              href={linkWhatsApp()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block py-2.5 texto-0 text-nacar-200/80 transition-colors duration-200 hover:text-dorado-300"
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
                  {/* El relleno vertical lleva el alto táctil a 44px. WCAG
                      pide 24, pero para el dedo ese mínimo se falla seguido. */}
                  <Link
                    to={item.to}
                    className="inline-block py-2.5 texto-0 text-nacar-200/80 transition-colors duration-200 hover:text-crema-100"
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
                  <dt className="texto-0 text-nacar-200/80">{dia}</dt>
                  <dd
                    className={`texto-0 ${
                      horas === 'Cerrado' ? 'text-nacar-300' : 'text-crema-100'
                    }`}
                  >
                    {horas}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 flex items-center gap-2 texto-0 text-nacar-200/80">
              <MapPin size={15} strokeWidth={1.5} aria-hidden="true" className="text-dorado-300" />
              Melipilla, Chile
            </p>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-crema-100/10 pt-8 texto--1 text-nacar-300 sm:flex-row">
          <p>© {new Date().getFullYear()} Goddess Studio</p>
          <p>Diseñado y desarrollado por BS Digital Tech</p>
        </div>
      </Container>
    </footer>
  );
}
