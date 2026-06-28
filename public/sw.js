// Saral — service worker (app-shell, network-first navigation).
//
// Why network-first for HTML: the app is built with content-hashed assets
// (/assets/index-XXXX.js). If we served a cached index.html, after a new
// deploy it would point at old hashes that 404 → blank screen. So navigations
// always go to the network; the cache is only an offline fallback. Hashed
// assets are immutable, so those are safe to cache-first.

const CACHE = 'saral-shell-v2'
const APP_SHELL = ['/index.html', '/manifest.webmanifest', '/icon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(APP_SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/')) return // never touch the API

  // HTML / navigations: network-first so a new deploy always loads.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((resp) => {
          const copy = resp.clone()
          caches.open(CACHE).then((c) => c.put('/index.html', copy))
          return resp
        })
        .catch(() => caches.match('/index.html')),
    )
    return
  }

  // Hashed build assets: cache-first (filenames change every build → safe).
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((resp) => {
            const copy = resp.clone()
            caches.open(CACHE).then((c) => c.put(request, copy))
            return resp
          }),
      ),
    )
    return
  }

  // Everything else (icons, manifest, dev modules): straight to network.
})
