import Revelar from '../ui/Revelar';

/**
 * Bloque de reseña: la única superficie de vino del sitio.
 *
 * Va entre el catálogo y el cierre porque ahí es donde la duda aparece —ya vio
 * los precios, todavía no reserva—, y una voz que no es la del estudio pesa
 * más que cualquier adjetivo propio.
 *
 * El vino como fondo y no como letra: sobre el negro mide 1.96:1 y desaparece,
 * pero como superficie completa con texto hueso encima da 8.61:1. De paso
 * corta el negro continuo justo antes del bloque claro del final.
 */
interface Resena {
  /** Palabras de la clienta, tal como las escribió. */
  texto: string;
  /** Nombre y desde cuándo viene, como aparecerá firmado. */
  autora: string;
}

/*
 * Reseñas reales de clientas de Goddess Studio.
 *
 * Mientras esté vacío la sección no se muestra. El boceto traía una firmada
 * por "Camila R." que era de relleno: publicar una reseña inventada en el
 * sitio de un negocio real es hacer pasar por testimonio algo que nadie dijo,
 * y basta que una clienta pregunte quién es Camila para que quede en evidencia.
 *
 * Ignacia tiene comentarios reales en Instagram y WhatsApp: con el permiso de
 * quien lo escribió, cada uno entra acá tal cual.
 */
const RESENAS: Resena[] = [];

export default function Testimonio() {
  if (RESENAS.length === 0) return null;

  const { texto, autora } = RESENAS[0];

  return (
    <section className="bg-vino-900 px-5 py-24 text-center md:py-32">
      <Revelar>
        <blockquote className="mx-auto max-w-[26ch] font-display texto-4 italic leading-[1.4] text-crema-100">
          {texto}
        </blockquote>
      </Revelar>
      <Revelar delay={140}>
        <p className="mt-6 texto--1 uppercase espaciado-medio text-rosa-200">— {autora}</p>
      </Revelar>
    </section>
  );
}
