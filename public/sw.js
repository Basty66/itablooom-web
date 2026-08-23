/*
 * Service worker mínimo: existe para que el sitio se pueda instalar como app,
 * no para acelerar la carga.
 *
 * La estrategia es deliberadamente conservadora. Un service worker agresivo
 * sirve versiones viejas después de un despliegue, y acá eso significaría
 * mostrar precios u horarios que ya cambiaron. Entonces:
 *
 *  - Nada de /api/ se guarda nunca: son la agenda y los datos de las clientas,
 *    y una respuesta cacheada mostraría cupos libres que ya no existen.
 *  - El resto va a la red primero y solo cae en la copia guardada si el
 *    teléfono está sin señal.
 */
const CACHE = 'goddess-v1';

self.addEventListener('install', (evento) => {
  // Toma el control sin esperar a que se cierren las pestañas viejas.
  self.skipWaiting();
  evento.waitUntil(caches.open(CACHE));
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    (async () => {
      // Borra versiones anteriores del caché en cada despliegue.
      const nombres = await caches.keys();
      await Promise.all(nombres.filter((n) => n !== CACHE).map((n) => caches.delete(n)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (evento) => {
  const { request } = evento;

  // Solo GET: un POST cacheado sería una reserva o un pago repetido.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  evento.respondWith(
    (async () => {
      try {
        const respuesta = await fetch(request);
        // Solo se guardan respuestas completas y correctas.
        if (respuesta && respuesta.status === 200 && respuesta.type === 'basic') {
          const cache = await caches.open(CACHE);
          cache.put(request, respuesta.clone());
        }
        return respuesta;
      } catch {
        const guardada = await caches.match(request);
        if (guardada) return guardada;
        // Navegación sin señal y sin copia: al menos devolvemos la portada.
        if (request.mode === 'navigate') {
          const inicio = await caches.match('/');
          if (inicio) return inicio;
        }
        throw new Error('sin conexión');
      }
    })()
  );
});
