import { useCallback, useEffect, useRef, useState } from 'react'
import { useLanguage } from '../state/LanguageContext.jsx'
import { useSpeechInput } from '../lib/useSpeech.js'
import { askSaral } from '../lib/ask.js'
import { API_LANGUAGE_NAME } from '../i18n/strings.js'
import Header from '../components/Header.jsx'
import Button from '../components/Button.jsx'
import ListenButton from '../components/ListenButton.jsx'
import TrustFooter from '../components/TrustFooter.jsx'
import { Mic } from '../components/Icon.jsx'

// Open-ended Q&A. `context` (optional) is the document summary for follow-ups;
// `seedQuestion` (optional, e.g. from voice) is asked automatically on open.
export default function AskScreen({ context, seedQuestion, onBack, onLanguage }) {
  const { t, lang } = useLanguage()
  const voice = useSpeechInput()
  const [question, setQuestion] = useState('')
  const [asked, setAsked] = useState('')
  const [answer, setAnswer] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const seeded = useRef(false)

  const submit = useCallback(
    async (q) => {
      const text = (q ?? question).trim()
      if (!text || busy) return
      setBusy(true)
      setError(false)
      setAnswer('')
      setAsked(text)
      setQuestion('')
      try {
        const a = await askSaral({ question: text, language: API_LANGUAGE_NAME[lang], context })
        setAnswer(a)
      } catch {
        setError(true)
      } finally {
        setBusy(false)
      }
    },
    [question, busy, lang, context],
  )

  // Auto-ask a seeded question (from the home voice button) once.
  useEffect(() => {
    if (seedQuestion && !seeded.current) {
      seeded.current = true
      submit(seedQuestion)
    }
  }, [seedQuestion, submit])

  return (
    <div className="flex min-h-screen flex-col">
      <Header onBack={onBack} title={t('askTitle')} onLanguage={onLanguage} />

      <main className="flex flex-1 flex-col px-5 pb-4 pt-5">
        <div className="flex-1">
          {asked ? (
            <p className="mb-3 text-[15px] text-ink/55">
              {t('youAsked')}: “{asked}”
            </p>
          ) : (
            <p className="mb-4 text-[16px] leading-relaxed text-ink/70">{t('askIntro')}</p>
          )}

          {busy ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <span className="saral-spin h-12 w-12 rounded-full border-4 border-line border-t-marigold" />
              <p className="text-ink/60">{t('askThinking')}</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl bg-caution-soft p-4">
              <p className="text-[15px] leading-snug text-ink/80">{t('askError')}</p>
            </div>
          ) : answer ? (
            <div className="saral-rise rounded-2xl border border-line bg-white p-4">
              <p className="text-[17px] leading-relaxed text-ink">{answer}</p>
              <div className="mt-3">
                <ListenButton text={answer} variant="ghost" />
              </div>
            </div>
          ) : (
            <button
              onClick={() => submit(t('askSuggestion'))}
              className="rounded-full border border-line bg-white px-4 py-2.5 text-[15px] font-medium text-indigo active:bg-surface"
            >
              {t('askSuggestion')}
            </button>
          )}
        </div>

        {/* Input bar — bottom-anchored within thumb reach */}
        <div className="mt-3 flex items-center gap-2">
          {voice.supported ? (
            <button
              onClick={() => (voice.listening ? voice.stop() : voice.start(lang, (tx) => submit(tx)))}
              aria-label={t('speak')}
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-marigold text-indigo ${
                voice.listening ? 'saral-pulse' : ''
              }`}
            >
              <Mic />
            </button>
          ) : null}
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
            }}
            placeholder={t('askPlaceholder')}
            className="min-h-[48px] flex-1 rounded-2xl border border-line bg-white px-4 text-[16px] text-ink outline-none focus:border-marigold"
          />
          <Button
            variant="primary"
            onClick={() => submit()}
            disabled={busy || !question.trim()}
            className="shrink-0"
          >
            {t('askSend')}
          </Button>
        </div>

        <TrustFooter className="mt-3" />
      </main>
    </div>
  )
}
