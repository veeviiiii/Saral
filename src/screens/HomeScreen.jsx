import { useState } from 'react'
import { useLanguage } from '../state/LanguageContext.jsx'
import { useVoiceAutoDetect } from '../lib/useSpeech.js'
import { detectLanguage } from '../lib/detectLang.js'
import { interpretVoice } from '../lib/voiceIntent.js'
import { ALL_FLOWS } from '../content/sikhao/index.js'
import { STRINGS } from '../i18n/strings.js'
import Header from '../components/Header.jsx'
import ActionCard from '../components/ActionCard.jsx'
import TrustFooter from '../components/TrustFooter.jsx'
import Button from '../components/Button.jsx'
import { Mic } from '../components/Icon.jsx'

export default function HomeScreen({ onSamjhao, onSikhao, onOpenFlow, onAsk, onLanguage, onHistory }) {
  const { t, lang, setLang } = useLanguage()
  const voice = useVoiceAutoDetect()
  const [heard, setHeard] = useState('')
  const [toast, setToast] = useState(null)

  function handleSpeak() {
    if (voice.listening) {
      voice.stop()
      return
    }
    setHeard('')
    voice.start((transcript) => {
      // No transcript (unsupported / nothing heard) → do nothing, stay silent.
      if (!transcript) return
      setHeard(transcript)

      // Feature 3 — auto-detect the spoken language and switch the app to it.
      let routeDelay = 0
      const detected = detectLanguage(transcript)
      if (detected && detected !== lang && STRINGS[detected]) {
        setLang(detected)
        const msg = STRINGS[detected].voiceSwitched
        if (msg) {
          setToast(msg)
          setTimeout(() => setToast(null), 2500)
          routeDelay = 900 // let the toast show before we navigate away
        }
      }

      // Then proceed with the voice input as normal.
      const route = () => {
        const action = interpretVoice(transcript)
        if (action.type === 'samjhao') {
          onSamjhao()
        } else if (action.type === 'flow') {
          const flow = ALL_FLOWS.find((f) => f.id === action.flowId)
          if (flow) onOpenFlow(flow)
          else onSikhao()
        } else if (action.type === 'ask') {
          onAsk(transcript)
        } else {
          onSikhao()
        }
      }
      if (routeDelay) setTimeout(route, routeDelay)
      else route()
    })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header onLanguage={onLanguage} onHistory={onHistory} />

      {/* Language-switch toast (voice auto-detection). */}
      {toast ? (
        <div className="pointer-events-none fixed inset-x-0 top-16 z-30 flex justify-center px-5">
          <div className="saral-rise rounded-full bg-indigo px-4 py-2.5 text-[14px] font-medium text-white shadow-md">
            {toast}
          </div>
        </div>
      ) : null}

      <main className="flex flex-1 flex-col gap-5 px-5 pt-6">
        <h1 className="font-display text-[27px] font-bold leading-tight text-indigo">
          {t('homeHeadline')}
        </h1>

        <div className="flex flex-col gap-4">
          <ActionCard
            variant="primary"
            icon="📄"
            title={t('samjhaoTitle')}
            desc={t('samjhaoDesc')}
            onClick={onSamjhao}
          />
          <ActionCard
            variant="secondary"
            icon="🧭"
            title={t('sikhaoTitle')}
            desc={t('sikhaoDesc')}
            onClick={onSikhao}
          />
        </div>

        {voice.supported ? (
          <div className="mt-1 flex flex-col items-center gap-2">
            <Button
              variant="outline"
              onClick={handleSpeak}
              icon={<Mic />}
              className={voice.listening ? 'saral-pulse' : ''}
            >
              {voice.listening ? t('listening') : t('speak')}
            </Button>
            {heard ? (
              <p className="text-center text-sm text-ink/60">
                {t('youSaid')}: “{heard}”
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="flex-1" />
        <TrustFooter className="pb-6" />
      </main>
    </div>
  )
}
