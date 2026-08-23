/** Datos de contacto en un solo lugar: antes el número estaba repetido y desactualizado. */

export const MARCA = 'Goddess';
export const MARCA_SUFIJO = 'Studio';
export const RUBRO = 'Uñas, Pestañas y Cejas';
export const CIUDAD = 'Melipilla';

/** Formato internacional sin signos, como lo requiere wa.me. */
export const WHATSAPP_NUMERO = '56974095567';
export const WHATSAPP_VISIBLE = '+56 9 7409 5567';
/* Correo real de la clienta. Con goddessstudio.cl ya verificado en Resend,
   conviene migrar a hola@goddessstudio.cl. */
export const EMAIL = 'goddess.studio.melipilla@gmail.com';
/* Con guiones bajos: el perfil sin ellos es de otra persona, y el sitio
   estuvo enlazando ahí. */
export const INSTAGRAM_USUARIO = '_goddess.studio_';

export function linkWhatsApp(mensaje?: string): string {
  const base = `https://wa.me/${WHATSAPP_NUMERO}`;
  return mensaje ? `${base}?text=${encodeURIComponent(mensaje)}` : base;
}

export const INSTAGRAM_URL = `https://instagram.com/${INSTAGRAM_USUARIO}`;
