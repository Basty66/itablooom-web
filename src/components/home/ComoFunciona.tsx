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
    titulo: 'Asegura tu hora',
    /* Antes decía "pagas el total", y el sitio entero habla de reservar con
       abono: la clienta podía elegir cualquiera de los dos. */
    texto: 'Con un abono o pagando el total, por Mercado Pago: débito, crédito o Webpay.',
  },
  {
    icono: BellRing,
    titulo: 'Recibe tu recordatorio',
    texto: 'Te queda agendada al instante y te avisamos antes de la cita.',
  },
];

/**
 * Los cuatro pasos como una línea de tiempo con canto de metal.
 *
 * En móvil la línea es vertical y crece a medida que se baja; antes eran
 * dos columnas con letra de 12px, que se entendían de un vistazo pero no se
 * leían. En escritorio la línea es horizontal y se traza al aparecer.
 */
export default function ComoFunciona() {
  return (
    <Section id="como-funciona" className="bg-tinta-900">
      <SectionHeading
        eyebrow="Proceso simple"
        title="Cómo reservar"
        destacar="reservar"
        subtitle="Cuatro pasos, menos de un minuto. Sin ida y vuelta por mensajes."
      />

      <ol className="relative mx-auto mt-14 grid max-w-md gap-11 md:mt-20 md:max-w-none md:grid-cols-4 md:gap-8">
        {/* Vertical en móvil: pasa por el centro de los círculos. */}
        <span
          aria-hidden="true"
          className="linea-proceso absolute bottom-6 left-[1.375rem] top-6 w-px origin-top bg-gradient-to-b from-cobre-100 via-cobre-400 to-cobre-600/0 md:hidden"
        />
        {/* Horizontal desde md, a la altura de los círculos. */}
        <span
          aria-hidden="true"
          className="filete-entrada absolute left-6 right-0 top-[1.375rem] hidden h-px bg-gradient-to-r from-cobre-100 via-cobre-400 to-cobre-600/0 md:block"
          style={{ animationDuration: '1.8s', animationDelay: '300ms' }}
        />

        {PASOS.map(({ icono: Icono, titulo, texto }, i) => (
          <li
            key={titulo}
            className="anim-entrada group relative flex gap-5 md:flex-col md:gap-0"
            style={{ animationDelay: `${200 + i * 140}ms` }}
          >
            <span className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-tinta-900 transition-transform duration-500 ease-out group-hover:scale-110">
              <span aria-hidden="true" className="canto-metal activo absolute inset-0 rounded-full" />
              <Icono size={18} strokeWidth={1.4} className="text-cobre-200" aria-hidden="true" />
            </span>

            <div className="min-w-0 md:mt-7">
              <span
                aria-hidden="true"
                className="texto-metal block font-display text-[2.4rem] italic leading-none md:text-[3.2rem]"
              >
                0{i + 1}
              </span>
              <h3 className="mt-2 font-display texto-2 text-crema-100">{titulo}</h3>
              <p className="mt-2 max-w-[34ch] texto-0 leading-relaxed text-nacar-200/80">{texto}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
