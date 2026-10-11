/* BUILD_CONFIG */
// Build embeds actual URLs and a content-derived release identifier.
const CACHE = 'kabadi-offline-' + RELEASE;
const isAI = path => /\/models\/|\.(wasm|mjs)$/.test(path);
let downloading = false;
let failures = {};
let downloadTask;
async function status() {
  const cache = await caches.open(CACHE);
  const missing = [];
  for (const path of ASSETS) if (!(await cache.match(path))) missing.push(path);
  return { ready: missing.length === 0, appReady: !missing.some(path => !isAI(path)),
    aiReady: !missing.some(isAI), completed: ASSETS.length - missing.length,
    total: ASSETS.length, missing, failures, downloading, release: RELEASE };
}
const valid = (path, response) => response.ok && !response.redirected &&
  (path === '/' ? response.headers.get('content-type')?.includes('text/html') :
    !response.headers.get('content-type')?.includes('text/html'));
function downloadMissing() {
  if (downloadTask) return downloadTask;
  downloading = true;
  downloadTask = (async () => {
    failures = {};
    const cache = await caches.open(CACHE);
    // Basic app first. Missing AI files must not prevent manual offline use.
    for (const path of [...ASSETS.filter(p => !isAI(p)), ...ASSETS.filter(isAI)]) {
      if (await cache.match(path)) continue;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 60000);
      try {
        const response = await fetch(path, { cache: 'reload', signal: controller.signal });
        if (!valid(path, response)) throw new Error('HTTP ' + response.status + ' or invalid file type');
        if (path === '/') {
          const html = await response.clone().text();
          const entry = ASSETS.find(p => /\/assets\/index-.*\.js$/.test(p));
          if (entry && !html.includes(entry)) throw new Error('RELEASE_CHANGED: save work and reopen all app tabs');
        }
        await cache.put(path, response);
      } catch (error) {
        failures[path] = error.name === 'QuotaExceededError' ? 'STORAGE_FULL' :
          error.name === 'AbortError' ? 'DOWNLOAD_TIMEOUT' : String(error.message || 'DOWNLOAD_FAILED');
      } finally { clearTimeout(timer); }
    }
  })().catch(error => { failures.setup = error.name || 'STORAGE_UNAVAILABLE'; })
    .finally(() => { downloading = false; downloadTask = undefined; });
  return downloadTask;
}
self.addEventListener('install', event => {
  // Partial downloads remain repairable; readiness never reports success early.
  event.waitUntil(downloadMissing().then(async () => {
    // Never replace an existing working release with an incomplete update.
    if (self.registration.active && !(await status()).ready) throw new Error('Incomplete update retained previous release');
  }));
  // No skipWaiting: preserve open forms and sessions.
});
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
// Retain old releases, never delete files needed by an open session.
self.addEventListener('message', event => {
  if (!['OFFLINE_STATUS', 'OFFLINE_RETRY'].includes(event.data?.type)) return;
  event.waitUntil((async () => {
    try {
      if (event.data.type === 'OFFLINE_RETRY') {
        const task = downloadMissing();
        event.ports[0]?.postMessage(await status());
        await task;
      } else event.ports[0]?.postMessage(await status());
    } catch { event.ports[0]?.postMessage({ ready: false, failures: { setup: 'STORAGE_UNAVAILABLE' } }); }
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
