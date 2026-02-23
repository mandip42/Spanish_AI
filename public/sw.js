// Minimal service worker: cache shell for offline; AI requires internet.
const CACHE = "spanish-ai-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => {
      return cache.addAll(["/", "/manifest.json"]);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.url.includes("/api/") || event.request.mode === "cors") {
    return;
  }
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then((r) => r || caches.match("/"))
    )
  );
});
