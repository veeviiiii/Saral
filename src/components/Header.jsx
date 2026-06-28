import { useLanguage } from '../state/LanguageContext.jsx'
import { ArrowLeft } from './Icon.jsx'

// Indigo app bar. Home shows the wordmark; sub-screens show a back button.
export default function Header({ onBack, title, onLanguage }) {
  const { t, langLabel } = useLanguage()

  return (
    <header className="flex items-center gap-2 bg-indigo px-4 py-3 text-white">
      {onBack ? (
        <button
          onClick={onBack}
          aria-label={t('back')}
          className="-ml-1 flex h-11 w-11 items-center justify-center rounded-full active:bg-white/15"
        >
          <ArrowLeft />
        </button>
      ) : (
        <span className="pl-1 font-display text-2xl font-bold tracking-tight">Saral</span>
      )}

      <div className="flex-1">
        {title ? <h1 className="font-display text-xl font-semibold">{title}</h1> : null}
      </div>

      {onLanguage ? (
        <button
          onClick={onLanguage}
          aria-label={t('language')}
          className="flex h-11 min-w-11 items-center gap-1 rounded-full bg-marigold-soft px-3 text-[15px] font-semibold text-indigo active:brightness-95"
        >
          <span>{langLabel}</span>
          <span aria-hidden className="text-xs">▾</span>
        </button>
      ) : null}
    </header>
  )
}
