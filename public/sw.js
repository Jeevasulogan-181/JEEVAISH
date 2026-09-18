// Minimal service worker — just enough for "installable PWA" + a bit of
// offline resilience for static assets. Deliberately does NOT cache
// /api/* responses (chat, gallery, notes, etc. must always be live data).

const CACHE_NAME = "cosmicus-static-v1"
const PRECACHE_URLS = ["/icons/icon-192.png", "/icons/icon-512.png", "/manifest.webmanifest"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Never intercept API calls — always go to the network for live data.
  if (url.pathname.startsWith("/api/")) return

  // Static build assets & icons: cache-first for speed + offline support.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((res) => {
          const copy = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
          return res
        })
      })
    )
    return
  }

  // Everything else (pages): network-first, so logged-in/out state is
  // always current; no offline fallback page to avoid showing stale UI.
  event.respondWith(fetch(request).catch(() => caches.match(request)))
})
