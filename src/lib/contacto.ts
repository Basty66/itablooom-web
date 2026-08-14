/** Datos de contacto en un solo lugar: antes el número estaba repetido y desactualizado. */

/** Formato internacional sin signos, como lo requiere wa.me. */
export const WHATSAPP_NUMERO = '56928122947';
export const WHATSAPP_VISIBLE = '+56 9 2812 2947';
export const EMAIL = 'hola@itablooom.cl';
export const INSTAGRAM_USUARIO = 'itablooom.studio';

export function linkWhatsApp(mensaje?: string): string {
  const base = `https://wa.me/${WHATSAPP_NUMERO}`;
  return mensaje ? `${base}?text=${encodeURIComponent(mensaje)}` : base;
}

export const INSTAGRAM_URL = `https://instagram.com/${INSTAGRAM_USUARIO}`;
