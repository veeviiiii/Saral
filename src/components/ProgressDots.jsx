// Walkthrough progress — active dot marigold, the rest are line-grey.
export default function ProgressDots({ total, current }) {
  return (
    <div className="flex items-center justify-center gap-2" aria-hidden>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-2.5 rounded-full transition-all ${
            i === current ? 'w-6 bg-marigold' : 'w-2.5 bg-line'
          }`}
        />
      ))}
    </div>
  )
}
