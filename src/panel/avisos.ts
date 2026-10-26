import { nombreDelAparato, panelApi } from './api-panel';

/**
 * Avisos push en ESTE aparato. Cada teléfono y cada computador se suscribe
 * por separado: la suscripción identifica al navegador, no a la persona.
 */
const SW = `${__RUTA_PANEL__}/sw.js`;
const ALCANCE = `${__RUTA_PANEL__}/`;

export type EstadoAvisos =
  | 'cargando'
  | 'sin-soporte'
  | 'necesita-instalar'
  | 'apagado'
  | 'encendido'
  | 'bloqueado';

/** ¿El panel está abierto como app instalada y no como pestaña? */
export function estaInstalada(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export const esIos = () => /iPhone|iPad/.test(navigator.userAgent);

/** La llave VAPID viaja en base64url y el navegador la pide como bytes. */
function aBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const relleno = '='.repeat((4 - (base64url.length % 4)) % 4);
  const crudo = atob((base64url + relleno).replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(new ArrayBuffer(crudo.length));
  for (let i = 0; i < crudo.length; i++) bytes[i] = crudo.charCodeAt(i);
  return bytes;
}
const mismosBytes = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((x, i) => x === b[i]);

/**
 * El registro del service worker del panel, ya activo. No usa
 * `navigator.serviceWorker.ready`: si el alcance no coincide exacto con la
 * página, no resuelve nunca y el botón quedaría pensando para siempre. Esto
 * tiene tope de tiempo.
 */
async function prepararWorker(): Promise<ServiceWorkerRegistration> {
  const registro =
    (await navigator.serviceWorker.getRegistration(ALCANCE)) ??
    (await navigator.serviceWorker.register(SW, { scope: ALCANCE }));
  if (registro.active) return registro;
  const worker = registro.installing ?? registro.waiting;
  if (!worker) return registro;
  await new Promise<void>((resolver, rechazar) => {
    const tope = setTimeout(() => rechazar(new Error('La app no terminó de instalarse a tiempo.')), 15_000);
    worker.addEventListener('statechange', () => {
      if (worker.state === 'activated') {
        clearTimeout(tope);
        resolver();
      } else if (worker.state === 'redundant') {
        clearTimeout(tope);
        rechazar(new Error('El navegador descartó la app.'));
      }
    });
  });
  return registro;
}

const guardar = (s: PushSubscription) =>
  panelApi.avisos('suscribir', { suscripcion: s.toJSON(), aparato: nombreDelAparato() });

/**
 * Cómo están los avisos acá. Si están activos, se vuelve a registrar la
 * suscripción en el servidor: que el teléfono la tenga no significa que la
 * base también, y así no queda "activado" sin recibir nada.
 */
export async function estadoAvisos(llave: string): Promise<EstadoAvisos> {
  if (!llave) return 'sin-soporte';
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    // En iPhone el push solo existe con la app instalada en la pantalla de inicio.
    return esIos() && !estaInstalada() ? 'necesita-instalar' : 'sin-soporte';
  }
  if (Notification.permission === 'denied') return 'bloqueado';
  const registro = await prepararWorker();
  const suscripcion = await registro.pushManager.getSubscription();
  if (!suscripcion) return 'apagado';
  // Hecha con otra llave VAPID: ya no recibe nada de lo que se firma ahora.
  const suya = suscripcion.options.applicationServerKey;
  if (suya && !mismosBytes(new Uint8Array(suya), aBytes(llave))) {
    await suscripcion.unsubscribe();
    return 'apagado';
  }
  await guardar(suscripcion);
  return 'encendido';
}

/** Pide el permiso: tiene que salir de un toque, si no el navegador lo niega. */
export async function encenderAvisos(llave: string): Promise<EstadoAvisos> {
  const permiso = await Notification.requestPermission();
  if (permiso !== 'granted') return permiso === 'denied' ? 'bloqueado' : 'apagado';
  const registro = await prepararWorker();
  const suscripcion = await registro.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: aBytes(llave),
  });
  await guardar(suscripcion);
  return 'encendido';
}

export async function apagarAvisos(): Promise<void> {
  const registro = await navigator.serviceWorker.getRegistration(ALCANCE);
  const suscripcion = await registro?.pushManager.getSubscription();
  if (!suscripcion) return;
  await suscripcion.unsubscribe();
  await panelApi.avisos('quitar', { endpoint: suscripcion.endpoint }).catch(() => undefined);
}

/** Aviso de prueba solo a este aparato. Devuelve a cuántos llegó. */
export async function probarAvisos(): Promise<number> {
  const registro = await navigator.serviceWorker.getRegistration(ALCANCE);
  const suscripcion = await registro?.pushManager.getSubscription();
  if (!suscripcion) return 0;
  const r = await panelApi.avisos<{ enviados: number }>('probar', { endpoint: suscripcion.endpoint });
  return r.enviados;
}

/** Al abrir la app: si los avisos estaban activos, se re-registran en silencio. */
export async function mantenerAvisosAlDia(): Promise<void> {
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const { llave } = await panelApi.llaveAvisos();
    await estadoAvisos(llave);
  } catch {
    /* sin señal o sin soporte: se reintenta en la próxima apertura */
  }
}
