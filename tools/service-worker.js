/*
 * The offline cache. The build fills in VERSION and FILES (every file of the site) and writes
 * this as sw.js. Each version gets its own cache, filled when it installs, so a phone has the
 * whole helper after its first visit and plays with no signal.
 *
 * Pages: the network first (a new version shows up as soon as there is signal), falling back to
 * the cache after a few seconds. Everything else: the cache first.
 */
const VERSION = '__VERSION__';
const FILES = __FILES__;
const CACHE = `inscryption-helper-${VERSION}`;
const PAGE_TIMEOUT_MS = 3000;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('inscryption-helper-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function fromNetwork(request, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('slow')), ms);
    fetch(request).then((r) => { clearTimeout(timer); resolve(r); }, (e) => { clearTimeout(timer); reject(e); });
  });
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(
      fromNetwork(request, PAGE_TIMEOUT_MS)
        .then((r) => {
          if (r.ok) caches.open(CACHE).then((c) => c.put('./', r.clone()));
          return r;
        })
        .catch(() => caches.match('./', { ignoreVary: true }).then((r) => r || Response.error())),
    );
    return;
  }
  event.respondWith(
    // ignoreVary: a module script asks with an Origin header the cached copy didn't have.
    caches.match(request, { ignoreVary: true }).then((hit) => hit || fetch(request).then((r) => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(request, copy)); }
      return r;
    })),
  );
});
