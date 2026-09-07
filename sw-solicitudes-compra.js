const CACHE_NAME = 'solicitudes-compra-cadasa-v1';
const APP_FILES = [
  './index.html',
  './manifest-solicitudes-compra.webmanifest'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES).catch(() => {}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith('solicitudes-compra-cadasa-') && key !== CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const scopeUrl = new URL(self.registration.scope);
  if (url.origin !== scopeUrl.origin || !url.pathname.startsWith(scopeUrl.pathname)) return;

  // Nunca redirigir navegaciones de otras apps hacia este index.
  // Solo damos fallback al index cuando se solicita la raíz de ESTA carpeta o su propio index.
  if (req.mode === 'navigate') {
    const appRoot = scopeUrl.pathname;
    const ownIndex = appRoot + 'index.html';
    if (url.pathname !== appRoot && url.pathname !== ownIndex) return;

    event.respondWith((async () => {
      try {
        return await fetch(req);
      } catch (_) {
        return (await caches.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const response = await fetch(req);
      return response;
    } catch (_) {
      return Response.error();
    }
  })());
});
