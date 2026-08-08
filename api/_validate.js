// Shared input/request guards for the Gemini proxies. Underscore-prefixed so
// Vercel does not expose this as an API route.

// Max base64 length accepted for an uploaded image: ~5 MB decoded (base64 is
// ~4/3 of the raw bytes). Vercel already caps the whole body ~4.5 MB, but an
// explicit guard rejects early with a clear 413 and bounds per-call token cost.
export const MAX_IMAGE_B64 = 6_800_000

// Only real image types Gemini can read as inlineData. Anything else (a text
// file renamed .jpg, text/html, …) is rejected before we spend a Gemini call.
export const IMAGE_MIME_ALLOWLIST = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/heic',
  'image/heif',
])

// The only language names the client ever sends (API_LANGUAGE_NAME values).
// The `language` string is interpolated into the system prompt, so restricting
// it to this allowlist closes it as a prompt-injection / token-cost channel.
const ALLOWED_LANGUAGES = new Set([
  'Hindi', 'English', 'Marathi', 'Bengali', 'Tamil', 'Telugu', 'Kannada',
  'Malayalam', 'Gujarati', 'Punjabi', 'Odia', 'Assamese', 'Urdu', 'Sanskrit',
  'Nepali', 'Konkani', 'Maithili',
])

// Return a known language name, or fall back to English. Never returns
// attacker-controlled text.
export function sanitizeLanguage(language) {
  const s = typeof language === 'string' ? language.trim() : ''
  return ALLOWED_LANGUAGES.has(s) ? s : 'English'
}

function hostOf(urlStr) {
  try {
    return new URL(urlStr).host
  } catch {
    return null
  }
}

// Same-origin check: a legitimate browser POST from the Saral frontend carries
// an Origin header equal to this deployment's host. Cross-origin browsers and
// header-less direct scripts are rejected. NOT spoof-proof (a determined caller
// can forge Origin) — it's a cheap filter that stops casual abuse, layered on
// top of the rate limiter. Set ALLOW_ANY_ORIGIN=1 to disable (e.g. debugging).
export function allowedOrigin(req) {
  if (process.env.ALLOW_ANY_ORIGIN === '1') return true
  const host = req.headers?.host
  if (!host) return true // can't determine our own host → fail open, don't block

  const origin = req.headers?.origin
  if (origin) return hostOf(origin) === host

  const referer = req.headers?.referer || req.headers?.referrer
  if (referer) return hostOf(referer) === host

  // Browser POST fetches always send Origin; missing both → not a real browser
  // request from our page. Block it.
  return false
}
