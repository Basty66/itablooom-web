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
            {/* El número va de marca de agua detrás del contenido: ordena la
                secuencia sin competir con el título, que es lo que se lee. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-2 top-0 select-none font-display text-[5rem] leading-none text-crema-100/10 sm:right-4 sm:text-[6.5rem]"
            >
              0{i + 1}
            </span>

            <Icono
              size={22}
              strokeWidth={1.3}
              className="relative text-rosa-300 transition-transform duration-500 ease-out group-hover:-translate-y-0.5"
              aria-hidden="true"
            />

            <div className="relative mt-5 min-w-0">
              <h3 className="font-display texto-2 text-crema-100">{titulo}</h3>
              <p className="mt-2 texto-0 leading-relaxed text-nacar-200/80">{texto}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
