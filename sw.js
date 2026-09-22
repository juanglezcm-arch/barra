/* Barra: service worker.
   Sube VERSION cada vez que cambies cualquier archivo: así el móvil descarga la versión nueva
   y la app ofrece "Actualizar". */
const VERSION = "barra-1.0.1";
const FILES = [
  "./", "index.html", "app.js", "catalogo.json", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "icons/apple-touch-icon.png",
  "fonts/barlow-condensed-latin-600-normal.woff2", "fonts/barlow-condensed-latin-700-normal.woff2",
  "fonts/barlow-condensed-latin-800-normal.woff2", "fonts/barlow-latin-400-normal.woff2", "fonts/barlow-latin-600-normal.woff2"
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("message", e => { if (e.data === "skipWaiting") self.skipWaiting(); });
// Primero la caché (arranque instantáneo y sin conexión); la versión nueva llega con el aviso de actualización.
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.match(e.request, {ignoreSearch: true}).then(r => r || fetch(e.request)));
});
