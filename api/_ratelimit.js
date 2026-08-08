// Best-effort per-IP rate limiter for the Gemini proxies.
//
// WHY: /api/gemini and /api/ask are unauthenticated, so anyone who finds the
// URL can call them and burn the project's Gemini quota/billing. This caps how
// fast a single IP can do that.
//
// LIMITATION (read before trusting this): Vercel serverless functions are
// ephemeral and horizontally scaled — this in-memory counter lives only inside
// one warm instance, so a determined attacker spread across instances/IPs is
// not fully stopped. It is a real speed-bump against casual abuse and runaway
// clients, NOT a hard guarantee. For durable, global limits use Vercel KV /
// Upstash Redis keyed by IP. This module is intentionally dependency-free so it
// works with zero setup.
//
// Underscore-prefixed filename → Vercel does not expose it as an API route.

const WINDOW_MS = 60_000 // 1 minute
const MAX_PER_WINDOW = 20 // generous for a real user scanning + asking follow-ups
const buckets = new Map() // ip -> { count, resetAt }

// Best-effort client IP. On Vercel the real client IP is the first entry of
// x-forwarded-for; fall back to the socket address locally.
export function clientIp(req) {
  const xff = req.headers?.['x-forwarded-for']
  if (typeof xff === 'string' && xff.length) return xff.split(',')[0].trim()
  return req.socket?.remoteAddress || 'unknown'
}

// Returns true if allowed. If the limit is exceeded, writes a 429 (with
// Retry-After) and returns false — the caller should just `return`.
export function rateLimit(req, res, { max = MAX_PER_WINDOW, windowMs = WINDOW_MS } = {}) {
  const ip = clientIp(req)
  const now = Date.now()

  let b = buckets.get(ip)
  if (!b || now > b.resetAt) {
    b = { count: 0, resetAt: now + windowMs }
    buckets.set(ip, b)
  }
  b.count += 1

  // Keep the Map from growing unbounded on a long-lived warm instance.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (now > v.resetAt) buckets.delete(k)
  }

  if (b.count > max) {
    const retryAfter = Math.max(1, Math.ceil((b.resetAt - now) / 1000))
    res.setHeader('Retry-After', String(retryAfter))
    res.status(429).json({ error: 'Too many requests. Please wait a moment and try again.' })
    return false
  }
  return true
}
