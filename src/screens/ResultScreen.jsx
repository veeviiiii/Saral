import { useLanguage } from '../state/LanguageContext.jsx'
import Header from '../components/Header.jsx'
import Button from '../components/Button.jsx'
import ListenButton from '../components/ListenButton.jsx'
import TrustFooter from '../components/TrustFooter.jsx'
import { Camera, Warning, Shield } from '../components/Icon.jsx'

function prettyDocType(s) {
  if (!s) return ''
  return String(s).replace(/_/g, ' ')
}

export default function ResultScreen({ result, onBack, onScanAnother, onAskMore, onLanguage }) {
  const { t } = useLanguage()
  const r = result || {}
  const keyFacts = Array.isArray(r.key_facts) ? r.key_facts : []
  const whatToDo = Array.isArray(r.what_to_do) ? r.what_to_do : []
  const warnings = Array.isArray(r.warnings) ? r.warnings : []
  const isScam = r.is_possible_scam === true
  const lowConfidence = r.confidence === 'low'

  // Text for read-aloud: title, summary, then the steps.
  const listenText = [
    r.title,
    r.summary,
    whatToDo.length ? `${t('whatToDo')}: ${whatToDo.join('. ')}` : '',
  ]
    .filter(Boolean)
    .join('. ')

  return (
    <div className="flex min-h-screen flex-col">
      <Header onBack={onBack} onLanguage={onLanguage} />

      <main className="saral-rise flex-1 px-5 pb-40 pt-5">
        {/* Scam flag — above everything else */}
        {isScam ? (
          <div className="mb-5 rounded-2xl border-2 border-caution bg-caution-soft p-4">
            <div className="flex items-center gap-2 text-caution">
              <Warning />
              <h2 className="font-display text-lg font-bold">{t('scamTitle')}</h2>
            </div>
            <p className="mt-1.5 text-[15px] text-ink/80">{t('scamBody')}</p>
          </div>
        ) : null}

        {/* Eyebrow */}
        <div className="mb-1 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-indigo/60">
          <Camera size={15} />
          <span>{prettyDocType(r.doc_type) || t('resultEyebrow')}</span>
        </div>

        {/* Title */}
        <h1 className="font-display text-[25px] font-bold leading-tight text-indigo">
          {r.title}
        </h1>

        {/* Summary */}
        {r.summary ? (
          <p className="mt-2 text-[18px] leading-relaxed text-ink">{r.summary}</p>
        ) : null}

        {/* Key facts */}
        {keyFacts.length ? (
          <section className="mt-5">
            <h3 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-ink/50">
              {t('keyFacts')}
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {keyFacts.map((f, i) => (
                <div key={i} className="rounded-2xl border border-line bg-white p-3">
                  <div className="text-[12px] text-ink/55">{f?.label}</div>
                  <div className="mt-0.5 text-[18px] font-bold tabular-nums leading-snug text-ink">
                    {f?.value}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* What to do — numbered list, marigold circles */}
        {whatToDo.length ? (
          <section className="mt-6">
            <h3 className="mb-2.5 text-[13px] font-semibold uppercase tracking-wide text-ink/50">
              {t('whatToDo')}
            </h3>
            <ol className="flex flex-col gap-3">
              {whatToDo.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-marigold text-[15px] font-bold text-ink">
                    {i + 1}
                  </span>
                  <span className="text-[17px] leading-snug text-ink">{step}</span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {/* Warnings — caution rows */}
        {warnings.length ? (
          <section className="mt-6 flex flex-col gap-2">
            {warnings.map((w, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 rounded-2xl bg-caution-soft p-3 text-caution"
              >
                <Warning size={20} className="mt-0.5 shrink-0" />
                <span className="text-[15px] leading-snug text-ink/80">{w}</span>
              </div>
            ))}
          </section>
        ) : null}

        {/* Low-confidence nudge — keep a human in the loop */}
        {lowConfidence ? (
          <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-line bg-white p-3">
            <Shield size={20} className="mt-0.5 shrink-0 text-indigo" />
            <span className="text-[15px] leading-snug text-ink/75">{t('lowConfidence')}</span>
          </div>
        ) : null}
      </main>

      {/* Bottom action bar — Listen + Ask more + Scan another */}
      <div className="sticky bottom-0 border-t border-line bg-surface/95 px-5 pb-6 pt-3 backdrop-blur">
        <ListenButton text={listenText} variant="primary" full />
        <div className="mt-2.5 flex gap-3">
          <Button variant="outline" onClick={onAskMore} className="flex-1">
            {t('askMore')}
          </Button>
          <Button variant="ghost" onClick={onScanAnother} className="flex-1">
            {t('scanAnother')}
          </Button>
        </div>
        <TrustFooter className="mt-3" />
      </div>
    </div>
  )
}
