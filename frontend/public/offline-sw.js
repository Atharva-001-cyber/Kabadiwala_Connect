const CACHE = 'kabadi-offline-shell-v1';
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const manifest = await fetch('/offline-assets.json', { cache: 'no-store' });
    if (!manifest.ok) throw new Error('Offline shell manifest unavailable');
    const cache = await caches.open(CACHE);
    await cache.addAll(await manifest.json());
    // Do not skipWaiting: an open tab keeps its current app version until reload.
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  // API/auth/uploads are never cached, including on the same origin.
  if (/^\/(api|uploads|fast2sms-api)(\/|$)/.test(url.pathname)) return;
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const response = await fetch(event.request);
        if (response.ok && response.headers.get('content-type')?.includes('text/html')) await cache.put('/', response.clone());
        return response;
      } catch {
        return (await cache.match('/')) || Response.error();
      }
    })());
  } else if (/^\/(assets|models)\//.test(url.pathname) || /^\/ort-.*\.wasm$/.test(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(event.request);
      if (hit) return hit;
      const response = await fetch(event.request);
      if (response.ok) await cache.put(event.request, response.clone());
      return response;
    })());
  }
});
