import { useState } from 'react'
import { useLanguage } from '../state/LanguageContext.jsx'
import { useSpeechInput } from '../lib/useSpeech.js'
import { interpretVoice } from '../lib/voiceIntent.js'
import { ALL_FLOWS } from '../content/sikhao/index.js'
import Header from '../components/Header.jsx'
import ActionCard from '../components/ActionCard.jsx'
import TrustFooter from '../components/TrustFooter.jsx'
import Button from '../components/Button.jsx'
import { Mic } from '../components/Icon.jsx'

export default function HomeScreen({ onSamjhao, onSikhao, onOpenFlow, onAsk, onLanguage }) {
  const { t, lang } = useLanguage()
  const voice = useSpeechInput()
  const [heard, setHeard] = useState('')

  function handleSpeak() {
    if (voice.listening) {
      voice.stop()
      return
    }
    setHeard('')
    voice.start(lang, (transcript) => {
      setHeard(transcript)
      // Route by what was actually said, not always to Sikhao.
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
    })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header onLanguage={onLanguage} />

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
