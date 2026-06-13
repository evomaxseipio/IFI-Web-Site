const CACHE_VERSION = 'ifi-v8';
const STATIC_CACHE = `ifi-static-${CACHE_VERSION}`;
const ROOT = new URL('./', self.location).href;

const PRECACHE = [
  ROOT,
  new URL('index.html', ROOT).href,
  new URL('manifest.webmanifest', ROOT).href,
  new URL('assets/logo.png', ROOT).href,
  new URL('assets/icon-192.png', ROOT).href,
  new URL('assets/icon-512.png', ROOT).href,
  new URL('assets/icon-512-maskable.png', ROOT).href,
  new URL('assets/apple-touch-icon.png', ROOT).href,
  new URL('assets/favicon-32.png', ROOT).href,
  new URL('assets/foto-pastor.webp', ROOT).href,
  new URL('assets/foto-pastora.webp', ROOT).href,
];

const INDEX_URL = new URL('index.html', ROOT).href;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key.startsWith('ifi-') && key !== STATIC_CACHE).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(INDEX_URL, copy));
          }
          return response;
        })
        .catch(() => caches.match(INDEX_URL))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);

      return cached || network;
    })
  );
});
