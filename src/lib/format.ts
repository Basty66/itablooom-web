/** Formatos compartidos. Estaban duplicados en cada página, con riesgo de divergir. */

const CLP = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

export function formatPrice(valor: number): string {
  return CLP.format(valor);
}

/** 240 -> "4 h", 90 -> "1 h 30 min", 30 -> "30 min". */
export function formatDuration(minutos: number): string {
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
}
