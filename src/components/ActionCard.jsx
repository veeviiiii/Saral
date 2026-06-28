import { ChevronRight } from './Icon.jsx'

// Big home cards: Samjhao (marigold) and Sikhao (indigo-tint).
export default function ActionCard({ variant = 'primary', icon, title, desc, onClick }) {
  const tone =
    variant === 'primary'
      ? 'bg-marigold'
      : 'bg-indigo-tint'

  return (
    <button
      onClick={onClick}
      className={`saral-rise flex w-full items-center gap-4 rounded-3xl p-5 text-left shadow-sm transition active:scale-[0.99] ${tone}`}
    >
      <span
        aria-hidden
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/55 text-3xl"
      >
        {icon}
      </span>
      <span className="flex-1">
        <span className="block font-display text-[22px] font-semibold leading-tight text-ink">
          {title}
        </span>
        <span className="mt-0.5 block text-[15px] text-ink/70">{desc}</span>
      </span>
      <ChevronRight className="shrink-0 text-ink/45" />
    </button>
  )
}
