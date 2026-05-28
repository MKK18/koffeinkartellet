// Service worker — network-first for HTML/navigation so deploys are picked up
// immediately; cache-first for hashed JS/CSS/images (cheap & safe — those URLs
// only change when their content does).
//
// VERSION is replaced at build time with a unique timestamp (see the `build`
// script in package.json). Every deploy gets a fresh value, which makes the
// browser see this SW file as changed → new SW installs → skipWaiting +
// clients.claim run → controllerchange fires in main.jsx → page auto-reloads
// onto the new bundle. Without this, the SW never updates and users
// (especially PWA-installed ones) keep running the old code until they
// manually clear cache.

const VERSION = "__BUILD_ID__";
const CACHE = `koffein-${VERSION}`;

self.addEventListener("install", () => {
  // Take over as soon as the new SW is installed — no waiting for tab close.
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Never intercept API or admin dashboard requests.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_/")) return;

  // Navigation requests + HTML: network-first so updates are immediate.
  const isHTML = req.mode === "navigate" || (req.headers.get("Accept") || "").includes("text/html");
  if (isHTML) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((c) => c || caches.match("/")))
    );
    return;
  }

  // Everything else (hashed assets, icons): cache-first.
  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      });
    })
  );
});
