import { useLanguage } from '../state/LanguageContext.jsx'
import { useSpeech } from '../lib/useSpeech.js'
import Button from './Button.jsx'
import { Speaker, StopIcon } from './Icon.jsx'

// Read-aloud toggle. Hidden entirely if SpeechSynthesis is unavailable.
export default function ListenButton({ text, variant = 'primary', full = false }) {
  const { t, lang } = useLanguage()
  const { supported, speaking, speak, stop } = useSpeech()

  if (!supported) return null

  return (
    <Button
      variant={variant}
      full={full}
      onClick={() => (speaking ? stop() : speak(text, lang))}
      icon={speaking ? <StopIcon /> : <Speaker />}
      aria-pressed={speaking}
    >
      {speaking ? t('stop') : t('listen')}
    </Button>
  )
}
