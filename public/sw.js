// ApexBee PWA Service Worker
const CACHE_NAME = "apexbee-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/icon.jpeg",
  "/manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = event.request.url;
  // Skip dev server, API requests, and Vite modules
  if (
    event.request.method !== "GET" ||
    url.includes("/api/") ||
    url.includes("/@vite") ||
    url.includes("/@fs") ||
    url.includes("/src/") ||
    url.includes("localhost") ||
    url.includes("127.0.0.1")
  ) {
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        if (event.request.headers.get("accept")?.includes("text/html")) {
          return caches.match("/index.html");
        }
      });
    })
  );
});
