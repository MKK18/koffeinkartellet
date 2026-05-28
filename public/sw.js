// Minimal service worker — enables "Add to Home Screen" installability
// and caches the SPA shell so the app opens fast (especially when launched
// from the home screen). API calls (/api/*) are NOT cached — they hit
// PocketBase live so data is always current.

const CACHE = "koffein-shell-v1";
const SHELL = ["/", "/index.html", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Never cache API or admin dashboard requests.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_/")) return;
  // Cache-first for the rest (HTML shell, JS, CSS, icons).
  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        // Stash successful same-origin GET responses for next time.
        if (res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => caches.match("/"));
    })
  );
});
