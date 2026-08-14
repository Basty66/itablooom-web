import { CalendarHeart, ArrowRight, ShieldCheck, Clock3, MessageCircleHeart } from 'lucide-react';
import Button from '../ui/Button';
import { Container } from '../ui/Section';
import FloatingHearts from '../ui/FloatingHearts';

const SENALES = [
  { icono: ShieldCheck, texto: 'Pago protegido con Mercado Pago' },
  { icono: Clock3, texto: 'Confirmación inmediata' },
  { icono: MessageCircleHeart, texto: 'Recordatorio por WhatsApp' },
];

export default function Hero() {
  return (
    <section className="textura-papel relative overflow-hidden bg-gradient-to-b from-rosa-100 via-crema-100 to-crema-100">
      {/* Halo difuso: da profundidad al degradado sin cargar una imagen. */}
      <div
        aria-hidden="true"
        className="absolute -top-32 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-rosa-200/40 blur-3xl"
      />
      <FloatingHearts cantidad={14} />

      <Container className="relative">
        <div className="grid items-center gap-12 py-20 md:grid-cols-12 md:py-28">
          <div className="md:col-span-7">
            <p
              className="anim-entrada texto--1 mb-5 font-medium uppercase tracking-[0.22em] text-rosa-500"
              style={{ animationDelay: '60ms' }}
            >
              Estética facial · Chile
            </p>

            <h1
              className="anim-entrada texto-5 text-tinta-900"
              style={{ animationDelay: '140ms' }}
            >
              Tu piel merece
              <span className="block italic text-rosa-500">un ritual propio</span>
            </h1>

            <p
              className="anim-entrada mt-6 max-w-lg text-tinta-600"
              style={{ animationDelay: '220ms' }}
            >
              Limpiezas profundas, microneedling y depilación láser. Reserva tu hora en menos de
              un minuto: eliges el tratamiento, el día y confirmas con la seña.
            </p>

            <div
              className="anim-entrada mt-9 flex flex-col gap-3 sm:flex-row"
              style={{ animationDelay: '300ms' }}
            >
              <Button to="/agendar" size="lg" variant="primary">
                <CalendarHeart size={18} strokeWidth={1.5} />
                Reservar mi hora
              </Button>
              <Button to="/servicios" size="lg" variant="outline">
                Ver tratamientos
                <ArrowRight size={18} strokeWidth={1.5} />
              </Button>
            </div>

            <ul
              className="anim-entrada mt-10 flex flex-wrap gap-x-6 gap-y-3"
              style={{ animationDelay: '380ms' }}
            >
              {SENALES.map(({ icono: Icono, texto }) => (
                <li key={texto} className="flex items-center gap-2 texto--1 text-tinta-600">
                  <Icono size={15} strokeWidth={1.5} className="text-rosa-500" aria-hidden="true" />
                  {texto}
                </li>
              ))}
            </ul>
          </div>

          {/* Tarjeta de horarios: ocupa el espacio visual de una foto y a la vez
              responde la pregunta que más llega por mensaje directo. */}
          <div className="anim-velo md:col-span-5" style={{ animationDelay: '260ms' }}>
            <div className="relative rounded-3xl border border-tinta-900/8 bg-crema-50/80 p-8 shadow-[0_20px_60px_-30px_rgba(20,16,14,0.35)] backdrop-blur-sm">
              <div className="mb-6 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-rosa-200">
                  <Clock3 size={19} strokeWidth={1.5} className="text-tinta-800" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-display texto-1 text-tinta-900">Horario de atención</p>
                  <p className="texto--1 text-tinta-500">Agenda online 24/7</p>
                </div>
              </div>

              <dl className="space-y-3 border-t border-tinta-900/8 pt-5">
                {[
                  ['Lunes a viernes', '9:00 — 19:00'],
                  ['Sábados', '9:00 — 14:00'],
                  ['Domingos', 'Cerrado'],
                ].map(([dia, horas]) => (
                  <div key={dia} className="flex items-baseline justify-between gap-4">
                    <dt className="texto--1 text-tinta-600">{dia}</dt>
                    <dd
                      className={`texto--1 font-medium ${
                        horas === 'Cerrado' ? 'text-tinta-400' : 'text-tinta-900'
                      }`}
                    >
                      {horas}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
