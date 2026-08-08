// Saral — service worker (app-shell, network-first navigation, offline OCR).
//
// Why network-first for HTML: the app is built with content-hashed assets
// (/assets/index-XXXX.js). If we served a cached index.html, after a new
// deploy it would point at old hashes that 404 → blank screen. So navigations
// always go to the network; the cache is only an offline fallback. Hashed
// assets are immutable, so those are safe to cache-first.
//
// Offline OCR: everything Tesseract needs is self-hosted under /tesseract/
// and cached here, so Samjhao's offline fallback works with zero network —
// not just when the browser happens to still have a CDN response cached.

const CACHE = 'saral-shell-v3'
const APP_SHELL = ['/index.html', '/manifest.webmanifest', '/icon.svg']

// OCR assets the offline fallback cannot work without: the Tesseract worker,
// the wasm core (plain LSTM build — runs on any device), and the traineddata
// always loaded (Latin + Devanagari + Bengali). ~7 MB — install fails and
// retries if any of these can't be fetched, because offline OCR is the point.
const OCR_CRITICAL = [
  '/tesseract/worker.min.js',
  '/tesseract/tesseract-core-lstm.wasm.js',
  '/tesseract/eng.traineddata.gz',
  '/tesseract/hin.traineddata.gz',
  '/tesseract/ben.traineddata.gz',
]

// High-population extra scripts (~5 MB): precached best-effort — a flaky
// connection must not brick the whole install. Anything missed here is picked
// up by the cache-first /tesseract/ route the moment that language's OCR runs
// online once (Capture warms the current language's traineddata on mount).
const OCR_EXTRA = [
  '/tesseract/tam.traineddata.gz',
  '/tesseract/tel.traineddata.gz',
  '/tesseract/guj.traineddata.gz',
  '/tesseract/kan.traineddata.gz',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (c) => {
      await c.addAll([...APP_SHELL, ...OCR_CRITICAL])
      // Best-effort: cache each extra traineddata independently.
      await Promise.allSettled(OCR_EXTRA.map((url) => c.add(url)))
    }),
  )
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

  // Hashed build assets + Tesseract files: cache-first. Build assets change
  // filename every build; Tesseract files are pinned to the shipped version —
  // both are effectively immutable, so cached copies are always safe.
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/tesseract/')) {
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
