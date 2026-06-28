// Buttons always meet the 44px minimum tap target (SKILL.md).
const VARIANTS = {
  primary: 'bg-marigold text-ink font-semibold shadow-sm active:brightness-95',
  ghost: 'bg-transparent text-indigo font-semibold active:bg-indigo-tint',
  outline: 'bg-white text-indigo font-semibold border-2 border-marigold active:bg-marigold-soft',
  indigo: 'bg-indigo text-white font-semibold active:brightness-110',
}

export default function Button({
  variant = 'primary',
  icon,
  children,
  full = false,
  className = '',
  ...rest
}) {
  return (
    <button
      className={`inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl px-5 text-[17px] transition disabled:opacity-50 ${
        VARIANTS[variant] ?? VARIANTS.primary
      } ${full ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}
