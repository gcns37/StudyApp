const CACHE_NAME = "unified-study-app-v7";
const BASE_URL = self.registration.scope;
const APP_FILES = [
  BASE_URL, BASE_URL + "index.html", BASE_URL + "manifest.webmanifest",
  BASE_URL + "icon-192.png", BASE_URL + "icon-512.png", BASE_URL + "apple-touch-icon.png"
];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith("unified-study-app-") && key !== CACHE_NAME).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || !url.href.startsWith(BASE_URL)) return;
  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(BASE_URL + "index.html", response.clone());
        }
        return response;
      } catch (error) {
        return (await caches.match(BASE_URL + "index.html")) || (await caches.match(BASE_URL)) || Response.error();
      }
    })());
    return;
  }
  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response && response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    } catch (error) { return Response.error(); }
  })());
});
