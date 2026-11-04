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

// Traineddata for each UI language's script. Latin (eng) is always loaded on
// top, because Indian bills print the parts we actually extract — amounts,
// dates, account numbers — in Latin digits even when the body text is in a
// regional script.
//
// Loading *only* these two matters enormously for speed: Tesseract runs every
// loaded language model over every text line, so the eng+hin+ben set this used
// to load made a dense bill roughly three times slower to read. Languages whose
// traineddata we don't self-host (Malayalam, Odia, Punjabi, Urdu) simply run
// Latin-only, which still recovers the numeric fields.
const SCRIPT_TRAINEDDATA = {
  hi: 'hin', mr: 'hin', sa: 'hin', ne: 'hin', kok: 'hin', mai: 'hin',
  bn: 'ben', as: 'ben',
  ta: 'tam', te: 'tel', gu: 'guj', kn: 'kan',
}

let workerPromise = null
let workerLangs = '' // langs string the current worker was created with

// Compose the traineddata set for a UI language.
function langsFor(uiLang) {
  const script = SCRIPT_TRAINEDDATA[uiLang]
  return script ? `eng+${script}` : 'eng'
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
      const worker = await createWorker(langs, 1, {
        workerPath: '/tesseract/worker.min.js',
        corePath: '/tesseract/tesseract-core-lstm.wasm.js',
        langPath: '/tesseract',
      })
      // We hand Tesseract a ~300 DPI render (see fileToOcrImage). Telling it so
      // stops it inferring scale from the pixel dimensions, which it otherwise
      // gets wrong on a cropped phone photo and which skews its internal
      // thresholds for what counts as a text line.
      await worker.setParameters({ user_defined_dpi: '300' })
      return worker
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
