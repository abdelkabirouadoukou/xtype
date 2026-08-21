const CACHE = "xtype-v1";
const PRECACHE = [
  "/katex/katex.min.css",
  "/workers/compiler.js",
  "/workers/typst-engine.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;

  const isAsset =
    url.pathname.startsWith("/wasm/") ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname.startsWith("/katex/") ||
    url.pathname.startsWith("/workers/") ||
    url.pathname.startsWith("/_islands/");
  if (!isAsset) return;

  event.respondWith(
    caches.match(event.request).then(
      (hit) =>
        hit ??
        fetch(event.request).then((res) => {
          const copy = res.clone();
          void caches.open(CACHE).then((c) => c.put(event.request, copy));
          return res;
        }),
    ),
  );
});
