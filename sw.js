/* KasKu service worker — menyimpan tampilan aplikasi agar bisa dibuka tanpa sinyal.
   Data keuangan TIDAK disimpan di sini (selalu diambil dari Google Sheets). */
const CACHE = 'kasku-v1';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // permintaan ke API (POST) tidak pernah di-cache
  const url = new URL(req.url);
  if (url.hostname.includes('script.google')) return;
  if (url.origin === location.origin) {
    // Tampilan aplikasi: coba jaringan dulu (agar update cepat), kalau offline pakai cache
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
  } else if (url.hostname.includes('fonts.g')) {
    // Font: cache dulu
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; })));
  }
});
