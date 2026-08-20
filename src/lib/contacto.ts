/** Datos de contacto en un solo lugar: antes el número estaba repetido y desactualizado. */

export const MARCA = 'Goddess';
export const MARCA_SUFIJO = 'Studio';
export const RUBRO = 'Uñas, Pestañas y Cejas';
export const CIUDAD = 'Melipilla';

/** Formato internacional sin signos, como lo requiere wa.me. */
export const WHATSAPP_NUMERO = '56928122947';
export const WHATSAPP_VISIBLE = '+56 9 2812 2947';
/* Correo real de la clienta. Cuando exista goddessstudio.cl y esté
   verificado en Resend, conviene migrar a hola@goddessstudio.cl. */
export const EMAIL = 'goddess.studio.melipilla@gmail.com';
export const INSTAGRAM_USUARIO = 'goddess.studio';

export function linkWhatsApp(mensaje?: string): string {
  const base = `https://wa.me/${WHATSAPP_NUMERO}`;
  return mensaje ? `${base}?text=${encodeURIComponent(mensaje)}` : base;
}

export const INSTAGRAM_URL = `https://instagram.com/${INSTAGRAM_USUARIO}`;
