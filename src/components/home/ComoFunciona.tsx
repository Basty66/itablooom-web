import { MousePointerClick, CalendarCheck2, CreditCard, BellRing } from 'lucide-react';
import { Section, SectionHeading } from '../ui/Section';

const PASOS = [
  {
    icono: MousePointerClick,
    titulo: 'Elige tu servicio',
    texto: 'Uñas, pestañas o cejas. Cada uno con su duración y valor a la vista.',
  },
  {
    icono: CalendarCheck2,
    titulo: 'Reserva día y hora',
    texto: 'Solo se muestran los horarios realmente disponibles, según la duración del servicio.',
  },
  {
    icono: CreditCard,
    titulo: 'Paga online',
    texto: 'Pagas el total con Mercado Pago. Débito, crédito o Webpay.',
  },
  {
    icono: BellRing,
    titulo: 'Recibe tu recordatorio',
    texto: 'Te queda agendada al instante y te avisamos antes de la cita.',
  },
];

export default function ComoFunciona() {
  return (
    <Section id="como-funciona" className="bg-tinta-900">
      <SectionHeading
        eyebrow="Simple"
        title="Cómo reservar"
        subtitle="Cuatro pasos, menos de un minuto. Sin ida y vuelta por mensajes."
      />

      {/*
        Móvil: fila compacta (icono a la izquierda, texto a la derecha), que
        ocupa la mitad de alto que la tarjeta vertical. Desde sm recupera el
        formato de tarjeta con el número grande de fondo.
      */}
      <ol className="mt-12 grid gap-px overflow-hidden sm:mt-16 md:grid-cols-2 lg:grid-cols-4">
        {PASOS.map(({ icono: Icono, titulo, texto }, i) => (
          <li
            key={titulo}
            className="anim-entrada group relative bg-tinta-900 py-6 sm:px-6 sm:py-8"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <span
              aria-hidden="true"
              className="font-display texto-3 leading-none text-dorado-300"
            >
              0{i + 1}
            </span>

            <Icono size={19} strokeWidth={1.3} className="mt-4 text-dorado-300" aria-hidden="true" />

            <div className="mt-4 min-w-0">
              <h3 className="texto-1 text-crema-100">{titulo}</h3>
              <p className="mt-2 texto--1 leading-relaxed text-crema-100/70">{texto}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
