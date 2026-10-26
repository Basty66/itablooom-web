import webpush from 'web-push';
import type { NeonQueryFunction } from '@neondatabase/serverless';
import { RUTA_PANEL } from './ruta.js';
import { asegurarTablas } from './panel/tablas.js';

/**
 * Avisos push al teléfono de Ignacia.
 *
 * Cuando ella activa los avisos en un aparato, el navegador genera una
 * suscripción —una URL única de ESE navegador en ESE aparato, más dos llaves
 * de cifrado— y se guarda en admin_suscripciones. Se avisa a todas: teléfono
 * y computador. Las clientas nunca reciben nada por acá.
 *
 * En iPhone solo funciona con el panel instalado en la pantalla de inicio
 * (iOS 16.4 o superior): Safari abierto como pestaña no recibe push.
 */
type Sql = NeonQueryFunction<false, false>;

export const LLAVE_PUBLICA = process.env.VAPID_PUBLICA ?? '';
const PRIVADA = process.env.VAPID_PRIVADA ?? '';
const CONTACTO = process.env.VAPID_CONTACTO ?? 'mailto:goddess.studio.melipilla@gmail.com';

export const HAY_AVISOS = Boolean(LLAVE_PUBLICA && PRIVADA);
if (HAY_AVISOS) webpush.setVapidDetails(CONTACTO, LLAVE_PUBLICA, PRIVADA);

export interface Aviso {
  titulo: string;
  cuerpo: string;
  /** Pantalla del panel que abre al tocarlo. */
  url?: string;
  /** Mismo tag = reemplaza al aviso anterior en vez de apilarse. */
  tag?: string;
}

/**
 * Manda el aviso a los aparatos registrados (o solo a uno, para la prueba).
 *
 * Las suscripciones se rompen solas: se reinstala la app, se borran los
 * datos o se quita el permiso. El servicio push responde 404 o 410 y esa
 * fila se borra en el acto; si no, se acumulan y cada aviso tarda más.
 */
export async function avisar(
  sql: Sql,
  aviso: Aviso,
  soloA?: string
): Promise<{ enviados: number; limpiados: number }> {
  if (!HAY_AVISOS) return { enviados: 0, limpiados: 0 };
  await asegurarTablas(sql);

  const suscripciones = (await sql`
    SELECT endpoint, p256dh, auth FROM admin_suscripciones
    WHERE ${soloA ?? null}::TEXT IS NULL OR endpoint = ${soloA ?? null}
  `) as { endpoint: string; p256dh: string; auth: string }[];

  const carga = JSON.stringify({ ...aviso, url: aviso.url ?? `${RUTA_PANEL}/` });
  let enviados = 0;
  const muertas: string[] = [];

  await Promise.all(
    suscripciones.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          carga,
          { TTL: 60 * 60 * 24, urgency: 'high' }
        );
        enviados++;
      } catch (error) {
        const codigo = (error as { statusCode?: number }).statusCode;
        if (codigo === 404 || codigo === 410) muertas.push(s.endpoint);
        else console.error('Aviso push no entregado:', codigo, (error as Error).message);
      }
    })
  );

  if (muertas.length > 0) await sql`DELETE FROM admin_suscripciones WHERE endpoint = ANY(${muertas})`;
  if (enviados > 0) {
    await sql`
      UPDATE admin_suscripciones SET ultimo_envio = now()
      WHERE endpoint = ANY(${suscripciones.map((s) => s.endpoint)}) AND endpoint <> ALL(${muertas})
    `;
  }
  return { enviados, limpiados: muertas.length };
}

/**
 * Como avisar(), pero sin hacer esperar más de unos segundos a quien llamó.
 * El webhook de Mercado Pago no puede quedarse colgado por un aviso: si
 * tarda en responder, Mercado Pago lo reintenta.
 */
export async function avisarSinDemorar(sql: Sql, aviso: Aviso, msMaximo = 4000): Promise<void> {
  await Promise.race([
    avisar(sql, aviso).catch((e) => console.error('Error al enviar avisos:', e)),
    new Promise((r) => setTimeout(r, msMaximo)),
  ]);
}
