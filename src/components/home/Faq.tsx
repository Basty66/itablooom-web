import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Section, SectionHeading } from '../ui/Section';

/** Las respuestas reflejan cómo funciona el sistema de reservas de verdad. */
const PREGUNTAS = [
  {
    pregunta: '¿Cuánto tiempo tengo para pagar la seña?',
    respuesta:
      'Diez minutos. Mientras tanto el horario queda reservado a tu nombre. Si no alcanzas a pagar, el cupo se libera solo y puedes volver a reservarlo sin problema.',
  },
  {
    pregunta: '¿La seña se descuenta del valor total?',
    respuesta:
      'Sí. Es un adelanto: el día de la cita pagas únicamente la diferencia en el local. También puedes pagar el total online al reservar, si prefieres llegar sin pendientes.',
  },
  {
    pregunta: '¿Qué medios de pago aceptan?',
    respuesta:
      'El pago se procesa con Mercado Pago: tarjetas de débito, crédito y Webpay. No guardamos los datos de tu tarjeta en ningún momento.',
  },
  {
    pregunta: '¿Cómo sé que mi cita quedó confirmada?',
    respuesta:
      'Apenas se aprueba el pago la reserva queda confirmada y agendada automáticamente. Vas a ver la confirmación en pantalla con el detalle de tu cita.',
  },
  {
    pregunta: '¿Puedo reagendar o cancelar?',
    respuesta:
      'Sí. Escríbenos por WhatsApp con al menos 24 horas de anticipación y reprogramamos tu hora manteniendo la seña.',
  },
  {
    pregunta: '¿Necesito alguna preparación previa?',
    respuesta:
      'Para depilación láser: llega con la zona rasurada y sin exposición solar reciente. Para tratamientos faciales: llega sin maquillaje si te es posible.',
  },
];

export default function Faq() {
  const [abierta, setAbierta] = useState<number | null>(0);

  return (
    <Section id="faq" className="bg-crema-100">
      <SectionHeading
        eyebrow="Dudas frecuentes"
        title="Antes de reservar"
        subtitle="Lo que más nos preguntan, respondido de una vez."
      />

      <div className="mx-auto mt-14 max-w-3xl divide-y divide-tinta-900/10 border-y border-tinta-900/10">
        {PREGUNTAS.map(({ pregunta, respuesta }, i) => {
          const activa = abierta === i;
          return (
            <div key={pregunta}>
              <h3>
                <button
                  type="button"
                  onClick={() => setAbierta(activa ? null : i)}
                  aria-expanded={activa}
                  aria-controls={`faq-panel-${i}`}
                  className="flex w-full items-center justify-between gap-6 py-5 text-left transition-colors duration-200 hover:text-rosa-500"
                >
                  <span className="texto-0 font-medium text-tinta-900">{pregunta}</span>
                  <Plus
                    size={19}
                    strokeWidth={1.5}
                    aria-hidden="true"
                    className={`shrink-0 text-rosa-500 transition-transform duration-300 ease-out ${
                      activa ? 'rotate-45' : ''
                    }`}
                  />
                </button>
              </h3>

              {/* grid-rows 0fr→1fr anima la apertura sin conocer la altura del texto. */}
              <div
                id={`faq-panel-${i}`}
                className={`grid transition-all duration-300 ease-out ${
                  activa ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <p className="max-w-2xl pb-6 pr-10 texto--1 text-tinta-600">{respuesta}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
