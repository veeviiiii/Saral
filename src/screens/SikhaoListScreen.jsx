import { useState } from 'react'
import { useLanguage } from '../state/LanguageContext.jsx'
import { CATEGORIES } from '../content/sikhao/index.js'
import Header from '../components/Header.jsx'
import { ChevronRight, Plus } from '../components/Icon.jsx'

// App badge — palette-only (indigo-tint fill, indigo initials).
function AppBadge({ short }) {
  return (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-tint text-[15px] font-bold text-indigo"
      aria-hidden
    >
      {short}
    </span>
  )
}

export default function SikhaoListScreen({ onBack, onOpenFlow, onLanguage }) {
  const { t, lang } = useLanguage()
  const [showComingSoon, setShowComingSoon] = useState(false)

  const categories = CATEGORIES.filter((c) => c.flows.length > 0)

  return (
    <div className="flex min-h-screen flex-col">
      <Header onBack={onBack} title={t('sikhaoTitle')} onLanguage={onLanguage} />

      <main className="flex-1 px-5 pb-10 pt-5">
        <h1 className="mb-5 font-display text-[22px] font-bold leading-tight text-indigo">
          {t('sikhaoListTitle')}
        </h1>

        {categories.map((cat) => (
          <section key={cat.id} className="mb-6">
            <div className="mb-2 flex items-center gap-2 px-1">
              <span aria-hidden className="text-lg">{cat.icon}</span>
              <h2 className="text-[13px] font-bold uppercase tracking-wide text-ink/50">
                {cat.label[lang]}
              </h2>
            </div>

            <ul className="flex flex-col gap-2.5">
              {cat.flows.map((flow) => (
                <li key={flow.id}>
                  <button
                    onClick={() => onOpenFlow(flow)}
                    className="flex min-h-[64px] w-full items-center gap-3.5 rounded-2xl border border-line bg-white p-3.5 text-left shadow-sm transition active:bg-surface"
                  >
                    <AppBadge short={flow.short} />
                    <span className="flex-1 text-[17px] font-medium leading-snug text-ink">
                      {flow.title[lang]}
                    </span>
                    <ChevronRight className="text-ink/40" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {/* "Something else" — visually distinct (dashed) */}
        <button
          onClick={() => setShowComingSoon(true)}
          className="flex min-h-[64px] w-full items-center gap-3.5 rounded-2xl border-2 border-dashed border-line bg-transparent p-3.5 text-left transition active:bg-surface"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-tint text-indigo">
            <Plus size={20} />
          </span>
          <span className="flex-1 text-[17px] font-medium text-ink/80">{t('somethingElse')}</span>
        </button>
        {showComingSoon ? (
          <p className="mt-2 px-2 text-[15px] text-ink/55">{t('comingSoon')}</p>
        ) : null}
      </main>
    </div>
  )
}
