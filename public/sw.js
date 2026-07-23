// ApexBee PWA Service Worker
const CACHE_NAME = "apexbee-pwa-v2";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

// Fetch listener required for PWA install prompt eligibility
self.addEventListener("fetch", (event) => {
  const url = event.request.url;
  // Always let live network handle API and dev server HMR requests
  if (
    event.request.method !== "GET" ||
    url.includes("/api/") ||
    url.includes("/@vite") ||
    url.includes("/@fs") ||
    url.includes("/src/")
  ) {
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).catch(() => cached);
    })
  );
});
