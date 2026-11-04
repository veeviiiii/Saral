import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../state/LanguageContext.jsx'
import { fileToCompressedBase64, fileToOcrImage } from '../lib/image.js'
import { explainDocument } from '../lib/gemini.js'
import { API_LANGUAGE_NAME } from '../i18n/strings.js'
import { warmUpClassifier, classifyImage } from '../lib/classify.js'
import { warmUpOcr, getOcrText } from '../lib/ocr.js'
import { buildOfflineResult } from '../lib/offlineExplain.js'
import { useOnline } from '../lib/useOnline.js'
import Header from '../components/Header.jsx'
import Button from '../components/Button.jsx'
import { Camera, ImageIcon, Warning } from '../components/Icon.jsx'

// MobileNet category → i18n type-label key.
const TYPE_KEY = {
  document: 'mlTypeDocument',
  letter: 'mlTypeLetter',
  screenshot: 'mlTypeScreenshot',
  other: 'mlTypeOther',
}

// Blur threshold for the offline path, calibrated on dev/ocr-bench.html.
// Feeding OCR a clean ~300 DPI render moved legible documents from the mid 50s
// up to a tight 93-95 band, while a deliberately unreadable photo still scores
// 0 — so the old value of 40 (tuned when *good* photos only reached the 50s)
// would now wave through images that are genuinely unusable.
//
// It stays well below the clean band rather than hugging it: blocking is the
// expensive mistake, since telling someone their perfectly readable bill must
// be retaken is far worse than proceeding on a mediocre one, and real-world
// photos score lower than the synthetic pages this was measured on.
const OCR_HARD = 45 // below this → offer a retake instead of a summary

// Preprocessing a ~300 DPI page and reading it takes a few seconds here and
// several times that on a mid-range phone. Generous on purpose: this exists to
// stop a wedged worker hanging the UI, not to cut normal work short — and the
// offline path has no fallback, so waiting beats returning nothing.
const OCR_TEXT_TIMEOUT = 25000

export default function CaptureScreen({ onBack, onResult, onLanguage }) {
  const { t, lang } = useLanguage()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const [pill, setPill] = useState(null) // { state: 'analysing' } | { state: 'done', type }
  const [ocrWarning, setOcrWarning] = useState(null) // 'soft' | 'hard' | null
  const [offlineMode, setOfflineMode] = useState(false)
  const online = useOnline()
  const cameraRef = useRef(null)
  const galleryRef = useRef(null)
  const mounted = useRef(true)
  const pendingImage = useRef(null) // image awaiting a "Try anyway" decision
  const pendingOcrText = useRef('') // text already read from it, reused on "Try anyway"

  // Warm up both on-device models in the background while the user frames their
  // shot, so neither one stalls the capture. Both fail silently if unavailable.
  useEffect(() => {
    mounted.current = true
    warmUpClassifier()
    warmUpOcr(lang) // also pulls this language's traineddata into the SW cache
    return () => {
      mounted.current = false
    }
  }, [lang])

  // Send the document to Gemini and hand the result (plus image) up.
  async function runGemini(img) {
    setBusy(true)
    try {
      const data = await explainDocument({
        imageBase64: img.base64,
        mimeType: img.mimeType,
        language: API_LANGUAGE_NAME[lang],
      })
      // Pass the image up too, so the result screen can re-translate on language change.
      onResult(data, { imageBase64: img.base64, mimeType: img.mimeType })
    } catch {
      if (mounted.current) {
        setError(true)
        setPill(null)
        setOcrWarning(null)
      }
    } finally {
      if (mounted.current) setBusy(false)
    }
  }

  async function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-picking the same file
    if (!file) return

    setError(false)
    setPill(null)
    setOcrWarning(null)
    setOfflineMode(false)
    pendingImage.current = null

    let img
    try {
      img = await fileToCompressedBase64(file)
    } catch {
      setError(true)
      return
    }
    const dataUrl = `data:${img.mimeType};base64,${img.base64}`

    // Show the processing spinner straight away (covers OCR + Gemini).
    setBusy(true)

    // Feature 1 — instant on-device pre-classification pill (runs in parallel).
    setPill({ state: 'analysing' })
    classifyImage(dataUrl)
      .then((type) => {
        if (!mounted.current) return
        // A null result means the model was unavailable — drop the pill silently.
        setPill(type ? { state: 'done', type } : null)
      })
      .catch(() => mounted.current && setPill(null))

    // Feature 4 — offline fallback: no internet → OCR + rule-based summary
    // instead of Gemini. Same result schema (low confidence), so the same card
    // renders. Pass no image so the result screen won't try to re-translate.
    if (!online) {
      setOfflineMode(true)
      // Offline is the only path that needs the big cleaned-up render, so the
      // cost of building it is paid here and nowhere else. getOcrText hands
      // back Tesseract's confidence alongside the text, so the blur check comes
      // free — no second recognition pass just to score the photo.
      let ocrImage = dataUrl
      try {
        ocrImage = await fileToOcrImage(file)
      } catch {
        /* fall back to the compressed image rather than losing OCR entirely */
      }
      const ocr = await getOcrText(ocrImage, OCR_TEXT_TIMEOUT, lang)
      if (!mounted.current) return

      if (ocr && ocr.confidence !== null && ocr.confidence < OCR_HARD) {
        // Nothing legible came back and there's no Gemini to fall back on —
        // better to ask for a clearer photo than to invent a summary from noise.
        pendingImage.current = img
        pendingOcrText.current = ocr.text || ''
        setBusy(false)
        setOcrWarning('hard')
        return
      }
      onResult(buildOfflineResult(ocr?.text || '', lang), null)
      return
    }

    // Online we go straight to Gemini. The old flow ran a full OCR pass first,
    // purely to decide whether the photo was worth sending — which meant every
    // scan waited seconds for a check that Gemini makes redundant: it reads
    // mediocre photos perfectly well and reports its own confidence, which the
    // result card already surfaces as a "check this with someone you trust"
    // nudge. Preprocessing also runs synchronous pixel work on the main thread,
    // so merely starting it alongside the request still janked the UI. The blur
    // gate now lives only on the offline path, where OCR is the sole reader.
    try {
      const data = await explainDocument({
        imageBase64: img.base64,
        mimeType: img.mimeType,
        language: API_LANGUAGE_NAME[lang],
      })
      if (!mounted.current) return
      setBusy(false)
      // Pass the image up too, so the result screen can re-translate on language change.
      onResult(data, { imageBase64: img.base64, mimeType: img.mimeType })
    } catch {
      if (!mounted.current) return
      setError(true)
      setPill(null)
      setOcrWarning(null)
      setBusy(false)
    }
  }

  function retake() {
    setOcrWarning(null)
    setPill(null)
    setError(false)
    pendingImage.current = null
    cameraRef.current?.click()
  }

  // "Try anyway" after a blur warning. The gate only fires offline now, so this
  // normally means: build the summary from whatever text we did manage to read.
  // Kept the online branch for the case where connectivity returns in between.
  function tryAnyway() {
    setOcrWarning(null)
    if (!pendingImage.current) return
    if (online) {
      runGemini(pendingImage.current)
      return
    }
    setBusy(true)
    onResult(buildOfflineResult(pendingOcrText.current || '', lang), null)
  }

  const pillText = pill
    ? pill.state === 'analysing'
      ? t('mlAnalysing')
      : t('mlLooksLike', { type: t(TYPE_KEY[pill.type] || 'mlTypeOther') })
    : ''

  return (
    <div className="flex min-h-screen flex-col">
      <Header onBack={onBack} title={t('samjhaoTitle')} onLanguage={onLanguage} />

      <main className="flex flex-1 flex-col px-5 pt-6">
        {/* Instant classification pill — shows before Gemini responds. */}
        {pill ? (
          <div className="mb-4 flex justify-center">
            <div className="saral-rise inline-flex items-center gap-2 rounded-full border border-line bg-indigo-tint px-3.5 py-1.5 text-[13px] font-medium text-indigo">
              {pill.state === 'analysing' ? (
                <span className="saral-spin h-3.5 w-3.5 rounded-full border-2 border-indigo/25 border-t-indigo" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-marigold" />
              )}
              <span>{pillText}</span>
            </div>
          </div>
        ) : null}

        {busy ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 pb-16 text-center">
            {/* Offline notice — we're building a basic summary without Gemini. */}
            {offlineMode ? (
              <div className="mx-auto max-w-[20rem] rounded-2xl border border-line bg-indigo-tint px-3.5 py-3 text-[14px] leading-snug text-indigo">
                {t('offlineBanner')}
              </div>
            ) : null}
            <span className="saral-spin h-14 w-14 rounded-full border-4 border-line border-t-marigold" />
            <div>
              <p className="font-display text-xl font-semibold text-indigo">{t('reading')}</p>
              <p className="mt-1 text-ink/60">{t('readingWait')}</p>
            </div>
          </div>
        ) : ocrWarning === 'hard' ? (
          <div className="flex flex-1 flex-col px-1 pt-2">
            <div className="flex flex-1 flex-col items-center justify-center gap-4 pb-4 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-caution-soft text-caution">
                <Warning size={40} />
              </div>
              <p className="mx-auto max-w-[18rem] text-[17px] leading-snug text-ink/80">
                {t('ocrHardWarn')}
              </p>
            </div>
            <div className="flex flex-col gap-3 pb-8">
              <Button full variant="primary" icon={<Camera />} onClick={retake}>
                {t('retake')}
              </Button>
              <Button full variant="ghost" onClick={tryAnyway}>
                {t('tryAnyway')}
              </Button>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-1 flex-col px-1 pt-2">
            <div className="flex flex-1 flex-col items-center justify-center gap-4 pb-4 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-caution-soft text-caution">
                <Warning size={40} />
              </div>
              <div>
                <p className="font-display text-xl font-semibold text-ink">{t('errorTitle')}</p>
                <p className="mx-auto mt-1 max-w-[18rem] text-ink/70">{t('errorBody')}</p>
              </div>
            </div>
            <div className="pb-8">
              <Button full variant="primary" icon={<Camera />} onClick={() => cameraRef.current?.click()}>
                {t('takePhoto')}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Viewfinder placeholder / hint */}
            <div className="flex flex-1 flex-col items-center justify-center gap-5 pb-4 text-center">
              <div className="flex h-44 w-44 items-center justify-center rounded-3xl border-2 border-dashed border-line bg-indigo-tint text-indigo">
                <Camera size={56} />
              </div>
              <p className="max-w-[16rem] text-[17px] text-ink/70">{t('captureHint')}</p>
            </div>

            <div className="flex flex-col gap-3 pb-8">
              <Button full variant="primary" icon={<Camera />} data-tour="capture-camera" onClick={() => cameraRef.current?.click()}>
                {t('takePhoto')}
              </Button>
              <Button full variant="ghost" icon={<ImageIcon />} data-tour="capture-gallery" onClick={() => galleryRef.current?.click()}>
                {t('chooseFromGallery')}
              </Button>
            </div>
          </>
        )}

        {/* Hidden inputs: camera (capture) + gallery */}
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFile}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
      </main>
    </div>
  )
}
