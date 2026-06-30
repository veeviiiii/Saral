import { useMemo, useRef, useState } from 'react'
import { useLanguage } from '../state/LanguageContext.jsx'
import { getHistory, deleteHistoryItem, clearHistory } from '../lib/history.js'
import { computeInsights, timeAgo } from '../lib/insights.js'
import Header from '../components/Header.jsx'
import ResultScreen from './ResultScreen.jsx'
import { Trash, DocIcon, Shield, Plus } from '../components/Icon.jsx'

function prettyType(s) {
  return String(s || '').replace(/_/g, ' ').trim()
}

function insightClass(severity) {
  if (severity === 'danger')
    return 'rounded-2xl border border-caution bg-caution-soft px-4 py-3 text-[15px] leading-snug text-caution'
  if (severity === 'warn')
    return 'rounded-2xl bg-marigold-soft px-4 py-3 text-[15px] leading-snug text-ink/85'
  return 'rounded-2xl border border-line bg-white px-4 py-3 text-[15px] leading-snug text-ink/80'
}

export default function HistoryScreen({ onBack, onLanguage }) {
  const { t, lang } = useLanguage()
  const [items, setItems] = useState(() => getHistory())
  const [viewing, setViewing] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const pressTimer = useRef(null)
  const longPressed = useRef(false)

  const insights = useMemo(() => computeInsights(items, lang), [items, lang])

  // Read-only view of a saved result — reuse the result card, no re-calls.
  if (viewing) {
    return (
      <ResultScreen
        result={viewing}
        readOnly
        onBack={() => setViewing(null)}
        onLanguage={onLanguage}
      />
    )
  }

  const remove = (id) => {
    setItems(deleteHistoryItem(id))
    setPendingDelete(null)
  }

  const startPress = (id) => {
    longPressed.current = false
    pressTimer.current = setTimeout(() => {
      longPressed.current = true
      setPendingDelete(id)
    }, 550)
  }
  const endPress = () => clearTimeout(pressTimer.current)
  const openRow = (it) => {
    if (longPressed.current) {
      longPressed.current = false
      return
    }
    setViewing(it)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header onBack={onBack} title={t('historyTitle')} onLanguage={onLanguage} />

      <main className="flex-1 px-5 pb-12 pt-5">
        {/* Smart insights — rule-based on the stored history. */}
        {insights.length ? (
          <section className="mb-5 flex flex-col gap-2">
            {insights.map((ins, i) => (
              <div key={i} className={insightClass(ins.severity)}>
                {ins.text}
              </div>
            ))}
          </section>
        ) : null}

        {/* Privacy note — everything stays on-device. */}
        <p className="mb-4 flex items-center gap-1.5 text-[13px] text-ink/55">
          <Shield size={15} className="shrink-0 text-indigo/60" />
          {t('historyPrivacy')}
        </p>

        {items.length ? (
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[13px] font-semibold uppercase tracking-wide text-ink/50">
              {t('historyTitle')}
            </span>
            <button
              onClick={() => setItems(clearHistory())}
              className="text-[14px] font-semibold text-caution active:opacity-70"
            >
              {t('clearAll')}
            </button>
          </div>
        ) : null}

        {items.length === 0 ? (
          <div className="mt-20 text-center text-[16px] text-ink/45">{t('historyEmpty')}</div>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {items.map((it) => (
              <li
                key={it.id}
                className="relative flex items-center rounded-2xl border border-line bg-white"
              >
                <button
                  onClick={() => openRow(it)}
                  onPointerDown={() => startPress(it.id)}
                  onPointerUp={endPress}
                  onPointerLeave={endPress}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl p-3 text-left active:bg-surface"
                >
                  {it.thumbnail ? (
                    <img
                      src={it.thumbnail}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-xl border border-line object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-indigo-tint text-indigo">
                      <DocIcon size={24} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-[16px] font-semibold text-indigo">
                      {it.title || t('resultEyebrow')}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                      {it.doc_type ? (
                        <span className="rounded-full bg-indigo-tint px-2 py-0.5 text-[11px] font-medium text-indigo">
                          {prettyType(it.doc_type)}
                        </span>
                      ) : null}
                      <span className="text-[12px] text-ink/50">{timeAgo(it.timestamp, lang)}</span>
                      {it.is_possible_scam ? <span className="text-[12px]">🚨</span> : null}
                    </div>
                  </div>
                </button>

                <button
                  aria-label={t('delete')}
                  onClick={() => setPendingDelete(it.id)}
                  className="mr-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink/40 active:bg-surface"
                >
                  <Trash size={18} />
                </button>

                {/* Delete confirmation overlay (trash tap or long-press). */}
                {pendingDelete === it.id ? (
                  <div className="absolute inset-0 flex items-center gap-2 rounded-2xl border border-caution bg-caution-soft px-3">
                    <span className="mr-auto min-w-0 truncate text-[14px] font-medium text-ink/80">
                      {it.title || prettyType(it.doc_type)}
                    </span>
                    <button
                      onClick={() => remove(it.id)}
                      className="rounded-xl bg-caution px-4 py-2 text-[14px] font-semibold text-white active:brightness-95"
                    >
                      {t('delete')}
                    </button>
                    <button
                      aria-label="cancel"
                      onClick={() => setPendingDelete(null)}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-ink/50 active:bg-white/60"
                    >
                      <Plus size={20} className="rotate-45" />
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
