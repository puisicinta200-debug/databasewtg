// Service worker minimal untuk ICRM_JJC SOT Governance
// Tujuan utama: memenuhi syarat "installable PWA" agar bisa dibungkus jadi APK (TWA).
// Strategi sengaja dibuat ringan supaya TIDAK mengganggu data live dari Supabase / CDN.

const CACHE_NAME = 'icrm-jjc-shell-v1'; // naikkan versi (v2, v3, ...) tiap kali mau "memaksa" refresh shell
const SHELL_FILES = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// --- INSTALL: simpan file shell dasar untuk fallback offline ---
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

// --- ACTIVATE: bersihkan cache versi lama ---
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// --- FETCH ---
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Hanya tangani request GET
  if (req.method !== 'GET') return;

  const isSameOrigin = url.origin === self.location.origin;

  // Halaman utama (navigasi): coba network dulu (biar selalu dapat versi terbaru),
  // kalau offline baru pakai cache shell.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', res.clone()));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // File shell sendiri (manifest, icon) yang same-origin: cache-first ringan
  if (isSameOrigin && SHELL_FILES.some((f) => req.url.endsWith(f.replace('./', '')))) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req))
    );
    return;
  }

  // Semua request lain (Supabase API, CDN font/icon/Leaflet, dll):
  // biarkan lewat ke network apa adanya, JANGAN di-cache, supaya data selalu fresh/live.
  // (tidak event.respondWith() = browser handle seperti biasa)
});

// Opsional: terima sinyal dari halaman untuk langsung aktifkan SW baru tanpa tunggu reload kedua
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
