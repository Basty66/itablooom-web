import { MousePointerClick, CalendarCheck2, CreditCard, BellRing } from 'lucide-react';
import { Section, SectionHeading } from '../ui/Section';

const PASOS = [
  {
    icono: MousePointerClick,
    titulo: 'Elige tu tratamiento',
    texto: 'Revisa el catálogo con duración y precio de cada servicio. Sin sorpresas al llegar.',
  },
  {
    icono: CalendarCheck2,
    titulo: 'Reserva día y hora',
    texto: 'Solo se muestran los horarios realmente disponibles, según la duración del servicio.',
  },
  {
    icono: CreditCard,
    titulo: 'Confirma con la seña',
    texto: 'Pagas la seña o el total con Mercado Pago. Débito, crédito o Webpay.',
  },
  {
    icono: BellRing,
    titulo: 'Recibe tu recordatorio',
    texto: 'Te queda agendada al instante y te avisamos antes de la cita.',
  },
];

export default function ComoFunciona() {
  return (
    <Section id="como-funciona" className="bg-crema-100">
      <SectionHeading
        eyebrow="Simple"
        title="Cómo reservar"
        subtitle="Cuatro pasos, menos de un minuto. Sin ida y vuelta por mensajes."
      />

      <ol className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {PASOS.map(({ icono: Icono, titulo, texto }, i) => (
          <li
            key={titulo}
            className="anim-entrada group relative rounded-2xl border border-tinta-900/8 bg-crema-50 p-7 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-rosa-200 hover:shadow-[0_18px_40px_-24px_rgba(20,16,14,0.4)]"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <span
              aria-hidden="true"
              className="absolute right-6 top-6 font-display texto-2 text-rosa-200 transition-colors duration-300 group-hover:text-rosa-300"
            >
              0{i + 1}
            </span>

            <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-rosa-100 transition-colors duration-300 group-hover:bg-rosa-200">
              <Icono size={20} strokeWidth={1.4} className="text-tinta-800" aria-hidden="true" />
            </span>

            <h3 className="texto-1 mb-2 text-tinta-900">{titulo}</h3>
            <p className="texto--1 text-tinta-600">{texto}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
