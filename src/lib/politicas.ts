/**
 * Políticas de reserva de Goddess Studio, tal como las redactó Ignacia.
 *
 * Viven acá y no dentro de un componente porque se muestran en dos lugares —el
 * paso previo al pago y el pie del sitio— y con dos copias siempre termina
 * cambiando una sola.
 */

export interface Politica {
  titulo: string;
  detalle: string;
}

export const POLITICAS: Politica[] = [
  {
    titulo: 'Abono de reserva',
    detalle:
      'Para confirmar tu hora se solicita un abono de $10.000, que se descuenta del valor total de tu servicio.',
  },
  {
    titulo: 'Cambios y cancelaciones',
    detalle:
      'Si necesitas cancelar o reagendar, avísanos con al menos 24 horas de anticipación. Los cambios están sujetos a disponibilidad.',
  },
  {
    titulo: 'Atrasos',
    detalle:
      'Contamos con una tolerancia de 10 minutos. Pasado ese tiempo, puede que necesitemos modificar o reagendar tu servicio según el tiempo disponible.',
  },
  {
    titulo: 'Inasistencia',
    detalle:
      'Si no te presentas a tu cita y no nos avisas antes, el abono podrá no ser trasladable a una nueva reserva.',
  },
  {
    titulo: 'Garantía',
    detalle:
      'Nuestros servicios cuentan con una garantía de 72 horas, sujeta a evaluación y a las condiciones de cuidado indicadas por Goddess Studio.',
  },
  {
    titulo: 'Antes de tu cita',
    detalle:
      'Para pestañas, llega con el área de los ojos limpia y sin máscara. Para uñas, cuéntanos antes cualquier lesión, dolor, inflamación o alteración que pueda afectar el servicio.',
  },
];

/** Frase del checkbox. Es la que la clienta acepta al reservar. */
export const TEXTO_ACEPTACION =
  'He leído y acepto las Políticas de Reserva y los Términos y Condiciones de Goddess Studio.';
