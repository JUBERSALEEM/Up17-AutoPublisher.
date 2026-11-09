/* Public-shell only. Never cache API/auth/account/analytics/media responses. */
const VERSION = "up17-shell-v1";
const OFFLINE = "/offline.html";
const PUBLIC_ASSETS = [
  OFFLINE,
  "/icons/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
];
const ALLOWED_PREFIXES = ["/_next/static/", "/icons/"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(PUBLIC_ASSETS)));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("up17-shell-") && key !== VERSION)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    // Navigations are network-only; the cached fallback contains no user data.
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE)));
    return;
  }
  if (url.search || !ALLOWED_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) return;
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok && response.type === "basic") {
            const copy = response.clone();
            event.waitUntil(caches.open(VERSION).then((cache) => cache.put(request, copy)));
          }
          return response;
        }),
    ),
  );
});
