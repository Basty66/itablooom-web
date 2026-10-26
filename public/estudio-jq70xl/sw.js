/*
 * Service worker del panel. Alcance: solo /estudio-jq70xl/.
 *
 * Dos trabajos: recibir los avisos push y abrir el panel al tocarlos, y
 * dejar abrir la app sin señal con la última versión vista. Nunca guarda
 * nada de /api/: la agenda y los datos de las clientas siempre vienen frescos.
 */
const PANEL = '/estudio-jq70xl';
const CACHE = 'panel-v1';

self.addEventListener('install', (evento) => {
  self.skipWaiting();
  evento.waitUntil(caches.open(CACHE).then((c) => c.add(`${PANEL}/`)).catch(() => undefined));
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    (async () => {
      const nombres = await caches.keys();
      await Promise.all(nombres.filter((n) => n.startsWith('panel-') && n !== CACHE).map((n) => caches.delete(n)));
      await self.clients.claim();
    })()
  );
});

/* Solo la página del panel: red primero; sin señal, la última copia. */
self.addEventListener('fetch', (evento) => {
  const { request } = evento;
  if (request.method !== 'GET' || request.mode !== 'navigate') return;
  evento.respondWith(
    fetch(request)
      .then((respuesta) => {
        const copia = respuesta.clone();
        caches.open(CACHE).then((c) => c.put(`${PANEL}/`, copia)).catch(() => undefined);
        return respuesta;
      })
      .catch(() => caches.match(`${PANEL}/`))
  );
});

self.addEventListener('push', (evento) => {
  let datos = {};
  try {
    datos = evento.data ? evento.data.json() : {};
  } catch {
    datos = { cuerpo: evento.data ? evento.data.text() : '' };
  }

  evento.waitUntil(
    self.registration.showNotification(datos.titulo || 'Goddess Studio', {
      body: datos.cuerpo || '',
      icon: '/icons/icono-192.png',
      // Android pinta la insignia de una sola tinta: la silueta del laurel.
      badge: `${PANEL}/insignia-96.png`,
      data: { url: datos.url || `${PANEL}/` },
      tag: datos.tag || 'goddess',
      renotify: true,
      vibrate: [120, 60, 120],
    })
  );
});

/* Al tocar el aviso: si el panel ya está abierto, lo trae al frente en la
   pantalla del aviso; si no, lo abre. */
self.addEventListener('notificationclick', (evento) => {
  evento.notification.close();
  const destino = (evento.notification.data && evento.notification.data.url) || `${PANEL}/`;

  evento.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ventanas) => {
      for (const v of ventanas) {
        if (v.url.includes(PANEL) && 'focus' in v) {
          v.navigate(destino);
          return v.focus();
        }
      }
      return self.clients.openWindow(destino);
    })
  );
});
