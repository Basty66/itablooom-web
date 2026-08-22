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
        eyebrow="Proceso simple"
        title="Cómo reservar"
        subtitle="Cuatro pasos, menos de un minuto. Sin ida y vuelta por mensajes."
      />

      {/*
        Dos columnas en móvil: los cuatro pasos apilados ocupaban 1,3 pantallas
        para explicar algo que se entiende de un vistazo. Cada celda queda con
        el texto justo y desde md vuelven a una fila de cuatro.
      */}
      <ol className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:mt-16 sm:gap-6 md:grid-cols-4">
        {PASOS.map(({ icono: Icono, titulo, texto }, i) => (
          <li
            key={titulo}
            className="anim-entrada group relative min-w-0"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            {/* El número va de marca de agua detrás del contenido: ordena la
                secuencia sin competir con el título, que es lo que se lee. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-2 right-0 select-none font-display text-[3.5rem] leading-none text-crema-100/10 sm:right-2 sm:text-[6.5rem]"
            >
              0{i + 1}
            </span>

            <Icono
              size={20}
              strokeWidth={1.3}
              className="relative text-rosa-300 transition-transform duration-500 ease-out group-hover:-translate-y-0.5 sm:size-[22px]"
              aria-hidden="true"
            />

            <div className="relative mt-4 min-w-0 sm:mt-5">
              <h3 className="font-display texto-1 text-crema-100 sm:texto-2">{titulo}</h3>
              <p className="mt-1.5 texto--1 leading-relaxed text-nacar-200/80 sm:mt-2 sm:texto-0">
                {texto}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
