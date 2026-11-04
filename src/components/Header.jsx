import { useLanguage } from '../state/LanguageContext.jsx'
import { ArrowLeft, History, HelpCircle } from './Icon.jsx'

// Indigo app bar. Home shows the wordmark; sub-screens show a back button.
export default function Header({ onBack, title, onLanguage, onHistory, onReplayTour }) {
  const { t, langLabel } = useLanguage()

  return (
    <header className="flex items-center gap-2 bg-indigo-deep px-4 py-3 text-white">
      {onBack ? (
        <button
          onClick={onBack}
          aria-label={t('back')}
          className="-ml-1 flex h-11 w-11 items-center justify-center rounded-full active:bg-card/15"
        >
          <ArrowLeft />
        </button>
      ) : (
        <span className="pl-1 font-display text-2xl font-bold tracking-tight">Saral</span>
      )}

      <div className="flex-1">
        {title ? <h1 className="font-display text-xl font-semibold">{title}</h1> : null}
      </div>

      {onReplayTour ? (
        <button
          onClick={onReplayTour}
          aria-label={t('obReplay')}
          className="flex h-11 w-11 items-center justify-center rounded-full active:bg-card/15"
        >
          <HelpCircle size={22} />
        </button>
      ) : null}

      {onHistory ? (
        <button
          onClick={onHistory}
          aria-label={t('historyTitle')}
          className="flex h-11 w-11 items-center justify-center rounded-full active:bg-card/15"
        >
          <History size={22} />
        </button>
      ) : null}

      {onLanguage ? (
        <button
          onClick={onLanguage}
          aria-label={t('language')}
          data-tour="language"
          className="flex h-11 min-w-11 items-center gap-1 rounded-full border border-marigold/50 bg-ink/12 px-3 text-[15px] font-semibold text-ink active:brightness-125"
        >
          <span>{langLabel}</span>
          <span aria-hidden className="text-xs">▾</span>
        </button>
      ) : null}
    </header>
  )
}
