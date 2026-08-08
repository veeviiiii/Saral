// Tiny static server for dist/ with an airplane-mode kill switch (test tool).
//
// Serves the production build like `vite preview`, plus two control endpoints
// that make real offline testing possible without pulling the plug on the
// process (which would kill browser-automation sessions attached to it):
//
//   GET /__offline[?ms=90000]  → from now on, every request's socket is
//                                destroyed immediately (no HTTP response at
//                                all — exactly what airplane mode looks like
//                                to the app). Auto-restores after `ms`
//                                (default 90s) as a safety net, since once
//                                offline you can't reach /__online.
//   GET /__online              → restore normal serving (only reachable
//                                before /__offline or after auto-restore).
//
// Usage: npm run serve:prod  (vite build && node scripts/serve-dist.mjs)

import http from 'node:http'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIST = fileURLToPath(new URL('../dist', import.meta.url))
const PORT = 4173

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
  '.gz': 'application/gzip', // served as opaque bytes; tesseract.js gunzips itself
  '.wasm': 'application/wasm',
  '.woff2': 'font/woff2',
}

let offline = false
let restoreTimer = null

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)

  // Control endpoints — always reachable so tests can toggle the mode.
  if (url.pathname === '/__offline') {
    offline = true
    const ms = Number(url.searchParams.get('ms')) || 90000
    clearTimeout(restoreTimer)
    restoreTimer = setTimeout(() => {
      offline = false
      console.log('[serve-dist] auto-restored to ONLINE')
    }, ms)
    console.log(`[serve-dist] OFFLINE for ${ms}ms — all requests will be dropped`)
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    return res.end('offline')
  }
  if (url.pathname === '/__online') {
    offline = false
    clearTimeout(restoreTimer)
    console.log('[serve-dist] ONLINE')
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    return res.end('online')
  }

  // Airplane mode: destroy the socket — no response, no status, nothing.
  if (offline) {
    req.socket.destroy()
    return
  }

  // Static file resolution with SPA fallback (mirrors vercel.json's rewrite).
  let filePath = normalize(join(DIST, decodeURIComponent(url.pathname)))
  if (!filePath.startsWith(normalize(DIST))) {
    res.writeHead(403)
    return res.end()
  }
  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = join(DIST, 'index.html') // SPA fallback
  }

  try {
    const body = readFileSync(filePath)
    res.writeHead(200, {
      'Content-Type': MIME[extname(filePath)] || 'application/octet-stream',
      'Cache-Control': url.pathname.startsWith('/assets/')
        ? 'public, max-age=31536000, immutable'
        : 'no-cache',
    })
    res.end(body)
  } catch {
    res.writeHead(500)
    res.end()
  }
})

server.listen(PORT, () => {
  console.log(`[serve-dist] serving dist/ on http://localhost:${PORT}`)
})
