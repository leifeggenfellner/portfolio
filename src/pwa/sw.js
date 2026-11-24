/*
 * The service worker, written into dist/sw.js at build time with this
 * build's version and file list (see the "service-worker" integration in
 * astro.config.ts). After one visit the whole site works offline.
 *
 * - Precaches every page and asset of the build on install.
 * - Hashed assets (/_astro/) never change: cache first.
 * - Pages: stale-while-revalidate, so a visit is instant and the next one
 *   sees the latest build.
 * - A new build waits until the page asks it to take over (the taskbar's
 *   "Update ready" button), so nothing changes under an open desktop.
 */
const VERSION = "__VERSION__";
const PRECACHE = __PRECACHE__;
const CACHE = `retro-os-${VERSION}`;

// Tell open pages how far the precache is, for the BIOS log on a first visit
// (src/lib/os/boot-tasks.ts). They aren't controlled yet, hence includeUncontrolled.
async function reportPrecache(done, total) {
  const pages = await self.clients.matchAll({ includeUncontrolled: true, type: "window" });
  for (const page of pages) page.postMessage({ type: "precache", done, total });
}

self.addEventListener("install", (event) => {
  const total = PRECACHE.length;
  let done = 0;
  // One add per file rather than addAll, to count them; any failure still fails the install.
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(
        PRECACHE.map((url) =>
          cache.add(url).then(() => {
            done += 1;
            return reportPrecache(done, total);
          }),
        ),
      ),
    ),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "skip-waiting") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (url.pathname.includes("/_astro/")) {
    // ignoreVary: module scripts and fonts are requested with an Origin header
    // the precached copies didn't have, and servers vary on it.
    event.respondWith(caches.match(request, { ignoreVary: true }).then((hit) => hit ?? fetch(request)));
    return;
  }

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(request, { ignoreSearch: true, ignoreVary: true });
      const fresh = fetch(request)
        .then((response) => {
          if (response.ok) void cache.put(request, response.clone());
          return response;
        })
        .catch(() => hit);
      if (hit) {
        event.waitUntil(fresh);
        return hit;
      }
      return fresh;
    }),
  );
});
