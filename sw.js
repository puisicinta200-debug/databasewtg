// ============================================================
//  ICRM_JJC — Service Worker (Network-First)
//  PRINSIP: Data SELALU dari Supabase (network-first)
//  Cache HANYA untuk shell app (HTML/CSS/font) saat offline
//  API/Supabase calls: TIDAK PERNAH di-cache
// ============================================================

const CACHE_NAME = 'icrm-shell-v1';

// Hanya cache file statis shell — BUKAN data
const SHELL_FILES = [
  '/',
  '/index-icrm-online.html',
  'https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap',
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// URL yang TIDAK BOLEH di-cache sama sekali
const NO_CACHE_PATTERNS = [
  'supabase.co',        // Semua request ke Supabase
  'supabase.io',
  '/rest/v1/',          // Supabase REST API
  '/realtime/',         // Supabase Realtime
  '/auth/v1/',          // Supabase Auth
  '/storage/v1/',       // Supabase Storage
];

function isNoCacheUrl(url) {
  return NO_CACHE_PATTERNS.some(p => url.includes(p));
}

// ── INSTALL: cache shell files
self.addEventListener('install', function(event) {
  console.log('[SW] Install — caching shell only');
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      // Cache satu per satu, jangan gagal semua kalau satu error
      return Promise.allSettled(
        SHELL_FILES.map(function(url) {
          return cache.add(url).catch(function(err) {
            console.warn('[SW] Gagal cache:', url, err.message);
          });
        })
      );
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// ── ACTIVATE: hapus cache lama
self.addEventListener('activate', function(event) {
  console.log('[SW] Activate — clean old caches');
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) {
              console.log('[SW] Hapus cache lama:', k);
              return caches.delete(k);
            })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// ── FETCH: Network-First untuk semua request
self.addEventListener('fetch', function(event) {
  var url = event.request.url;

  // Supabase & API: SELALU network, tidak pernah cache
  if (isNoCacheUrl(url)) {
    event.respondWith(fetch(event.request));
    return;
  }

  // POST/PUT/DELETE/PATCH: SELALU network
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  // GET untuk shell/static: Network-first, fallback ke cache
  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // Update cache dengan versi terbaru
        if (response && response.status === 200 && response.type !== 'opaque') {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(function() {
        // Network gagal → ambil dari cache (offline mode)
        return caches.match(event.request).then(function(cached) {
          if (cached) {
            console.log('[SW] Offline — serve from cache:', url);
            return cached;
          }
          // Tidak ada di cache — kembalikan halaman utama
          return caches.match('/') || caches.match('/index-icrm-online.html');
        });
      })
  );
});
