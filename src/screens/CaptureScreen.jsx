import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../state/LanguageContext.jsx'
import { fileToCompressedBase64 } from '../lib/image.js'
import { explainDocument } from '../lib/gemini.js'
import { API_LANGUAGE_NAME } from '../i18n/strings.js'
import { warmUpClassifier, classifyImage } from '../lib/classify.js'
import { warmUpOcr, getOcrConfidence } from '../lib/ocr.js'
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

// Tesseract confidence thresholds.
const OCR_HARD = 40 // below this → block with a retake prompt
const OCR_SOFT = 70 // below this → soft warning, but proceed

export default function CaptureScreen({ onBack, onResult, onLanguage }) {
  const { t, lang } = useLanguage()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const [pill, setPill] = useState(null) // { state: 'analysing' } | { state: 'done', type }
  const [ocrWarning, setOcrWarning] = useState(null) // 'soft' | 'hard' | null
  const cameraRef = useRef(null)
  const galleryRef = useRef(null)
  const mounted = useRef(true)
  const pendingImage = useRef(null) // image awaiting a "Try anyway" decision

  // Warm up both on-device models in the background while the user frames their
  // shot, so neither one stalls the capture. Both fail silently if unavailable.
  useEffect(() => {
    mounted.current = true
    warmUpClassifier()
    warmUpOcr()
    return () => {
      mounted.current = false
    }
  }, [])

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

    // Feature 2 — OCR confidence gate (skipped if OCR is slow/unavailable → null).
    const confidence = await getOcrConfidence(dataUrl, 5000)
    if (!mounted.current) return

    if (confidence !== null && confidence < OCR_HARD) {
      // Too blurry — stop and let the user decide.
      pendingImage.current = img
      setBusy(false)
      setOcrWarning('hard')
      return
    }
    if (confidence !== null && confidence < OCR_SOFT) {
      setOcrWarning('soft') // shown above the spinner; we still proceed
    }

    await runGemini(img)
  }

  function retake() {
    setOcrWarning(null)
    setPill(null)
    setError(false)
    pendingImage.current = null
    cameraRef.current?.click()
  }

  function tryAnyway() {
    setOcrWarning(null)
    if (pendingImage.current) runGemini(pendingImage.current)
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
            {/* Soft blur warning — sits above the spinner, flow still proceeds. */}
            {ocrWarning === 'soft' ? (
              <div className="mx-auto flex max-w-[20rem] items-start gap-2.5 rounded-2xl bg-marigold-soft px-3.5 py-3 text-left">
                <Warning size={20} className="mt-0.5 shrink-0 text-caution" />
                <span className="text-[14px] leading-snug text-ink/80">{t('ocrSoftWarn')}</span>
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
              <Button full variant="primary" icon={<Camera />} onClick={() => cameraRef.current?.click()}>
                {t('takePhoto')}
              </Button>
              <Button full variant="ghost" icon={<ImageIcon />} onClick={() => galleryRef.current?.click()}>
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
