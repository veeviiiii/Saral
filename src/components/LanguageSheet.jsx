import { useLanguage } from '../state/LanguageContext.jsx'
import { LANGUAGES } from '../i18n/strings.js'
import { Check } from './Icon.jsx'

// Bottom-sheet language picker. Each language shown in its own script.
export default function LanguageSheet({ open, onClose }) {
  const { lang, setLang, t } = useLanguage()
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t('language')}
    >
      <div
        className="saral-sheet-up w-full max-w-[412px] rounded-t-3xl bg-white p-4 pb-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-line" />
        <h2 className="mb-3 px-1 font-display text-lg font-semibold text-indigo">
          {t('language')}
        </h2>
        <ul className="flex flex-col gap-2">
          {LANGUAGES.map((l) => {
            const selected = l.code === lang
            return (
              <li key={l.code}>
                <button
                  onClick={() => {
                    setLang(l.code)
                    onClose()
                  }}
                  className={`flex min-h-[56px] w-full items-center justify-between rounded-2xl border-2 px-4 text-[18px] font-medium transition ${
                    selected
                      ? 'border-marigold bg-marigold-soft text-ink'
                      : 'border-line bg-white text-ink active:bg-surface'
                  }`}
                >
                  <span>{l.label}</span>
                  {selected ? <Check className="text-marigold" /> : null}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
