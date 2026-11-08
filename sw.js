const CACHE_NAME = "scratch-editor-v2";

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const response = await fetch("./precache.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load precache.json");

    const files = await response.json();
    const cache = await caches.open(CACHE_NAME);

    for (let i = 0; i < files.length; i += 8) {
      await Promise.all(
        files.slice(i, i + 8).map(async file => {
          const response = await fetch(file, { cache: "reload" });
          if (!response.ok) throw new Error("Failed to cache " + file);
          await cache.put(file, response);
        })
      );
    }

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
        return await cache.match("./index.html");
      }
      throw new Error("File unavailable offline");
    }
  })());
});
