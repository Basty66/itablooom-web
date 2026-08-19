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
    <Section id="como-funciona" className="bg-crema-100">
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
      <ol className="mt-10 grid gap-3 sm:mt-14 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
        {PASOS.map(({ icono: Icono, titulo, texto }, i) => (
          <li
            key={titulo}
            className="anim-entrada group relative flex items-start gap-4 rounded-2xl border border-tinta-900/8 bg-crema-50 p-4 transition-all duration-300 ease-out hover:border-dorado-300 hover:shadow-[0_18px_40px_-24px_rgba(20,16,14,0.4)] sm:block sm:p-7 sm:hover:-translate-y-1"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <span
              aria-hidden="true"
              className="absolute right-5 top-4 font-display texto-1 text-dorado-300/70 transition-colors duration-300 sm:right-6 sm:top-6 sm:texto-2"
            >
              0{i + 1}
            </span>

            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rosa-100 transition-colors duration-300 group-hover:bg-dorado-300/40 sm:mb-5 sm:h-12 sm:w-12">
              <Icono size={18} strokeWidth={1.4} className="text-tinta-800 sm:size-5" aria-hidden="true" />
            </span>

            <div className="min-w-0 pr-8 sm:pr-0">
              <h3 className="texto-0 text-tinta-900 sm:texto-1 sm:mb-2">{titulo}</h3>
              <p className="mt-1 texto--1 text-tinta-600 sm:mt-0">{texto}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
