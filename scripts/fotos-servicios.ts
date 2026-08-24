/**
 * Asigna a cada servicio de uñas su propia foto.
 *
 * Las tres variantes de acrílicas compartían `/images/g-unas-diseno.jpg`: en el
 * catálogo se veían tres tarjetas idénticas con precios distintos, que es
 * justo la duda que uno no quiere sembrar antes de pagar. Con las fotos que
 * mandó Ignacia cada variante ya puede mostrar lo suyo.
 *
 * Va como script y no como migración porque `image_url` vive en la base de
 * producción y los archivos viven en el repo: hay que correrlo DESPUÉS de
 * desplegar, o las rutas nuevas apuntarían a imágenes que todavía no existen.
 *
 *   npm run db:fotos              muestra qué cambiaría, sin tocar nada
 *   npm run db:fotos -- --aplicar escribe los cambios
 */
import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('Falta DATABASE_URL. Corre el script con: npm run db:fotos');
  process.exit(1);
}
const sql = neon(url);

/** Patrón ILIKE por servicio: los nombres traen un guion largo que es fácil de escribir mal. */
const FOTOS: { patron: string; foto: string }[] = [
  { patron: 'Esmaltado Permanente', foto: '/images/g-unas-esmaltado.jpg' },
  { patron: '%Un Solo Color', foto: '/images/g-unas-color.jpg' },
  { patron: '%Con Dise_o', foto: '/images/g-unas-diseno.jpg' },
  { patron: '%Dise_o Premium', foto: '/images/g-unas-premium.jpg' },
];

async function main() {
  const aplicar = process.argv.includes('--aplicar');

  for (const { patron, foto } of FOTOS) {
    const filas = (await sql`
      SELECT id, name, image_url FROM services WHERE name ILIKE ${patron}
    `) as { id: string; name: string; image_url: string | null }[];

    if (filas.length === 0) {
      console.warn(`· sin coincidencias para "${patron}"`);
      continue;
    }

    for (const fila of filas) {
      if (fila.image_url === foto) {
        console.log(`= ${fila.name} ya usa ${foto}`);
        continue;
      }
      console.log(`${aplicar ? '✓' : '→'} ${fila.name}: ${fila.image_url ?? '(ninguna)'} → ${foto}`);
      if (aplicar) {
        await sql`UPDATE services SET image_url = ${foto} WHERE id = ${fila.id}`;
      }
    }
  }

  if (!aplicar) {
    console.log('\nNada se modificó. Para escribir: npm run db:fotos -- --aplicar');
  }
}

main().catch((e) => {
  console.error('No se pudo actualizar:', e);
  process.exit(1);
});
