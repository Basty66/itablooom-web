/** Formatos compartidos. Estaban duplicados en cada página, con riesgo de divergir. */

const CLP = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

export function formatPrice(valor: number | undefined | null): string {
  return CLP.format(Number(valor) || 0);
}

/**
 * Precio de un servicio, que puede venir en rango.
 *
 * En uñas el valor depende del largo y del diseño: el esmaltado va de $15.000
 * a $20.000 y el builder gel de $25.000 a $35.000. Mostrar solo el piso sería
 * quedarse con la mitad barata de la verdad, y la clienta se enteraría del
 * resto recién en el sillón.
 */
export function formatPriceRange(
  desde: number | undefined | null,
  hasta?: number | null
): string {
  if (!hasta || Number(hasta) <= Number(desde)) return formatPrice(desde);
  return `${formatPrice(desde)} – ${formatPrice(hasta)}`;
}

/** 240 -> "4 h", 90 -> "1 h 30 min", 30 -> "30 min". */
export function formatDuration(minutos: number): string {
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
}
