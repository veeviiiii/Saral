import { LANGUAGES } from '../i18n/strings.js'

// First-run language picker, shown before the spotlight tour. Deliberately
// simple and full-screen (not the bottom sheet): a friendly headline in the
// main languages, then one tappable card per language in its own script.
// Scrollable 2-column grid so all 16 fit on a phone. No skip — must pick one.
const HEADLINES = ['भाषा चुनें', 'Choose your language', 'ভাষা বেছে নিন', 'மொழியைத் தேர்ந்தெடுக்கவும்']

export default function OnboardingLanguageScreen({ onSelect }) {
  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto bg-surface">
      <div className="mx-auto flex min-h-full w-full max-w-[412px] flex-col items-center px-5 py-8">
        <span className="font-display text-[36px] font-bold tracking-tight text-indigo">Saral</span>

        <div className="mt-4 text-center">
          {HEADLINES.map((h, i) => (
            <p key={i} className="font-display text-[17px] font-semibold leading-relaxed text-ink/75">
              {h}
            </p>
          ))}
        </div>

        <div className="mt-6 grid w-full grid-cols-2 gap-2.5 pb-4">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              data-lang={l.code}
              onClick={() => onSelect(l.code)}
              className="flex min-h-[56px] items-center justify-center rounded-2xl border-2 border-marigold bg-white px-2 text-center text-[19px] font-semibold text-indigo shadow-sm transition active:scale-[0.99] active:bg-marigold-soft"
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
