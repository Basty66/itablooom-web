import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Section, SectionHeading } from '../ui/Section';

/** Las respuestas reflejan cómo funciona el sistema de reservas de verdad. */
const PREGUNTAS = [
  {
    pregunta: '¿Cuánto tiempo tengo para pagar?',
    respuesta:
      'Diez minutos. Mientras tanto el horario queda reservado a tu nombre. Si no alcanzas a pagar, el cupo se libera solo y puedes volver a reservarlo sin problema.',
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
      'Sí. Escríbenos por WhatsApp con al menos 24 horas de anticipación y reprogramamos tu hora.',
  },
  {
    pregunta: '¿Necesito alguna preparación previa?',
    respuesta:
      'Para pestañas: llega sin maquillaje en los ojos y sin rímel. Para uñas: si traes esmaltado permanente anterior, avísanos al reservar para considerar el retiro.',
  },
];

export default function Faq() {
  const [abierta, setAbierta] = useState<number | null>(0);

  return (
    <Section id="faq" className="bg-tinta-900">
      <SectionHeading
        eyebrow="Dudas frecuentes"
        title="Preguntas y respuestas"
        subtitle="Lo que más nos preguntan, respondido de una vez."
      />

      <div className="mx-auto mt-14 max-w-3xl divide-y divide-tinta-900/10 border-y border-crema-100/12">
        {PREGUNTAS.map(({ pregunta, respuesta }, i) => {
          const activa = abierta === i;
          return (
            /* Las preguntas caen una tras otra al llegar a la sección, en vez
               de aparecer el bloque entero de una vez. */
            <div key={pregunta} className="anim-entrada" style={{ animationDelay: `${i * 70}ms` }}>
              <h3>
                <button
                  type="button"
                  onClick={() => setAbierta(activa ? null : i)}
                  aria-expanded={activa}
                  aria-controls={`faq-panel-${i}`}
                  className="flex w-full items-center justify-between gap-6 py-5 text-left transition-colors duration-200 hover:text-cobre-300"
                >
                  <span className="font-display texto-1 text-crema-100">{pregunta}</span>
                  <Plus
                    size={19}
                    strokeWidth={1.5}
                    aria-hidden="true"
                    className={`shrink-0 text-cobre-300 transition-transform duration-300 ease-out ${
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
                  {/* 12px y 672px de ancho daban 112 caracteres por línea,
                      muy por encima de los 60-75 en que la vista salta de
                      renglón sin perderse. Va al cuerpo del sistema y con el
                      ancho de lectura acotado. */}
                  <p className="max-w-[46ch] pb-6 pr-10 texto-0 leading-relaxed text-nacar-200/80">
                    {respuesta}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
