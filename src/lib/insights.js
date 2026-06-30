// Rule-based "ML insights" computed from the on-device history. No model — just
// pattern-matching over the structured Gemini results we already stored.

import { STRINGS } from '../i18n/strings.js'

const DAY = 24 * 60 * 60 * 1000

function interp(str, vars) {
  let s = str || ''
  for (const [k, v] of Object.entries(vars || {})) s = s.replaceAll(`{${k}}`, String(v))
  return s
}

function prettyType(s) {
  return String(s || '').replace(/_/g, ' ').trim()
}

// Pull a number out of an amount string ("Rs 1,850.00", "₹1850", "1,850 रुपये").
export function parseAmount(value) {
  if (value == null) return null
  const cleaned = String(value).replace(/[,\s]/g, '')
  const m = cleaned.match(/(\d+(?:\.\d+)?)/)
  return m ? parseFloat(m[1]) : null
}

function looksLikeAmount(fact) {
  const label = String(fact?.label || '').toLowerCase()
  const value = String(fact?.value || '')
  return (
    /amount|राशि|रक्कम|পরিমাণ|देय|মূল্য/.test(label) ||
    /(?:₹|rs\.?)\s*\d|\d\s*(?:रुपये|रुपय|টাকা|रुपए)/i.test(value)
  )
}

// Parse a date out of a fact value. Assumes day-first (DD/MM/YYYY) for numeric.
export function parseDate(value) {
  if (!value) return null
  const s = String(value).trim()

  let m = s.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/)
  if (m) {
    let d = +m[1]
    let mo = +m[2]
    let y = +m[3]
    if (y < 100) y += 2000
    const dt = new Date(y, mo - 1, d)
    return isNaN(dt.getTime()) ? null : dt
  }

  m = s.match(/(\d{1,2})\s+([A-Za-z]{3,})\.?\s+(\d{2,4})/)
  if (m) {
    const dt = new Date(`${m[1]} ${m[2]} ${m[3]}`)
    return isNaN(dt.getTime()) ? null : dt
  }

  return null
}

function formatMoney(n) {
  try {
    return '₹' + Math.round(n).toLocaleString('en-IN')
  } catch {
    return '₹' + Math.round(n)
  }
}

// Returns an array of { kind, severity, text } insights, most useful first.
export function computeInsights(items, lang) {
  const S = STRINGS[lang] || STRINGS.en
  const out = []
  const now = Date.now()

  // 1) Due soon — a date in any item within the next 7 days.
  let dueItem = null
  let dueWhen = Infinity
  for (const it of items) {
    for (const f of it.key_facts || []) {
      const d = parseDate(f?.value)
      if (!d) continue
      const t = d.getTime()
      if (t >= now - DAY && t <= now + 7 * DAY && t < dueWhen) {
        dueWhen = t
        dueItem = it
      }
    }
  }
  if (dueItem) {
    out.push({ kind: 'due', severity: 'warn', text: interp(S.insightDueSoon, { title: dueItem.title }) })
  }

  // 2) Scam alert — any flagged document in history.
  if (items.some((it) => it.is_possible_scam)) {
    out.push({ kind: 'scam', severity: 'danger', text: S.insightScam })
  }

  // 3) Spending pattern — total of detected amounts (needs 3+ documents).
  if (items.length >= 3) {
    let total = 0
    let found = false
    for (const it of items) {
      for (const f of it.key_facts || []) {
        if (looksLikeAmount(f)) {
          const n = parseAmount(f.value)
          if (n) {
            total += n
            found = true
            break // one amount per document
          }
        }
      }
    }
    if (found && total > 0) {
      out.push({ kind: 'spend', severity: 'info', text: interp(S.insightSpending, { total: formatMoney(total) }) })
    }
  }

  // 4) Most common document type (needs 2+ to be a "pattern").
  if (items.length >= 2) {
    const tally = {}
    for (const it of items) {
      const k = (it.doc_type || '').trim()
      if (k) tally[k] = (tally[k] || 0) + 1
    }
    const top = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]
    if (top) {
      out.push({ kind: 'common', severity: 'info', text: interp(S.insightCommon, { type: prettyType(top[0]) }) })
    }
  }

  return out
}

// Localized "2 days ago" via Intl.RelativeTimeFormat, with a safe fallback.
export function timeAgo(ts, lang) {
  const diff = Date.now() - ts
  const sec = Math.max(1, Math.round(diff / 1000))
  let value = -sec
  let unit = 'second'
  const min = Math.round(sec / 60)
  const hr = Math.round(min / 60)
  const day = Math.round(hr / 24)
  if (sec >= 60 && min < 60) {
    value = -min
    unit = 'minute'
  } else if (min >= 60 && hr < 24) {
    value = -hr
    unit = 'hour'
  } else if (hr >= 24 && day < 7) {
    value = -day
    unit = 'day'
  } else if (day >= 7 && day < 30) {
    value = -Math.round(day / 7)
    unit = 'week'
  } else if (day >= 30 && day < 365) {
    value = -Math.round(day / 30)
    unit = 'month'
  } else if (day >= 365) {
    value = -Math.round(day / 365)
    unit = 'year'
  }
  try {
    return new Intl.RelativeTimeFormat(lang, { numeric: 'auto' }).format(value, unit)
  } catch {
    try {
      return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(value, unit)
    } catch {
      return `${Math.abs(value)} ${unit}${Math.abs(value) === 1 ? '' : 's'} ago`
    }
  }
}
