const CACHE_NAME = "scratch-editor-v1";

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const response = await fetch("./precache.json");
    const files = await response.json();
    const cache = await caches.open(CACHE_NAME);

    await cache.addAll(files);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();

    await Promise.all(
      keys.filter(key => key.startsWith("scratch-editor-") && key !== CACHE_NAME)
        .map(key => caches.delete(key))
    );

    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(event.request);

    if (cached) return cached;

    try {
      return await fetch(event.request);
    } catch {
      if (event.request.mode === "navigate") {
        return cache.match("./index.html");
      }
      throw new Error("This file is not available offline.");
    }
  })());
});
