/**
 * Preparación de fotos antes de subirlas.
 *
 * Una foto de celular pesa entre 3 y 8 MB y mide 4000px de ancho. Subirla tal
 * cual falla —el cuerpo de una función serverless admite 4,5 MB— y, aunque
 * pasara, dejaría la galería lentísima y consumiría el almacén en pocas
 * decenas de fotos.
 *
 * Redimensionar acá, en el navegador, tiene otra ventaja: desde el teléfono
 * con datos móviles se sube medio mega en vez de ocho.
 */

/** Lado mayor de la imagen final. Alcanza de sobra para verla a pantalla completa. */
const LADO_MAXIMO = 1400;

/** Calidad del JPEG resultante: por encima de 0,82 el archivo crece sin verse mejor. */
const CALIDAD = 0.82;

export interface FotoPreparada {
  /** Data URL lista para enviar al servidor. */
  dataUrl: string;
  /** Peso final en bytes, para poder mostrarlo. */
  bytes: number;
  ancho: number;
  alto: number;
}

/**
 * Reduce la foto y la devuelve como JPEG.
 *
 * Se usa `createImageBitmap` cuando existe porque respeta la orientación EXIF:
 * con `new Image()` las fotos verticales de iPhone aparecen acostadas.
 */
export async function prepararFoto(archivo: File): Promise<FotoPreparada> {
  if (!archivo.type.startsWith('image/')) {
    throw new Error('Ese archivo no es una imagen');
  }

  const bitmap =
    typeof createImageBitmap === 'function'
      ? await createImageBitmap(archivo, { imageOrientation: 'from-image' } as ImageBitmapOptions)
      : await cargarConImg(archivo);

  const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));
  const ancho = Math.round(bitmap.width * escala);
  const alto = Math.round(bitmap.height * escala);

  const lienzo = document.createElement('canvas');
  lienzo.width = ancho;
  lienzo.height = alto;
  const ctx = lienzo.getContext('2d');
  if (!ctx) throw new Error('No pudimos procesar la imagen');

  // Suavizado alto: al reducir mucho, sin esto los bordes quedan dentados.
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, ancho, alto);
  if ('close' in bitmap) (bitmap as ImageBitmap).close();

  const dataUrl = lienzo.toDataURL('image/jpeg', CALIDAD);
  // El data URL trae la cabecera y el relleno de base64; esto estima el peso real.
  const bytes = Math.round((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75);

  return { dataUrl, bytes, ancho, alto };
}

/** Respaldo para navegadores sin createImageBitmap. */
function cargarConImg(archivo: File): Promise<HTMLImageElement> {
  return new Promise((resolver, rechazar) => {
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolver(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      rechazar(new Error('No pudimos leer la imagen'));
    };
    img.src = url;
  });
}

/** Peso legible, para mostrarle a quien sube cuánto ocupó su foto. */
export function pesoLegible(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
