import { useRef, useState } from 'react'
import { useLanguage } from '../state/LanguageContext.jsx'
import { fileToCompressedBase64 } from '../lib/image.js'
import { explainDocument } from '../lib/gemini.js'
import { API_LANGUAGE_NAME } from '../i18n/strings.js'
import Header from '../components/Header.jsx'
import Button from '../components/Button.jsx'
import { Camera, ImageIcon, Warning } from '../components/Icon.jsx'

export default function CaptureScreen({ onBack, onResult, onLanguage }) {
  const { t, lang } = useLanguage()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const cameraRef = useRef(null)
  const galleryRef = useRef(null)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-picking the same file
    if (!file) return

    setBusy(true)
    setError(false)
    try {
      const { base64, mimeType } = await fileToCompressedBase64(file)
      const data = await explainDocument({
        imageBase64: base64,
        mimeType,
        language: API_LANGUAGE_NAME[lang],
      })
      // Pass the image up too, so the result screen can re-translate on language change.
      onResult(data, { imageBase64: base64, mimeType })
    } catch {
      setError(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header onBack={onBack} title={t('samjhaoTitle')} onLanguage={onLanguage} />

      <main className="flex flex-1 flex-col px-5 pt-6">
        {busy ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 pb-16 text-center">
            <span className="saral-spin h-14 w-14 rounded-full border-4 border-line border-t-marigold" />
            <div>
              <p className="font-display text-xl font-semibold text-indigo">{t('reading')}</p>
              <p className="mt-1 text-ink/60">{t('readingWait')}</p>
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
