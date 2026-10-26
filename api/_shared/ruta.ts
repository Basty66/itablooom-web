/**
 * Ruta del panel de Ignacia.
 *
 * No es "/admin" a propósito: esa es la primera ruta que prueba cualquier bot
 * o curioso. Con un nombre que no se adivina, la pantalla de acceso ni
 * siquiera aparece para quien no tiene el enlace.
 *
 * Es solo una primera capa: lo que protege de verdad el panel es la sesión
 * firmada y Face ID. Y el sitio público no importa este archivo, así que la
 * ruta no viaja en su JavaScript.
 *
 * Si se cambia, hay que cambiarla también en vercel.json (rewrites y
 * headers), en el nombre del HTML de la raíz y en la carpeta de public/.
 */
export const RUTA_PANEL = '/estudio-jq70xl';
