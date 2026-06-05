const CACHE_VERSION = 3;
const CACHE_NAME = `prephub-v${CACHE_VERSION}`;

// Replaced at build time by vite-plugin-sw with actual hashed asset paths.
// In dev this falls back to the minimal list.
const PRECACHE_URLS = '__PRECACHE_MANIFEST__';
const precache = Array.isArray(PRECACHE_URLS)
  ? PRECACHE_URLS
  : ['/index.html', '/offline.html'];

// ── Install: precache app shell + built assets ──────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(precache))
  );
  self.skipWaiting();
});

// ── Activate: purge old caches ──────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((n) => n.startsWith('prephub-') && n !== CACHE_NAME)
          .map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch strategies ────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.origin !== location.origin) return;

  // ─ Navigation (HTML pages) ─
  // Network-first, fall back to cached /index.html so React Router
  // can resolve the route offline.  Last resort: offline.html.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          // A deep-link refresh (e.g. /category/foo) on a host without SPA
          // rewrites returns a 404/5xx. Don't surface it and don't cache it —
          // fall back to the cached app shell so React Router resolves the route.
          if (!res.ok) {
            return caches
              .match('/index.html')
              .then((cached) => cached || res);
          }
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put('/index.html', clone));
          return res;
        })
        .catch(() =>
          caches
            .match('/index.html')
            .then((cached) => cached || caches.match('/offline.html'))
        )
    );
    return;
  }

  // ─ Hashed assets (/assets/*) — immutable, cache-first ─
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(CACHE_NAME).then((c) => c.put(request, clone));
            }
            return res;
          })
      )
    );
    return;
  }

  // ─ Other same-origin resources — stale-while-revalidate ─
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
