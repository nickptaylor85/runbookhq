// Watchtower Service Worker — network-first with offline fallback
const CACHE = 'wt-v1';
const OFFLINE_URL = '/offline';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll([
      '/offline',
      '/manifest.json',
    ]))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Only handle GET, skip API calls (always network)
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('/api/')) return;

  e.respondWith(
    fetch(e.request)
      .then(r => {
        // Cache successful page fetches
        if (r.status === 200 && e.request.destination === 'document') {
          const clone = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return r;
      })
      .catch(() => caches.match(e.request).then(cached => cached || caches.match(OFFLINE_URL)))
  );
});
