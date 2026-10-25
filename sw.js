/* Mountain Run offline helper (by Watson). Version: 2026-10-25.1
   Online: always fetches the newest files first, so new versions arrive at once.
   Offline: plays from the copy saved on the device at the last visit. */
const CACHE = "mountain-run-2026-10-25.1";
const FILES = [
 "./",
 "engine-setup.js?v=2026-10-25.1",
 "icons/icon-180.png",
 "icons/icon-192.png",
 "icons/icon-512.png",
 "index.html",
 "labyrinth-and-loop.js?v=2026-10-25.1",
 "manifest.json",
 "style.css?v=2026-10-25.1",
 "tablet-controls.css?v=2026-10-25.1",
 "tablet-controls.js?v=2026-10-25.1",
 "title.png",
 "train-and-pass.js?v=2026-10-25.1",
 "vendor/cdnjs.cloudflare.com_ajax_libs_three.js_r128_three.min.js"
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("mountain-run-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request).then(resp => {
      if (resp && resp.ok) { const copy = resp.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return resp;
    }).catch(() => caches.match(e.request, { ignoreSearch: false }).then(hit => hit || caches.match(e.request, { ignoreSearch: true })).then(hit => hit || caches.match("./")))
  );
});
