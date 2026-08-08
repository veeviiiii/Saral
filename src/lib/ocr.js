// On-device OCR with Tesseract.js — confidence gate + offline text extraction.
//
// Everything Tesseract needs is self-hosted under /tesseract/ (worker, wasm
// core, traineddata) and precached by the service worker, so OCR keeps working
// with zero network access — no CDN, no browser-cache luck. The core is pinned
// to the plain LSTM build (no SIMD requirement) so it runs on older budget
// phones too; slightly slower on new devices, works on all of them.
//
// Tesseract runs in its own Web Worker, so this never blocks the main thread.
// Everything is lazy + fail-safe: if the worker can't load or is slow, callers
// get null and just skip the feature.

// Base scripts always loaded: Latin (eng), Devanagari (hin — also covers
// Marathi/Sanskrit/Nepali/Konkani/Maithili), Bengali (ben — also Assamese).
const BASE_LANGS = ['eng', 'hin', 'ben']

// UI languages whose script has its own self-hosted traineddata beyond the
// base set. Odia/Malayalam/Punjabi/Urdu are not hosted (yet) — those fall back
// to the base set, which still yields amounts/dates/Latin text.
const EXTRA_TRAINEDDATA = { ta: 'tam', te: 'tel', gu: 'guj', kn: 'kan' }

let workerPromise = null
let workerLangs = '' // langs string the current worker was created with

// Compose the traineddata set for a UI language.
function langsFor(uiLang) {
  const extra = EXTRA_TRAINEDDATA[uiLang]
  return extra ? [...BASE_LANGS, extra].join('+') : BASE_LANGS.join('+')
}

async function getWorker(uiLang) {
  const langs = langsFor(uiLang)

  // If a worker exists but for a different language set (user switched to a
  // Tamil/Telugu/Gujarati/Kannada UI), replace it so their script is read.
  if (workerPromise && workerLangs !== langs) {
    const old = workerPromise
    workerPromise = null
    old.then((w) => w.terminate()).catch(() => {})
  }

  if (!workerPromise) {
    workerLangs = langs
    workerPromise = (async () => {
      const { createWorker } = await import('tesseract.js')
      // OEM 1 = LSTM, with the "_fast" traineddata — smallest + quickest.
      return createWorker(langs, 1, {
        workerPath: '/tesseract/worker.min.js',
        corePath: '/tesseract/tesseract-core-lstm.wasm.js',
        langPath: '/tesseract',
      })
    })().catch((err) => {
      workerPromise = null // allow a later retry
      throw err
    })
  }
  return workerPromise
}

// Download the worker + language data ahead of time (on Capture mount), so the
// first real recognition isn't waiting on a cold cache. Passing the UI language
// also pulls that script's traineddata into the service-worker cache while the
// user is still online.
export function warmUpOcr(uiLang) {
  getWorker(uiLang).catch(() => {
    /* ignore — feature just won't be available */
  })
}

// Returns Tesseract's overall confidence (0–100), or null if OCR failed, was
// unavailable, or exceeded `timeoutMs`. Never throws, never blocks the flow.
export async function getOcrConfidence(image, timeoutMs = 5000, uiLang) {
  let timer
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve(null), timeoutMs)
  })

  const work = (async () => {
    try {
      const worker = await getWorker(uiLang)
      const { data } = await worker.recognize(image)
      return typeof data?.confidence === 'number' ? data.confidence : null
    } catch {
      return null
    }
  })()

  const result = await Promise.race([work, timeout])
  clearTimeout(timer)
  return result
}

// Full OCR for the offline fallback: returns { text, confidence } or null on
// failure/timeout. Same lazy, fail-safe worker as getOcrConfidence.
export async function getOcrText(image, timeoutMs = 8000, uiLang) {
  let timer
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve(null), timeoutMs)
  })

  const work = (async () => {
    try {
      const worker = await getWorker(uiLang)
      const { data } = await worker.recognize(image)
      return {
        text: data?.text || '',
        confidence: typeof data?.confidence === 'number' ? data.confidence : null,
      }
    } catch {
      return null
    }
  })()

  const result = await Promise.race([work, timeout])
  clearTimeout(timer)
  return result
}
