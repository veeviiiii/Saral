import { useEffect, useMemo, useState } from 'react'
import { useLanguage } from '../state/LanguageContext.jsx'
import { pickLang } from '../i18n/strings.js'
import Header from '../components/Header.jsx'
import Button from '../components/Button.jsx'
import ListenButton from '../components/ListenButton.jsx'
import ProgressDots from '../components/ProgressDots.jsx'
import { ArrowLeft, Check, Warning } from '../components/Icon.jsx'

// Flatten a flow into a linear sequence, inserting the chosen branch's steps
// right after the choice step (and nothing if no branch chosen yet).
function buildSequence(flow, chosen) {
  const seq = []
  for (const step of flow.steps) {
    if (step.choice) {
      seq.push(step)
      if (chosen && step.branches[chosen]) seq.push(...step.branches[chosen])
    } else {
      seq.push(step)
    }
  }
  return seq
}

export default function WalkthroughScreen({ flow, onBack, onLanguage }) {
  const { t, lang } = useLanguage()
  const [index, setIndex] = useState(0)
  const [chosen, setChosen] = useState(null)

  // Reset when a different flow opens.
  useEffect(() => {
    setIndex(0)
    setChosen(null)
  }, [flow.id])

  const sequence = useMemo(() => buildSequence(flow, chosen), [flow, chosen])
  const total = sequence.length
  const step = sequence[index]
  const isLast = index === total - 1

  function chooseBranch(branch) {
    setChosen(branch)
    setIndex((i) => i + 1) // step into the first branch step
  }

  function next() {
    if (isLast) onBack()
    else setIndex((i) => i + 1)
  }

  function prev() {
    setIndex((i) => Math.max(0, i - 1))
  }

  // Read-aloud: the instruction, then the calming line, then the warning.
  const warnText = pickLang(step.warningHint, lang)
  const listenText = [
    pickLang(step.text, lang),
    pickLang(step.reassurance, lang),
    warnText ? `${t('careful')}: ${warnText}` : '',
  ]
    .filter(Boolean)
    .join('. ')

  return (
    <div className="flex min-h-screen flex-col">
      <Header onBack={onBack} title={pickLang(flow.title, lang)} onLanguage={onLanguage} />

      <main className="flex flex-1 flex-col px-5 pt-6">
        <ProgressDots total={total} current={index} />
        <p className="mt-3 text-center text-[14px] font-semibold uppercase tracking-wide text-marigold">
          {t('stepLabel', { n: index + 1, total })}
        </p>

        {/* Illustration: a screenshot/picture if the step has one, else the number */}
        <div className="mt-5 flex items-center justify-center">
          {step.image ? (
            <img
              src={step.image}
              alt=""
              className="h-40 w-full max-w-[17rem] rounded-2xl border border-line bg-white object-contain p-2"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-indigo-tint">
              <span className="font-display text-5xl font-bold text-indigo">{index + 1}</span>
            </div>
          )}
        </div>

        {/* Instruction */}
        <p
          key={index}
          className="saral-rise mx-auto mt-6 max-w-[20rem] text-center font-display text-[23px] font-semibold leading-snug text-ink"
        >
          {pickLang(step.text, lang)}
        </p>

        {/* Reassurance — calming line */}
        {step.reassurance ? (
          <p className="mx-auto mt-4 max-w-[20rem] rounded-2xl bg-marigold-soft px-4 py-3 text-center text-[15px] leading-snug text-ink/80">
            {pickLang(step.reassurance, lang)}
          </p>
        ) : null}

        {/* Warning — common mistake to avoid */}
        {step.warningHint ? (
          <div className="mx-auto mt-3 flex max-w-[20rem] items-start gap-2.5 rounded-2xl bg-caution-soft px-3.5 py-3 text-caution">
            <Warning size={20} className="mt-0.5 shrink-0" />
            <span className="text-[14px] leading-snug text-ink/80">
              <span className="font-semibold text-caution">{t('careful')}: </span>
              {pickLang(step.warningHint, lang)}
            </span>
          </div>
        ) : null}

        <div className="min-h-[16px] flex-1" />

        {/* Branch options inline (only on a choice step) */}
        {step.choice ? (
          <div className="flex flex-col gap-3 pb-7">
            {step.options.map((opt) => (
              <Button
                key={opt.branch}
                variant="outline"
                full
                onClick={() => chooseBranch(opt.branch)}
              >
                {pickLang(opt.label, lang)}
              </Button>
            ))}
          </div>
        ) : null}
      </main>

      {/* Bottom bar: Listen, then Back + Next.
          Back steps within the flow; the header arrow exits the flow. */}
      <div className="sticky bottom-0 flex flex-col gap-2.5 border-t border-line bg-surface/95 px-5 pb-7 pt-3 backdrop-blur">
        <ListenButton text={listenText} variant="ghost" full />
        {index > 0 || !step.choice ? (
          <div className="flex gap-3">
            {index > 0 ? (
              <Button
                variant="ghost"
                onClick={prev}
                icon={<ArrowLeft />}
                className="flex-1 border border-line"
              >
                {t('back')}
              </Button>
            ) : null}
            {!step.choice ? (
              <Button
                variant="primary"
                onClick={next}
                icon={isLast ? <Check /> : null}
                className="flex-1"
              >
                {isLast ? t('done') : t('next')}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
