import { ChevronRight } from './Icon.jsx'

// Big home cards: Samjhao (marigold) and Sikhao (indigo-tint).
//
// The two variants need opposite text colours. Marigold is a light fill even in
// the dark theme, so the primary card carries dark text on it, while the
// indigo-tint card is a dark fill and carries the normal light text.
export default function ActionCard({ variant = 'primary', icon, title, desc, onClick, dataTour }) {
  const isPrimary = variant === 'primary'

  const tone = isPrimary ? 'bg-marigold' : 'bg-indigo-tint'
  const titleTone = isPrimary ? 'text-on-accent' : 'text-ink'
  const descTone = isPrimary ? 'text-on-accent/75' : 'text-ink/70'
  const chevronTone = isPrimary ? 'text-on-accent/50' : 'text-ink/45'
  // A dark badge over marigold turns muddy; keep it light there, as in the
  // original design, and dark over the indigo card.
  const badgeTone = isPrimary ? 'bg-white/75' : 'bg-card/55'

  return (
    <button
      onClick={onClick}
      data-tour={dataTour}
      className={`saral-rise flex w-full items-center gap-4 rounded-3xl p-5 text-left shadow-sm transition active:scale-[0.99] ${tone}`}
    >
      <span
        aria-hidden
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl ${badgeTone}`}
      >
        {icon}
      </span>
      <span className="flex-1">
        <span className={`block font-display text-[22px] font-semibold leading-tight ${titleTone}`}>
          {title}
        </span>
        <span className={`mt-0.5 block text-[15px] ${descTone}`}>{desc}</span>
      </span>
      <ChevronRight className={`shrink-0 ${chevronTone}`} />
    </button>
  )
}
