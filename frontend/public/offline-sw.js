/* BUILD_CONFIG */
// Build embeds actual URLs and a content-derived release identifier.
const CACHE = 'kabadi-offline-' + RELEASE;
const valid = (path, response) => response.ok && !response.redirected &&
  (path === '/' ? response.headers.get('content-type')?.includes('text/html') :
    !response.headers.get('content-type')?.includes('text/html'));
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    for (const path of ASSETS) {
      const response = await fetch(path, { cache: 'reload' });
      if (!valid(path, response)) throw new Error('Offline download failed: ' + path);
      await cache.put(path, response);
    }
    // No skipWaiting: preserve open forms and sessions.
  })());
});
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
// Retain old releases, never delete files needed by an open session.
self.addEventListener('message', event => {
  if (event.data?.type !== 'OFFLINE_STATUS') return;
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE);
      const present = await Promise.all(ASSETS.map(async path => !!(await cache.match(path))));
      event.ports[0]?.postMessage({ ready: present.every(Boolean), release: RELEASE });
    } catch { event.ports[0]?.postMessage({ ready: false }); }
  })());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (/^\/(api|uploads|fast2sms-api)(\/|$)/.test(url.pathname)) return;
  const path = event.request.mode === 'navigate' ? '/' : url.pathname;
  if (!ASSETS.includes(path)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // Pin HTML and dependencies to one release. No mixed-release navigation.
    return (await cache.match(path)) || fetch(event.request);
  })());
});
