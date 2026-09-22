/**
 * Service Worker for Emotional Intelligence Healer PWA
 * Tiered caching strategy for instant loads:
 *   - Cache First: static assets, fonts, icons, images
 *   - Stale While Revalidate: HTML pages, manifest
 *   - Network First: API routes
 */

const CACHE_NAME = 'eih-pwa-v5';
const STATIC_CACHE = 'eih-static-v5';
const FONT_CACHE = 'eih-fonts-v1';

const PRECACHE_URLS = [
  '/',
  '/manifest.webmanifest',
  '/audio-worklet-processor.js',
  '/hypnotic-circles.webp',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

/* ─── Install: Precache critical shell & activate immediately ─── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

/* ─── Message: Support programmatic instant activation from app ─── */
self.addEventListener('message', (event) => {
  if (event.data && (event.data.type === 'SKIP_WAITING' || event.data === 'skipWaiting')) {
    self.skipWaiting();
  }
});

/* ─── Activate: Clean stale caches immediately & claim clients ─── */
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, STATIC_CACHE, FONT_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !currentCaches.includes(name))
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

/* ─── Periodic Background Sync: Auto-update cache when app is not open ─── */
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'eih-periodic-update' || event.tag === 'check-update') {
    event.waitUntil(
      fetch('/api/version?_t=' + Date.now(), { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.buildId) {
            return caches.open(CACHE_NAME).then((cache) => {
              return Promise.allSettled(
                PRECACHE_URLS.map((u) =>
                  fetch(u + '?_bg=' + Date.now(), { cache: 'no-store' }).then((r) => {
                    if (r.ok) return cache.put(u, r);
                  })
                )
              );
            });
          }
        })
        .catch(() => {})
    );
  }
});

/* ─── Background Sync on reconnect ─── */
self.addEventListener('sync', (event) => {
  if (event.tag === 'eih-sync-knowledge' || event.tag === 'check-update') {
    event.waitUntil(
      fetch('/api/library/sync', { cache: 'no-store' }).catch(() => {})
    );
  }
});

/* ─── Helper: Is this a static asset? ─── */
function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(js|css|woff|woff2|ttf|otf|png|jpg|jpeg|webp|svg|ico|avif)$/) ||
    url.pathname.includes('/icons/')
  );
}

/* ─── Helper: Is this a Google Font request? ─── */
function isGoogleFont(url) {
  return (
    url.origin === 'https://fonts.googleapis.com' ||
    url.origin === 'https://fonts.gstatic.com'
  );
}

/* ─── Helper: Is this an API request? ─── */
function isApiRequest(url) {
  return url.pathname.startsWith('/api/');
}

/* ─── Fetch: Tiered caching strategy ─── */
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 1. CACHE FIRST — Static assets & Next.js chunks (immutable, hashed filenames)
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // 2. CACHE FIRST — Google Fonts (rarely change)
  if (isGoogleFont(url)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(FONT_CACHE).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // 3. NETWORK ONLY — API routes (never cache therapeutic responses)
  if (isApiRequest(url)) {
    return; // Let the browser handle it normally
  }

  // 4. NETWORK FIRST — HTML pages & navigation (always load latest deployment when online)
  const isNavigation =
    event.request.mode === 'navigate' ||
    event.request.destination === 'document' ||
    url.pathname === '/' ||
    !url.pathname.includes('.');

  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // If network fails (offline), serve from cache
          return caches.match(event.request).then((cached) => cached || caches.match('/'));
        })
    );
    return;
  }

  // 5. STALE WHILE REVALIDATE — Images, audio worklets, other media
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
