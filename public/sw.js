/* Minimal PWA service worker — network-first with offline shell cache. */
const CACHE = "ene-gameverse-v2";

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(["/", "/manifest.json", "/images/hero.jpg"]))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches
            .open(CACHE)
            .then((c) => c.put(e.request, copy))
            .catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(e.request).then((m) => m || Response.error()))
  );
});
