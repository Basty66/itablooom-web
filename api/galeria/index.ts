import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { put, del } from '@vercel/blob';
import { exigirSesion } from '../_shared/auth.js';

const sql = neon(process.env.DATABASE_URL!);

/*
 * Galería de antes y después.
 *
 * Las tres operaciones viven en un solo archivo porque el plan admite doce
 * funciones y esta es la última: listar es público, subir y borrar exigen
 * sesión. El método distingue la operación.
 *
 * Las fotos llegan ya redimensionadas desde el navegador. Una foto de celular
 * pesa entre 3 y 8 MB y el cuerpo de una función serverless admite 4,5: subir
 * el archivo original fallaría, y además dejaría la galería lentísima.
 */

const MAX_BYTES = 1_500_000; // por imagen, ya redimensionada
const FORMATOS = ['image/jpeg', 'image/png', 'image/webp'];

/** Convierte el data URL que manda el navegador en bytes y su tipo. */
function desdeDataUrl(dataUrl: string): { bytes: Buffer; tipo: string } | null {
  const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl || '');
  if (!m) return null;
  const [, tipo, base64] = m;
  if (!FORMATOS.includes(tipo)) return null;
  const bytes = Buffer.from(base64, 'base64');
  if (bytes.length > MAX_BYTES) return null;
  return { bytes, tipo };
}

function extension(tipo: string): string {
  return tipo === 'image/png' ? 'png' : tipo === 'image/webp' ? 'webp' : 'jpg';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // ---- Listado público: alimenta la galería del sitio ----
    if (req.method === 'GET') {
      const filas = await sql`
        SELECT id, titulo, categoria, antes_url, despues_url, orden
        FROM galeria
        WHERE activo = true
        ORDER BY orden ASC, created_at DESC
      `;
      return res.status(200).json(filas);
    }

    // De acá en adelante, solo con sesión: se sube y se borra material del
    // estudio, y las fotos muestran a clientas reales.
    if (await exigirSesion(req, res)) return;

    if (req.method === 'POST') {
      const { titulo, categoria, antes, despues } = req.body || {};

      if (!titulo || String(titulo).trim().length < 2) {
        return res.status(400).json({ error: 'Ponle un título al trabajo' });
      }

      const a = desdeDataUrl(antes);
      const d = desdeDataUrl(despues);
      if (!a || !d) {
        return res.status(400).json({
          error: 'Las imágenes deben ser JPG, PNG o WebP y pesar menos de 1,5 MB cada una',
        });
      }

      const sello = Date.now();
      const base = `galeria/${sello}`;
      // `addRandomSuffix` evita que dos subidas del mismo segundo se pisen.
      const subidaAntes = await put(`${base}-antes.${extension(a.tipo)}`, a.bytes, {
        access: 'public',
        contentType: a.tipo,
        addRandomSuffix: true,
      });
      const subidaDespues = await put(`${base}-despues.${extension(d.tipo)}`, d.bytes, {
        access: 'public',
        contentType: d.tipo,
        addRandomSuffix: true,
      });

      const [fila] = await sql`
        INSERT INTO galeria (titulo, categoria, antes_url, despues_url, antes_path, despues_path, orden)
        VALUES (
          ${String(titulo).trim()},
          ${categoria || null},
          ${subidaAntes.url},
          ${subidaDespues.url},
          ${subidaAntes.pathname},
          ${subidaDespues.pathname},
          ${Math.floor(sello / 1000)}
        )
        RETURNING id, titulo, categoria, antes_url, despues_url
      `;
      return res.status(201).json(fila);
    }

    if (req.method === 'DELETE') {
      const id = String(req.query.id || '');
      const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!UUID.test(id)) return res.status(400).json({ error: 'Identificador inválido' });

      const [fila] = (await sql`
        SELECT antes_url, despues_url FROM galeria WHERE id = ${id}
      `) as any[];
      if (!fila) return res.status(404).json({ error: 'Ese trabajo ya no existe' });

      /*
       * Primero se borran los archivos y después la fila. Si se hiciera al
       * revés y el borrado del archivo fallara, quedaría ocupando espacio sin
       * ninguna fila que lo recuerde: basura imposible de encontrar.
       */
      try {
        await del([fila.antes_url, fila.despues_url]);
      } catch (e) {
        console.error('No se pudieron borrar los archivos de la galería:', e);
      }

      await sql`DELETE FROM galeria WHERE id = ${id}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    console.error('Error en galería:', error);
    return res.status(500).json({ error: 'No pudimos completar la operación' });
  }
}
