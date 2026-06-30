// On-device OCR confidence check with Tesseract.js.
//
// We don't care about the extracted text — only Tesseract's overall confidence
// score, which we use as a cheap "is this photo legible?" signal before paying
// for a Gemini call. Tesseract runs in its own Web Worker, so this never blocks
// the main thread. Everything is lazy + fail-safe: if the worker can't load or
// is slow, getOcrConfidence resolves to null and the caller just skips the gate.

let workerPromise = null

async function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import('tesseract.js')
      // OEM 1 = LSTM, plus the "_fast" traineddata — smallest + quickest models,
      // which is all we need for a confidence score (speed over accuracy).
      // eng+hin covers Latin + Devanagari (Hindi/Marathi); ben covers Bengali.
      return createWorker('eng+hin+ben', 1, {
        langPath: 'https://tessdata.projectnaptha.com/4.0.0_fast',
      })
    })().catch((err) => {
      workerPromise = null // allow a later retry
      throw err
    })
  }
  return workerPromise
}

// Download the worker + language data ahead of time (on Capture mount), so the
// first real recognition isn't waiting on a cold cache.
export function warmUpOcr() {
  getWorker().catch(() => {
    /* ignore — feature just won't be available */
  })
}

// Returns Tesseract's overall confidence (0–100), or null if OCR failed, was
// unavailable, or exceeded `timeoutMs`. Never throws, never blocks the flow.
export async function getOcrConfidence(image, timeoutMs = 5000) {
  let timer
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve(null), timeoutMs)
  })

  const work = (async () => {
    try {
      const worker = await getWorker()
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
export async function getOcrText(image, timeoutMs = 8000) {
  let timer
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve(null), timeoutMs)
  })

  const work = (async () => {
    try {
      const worker = await getWorker()
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
