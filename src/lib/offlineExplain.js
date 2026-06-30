// Offline fallback "explanation": when there's no internet, we can't call
// Gemini, so we OCR the image (Tesseract) and apply simple rules to the text to
// build a result object that matches the Gemini schema exactly — so the same
// ResultScreen renders it, with a low-confidence nudge to verify.

import { STRINGS } from '../i18n/strings.js'

// ₹1,234 / ₹ 1,234.00 / Rs. 1234 / Rs 1,234.50
const AMOUNT_RE = /(?:₹|Rs\.?)\s?[\d,]+(?:\.\d{1,2})?/i
// 15/07/2026, 15-7-26, 1.12.2026
const DATE_NUMERIC_RE = /\b\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}\b/
// 15 July 2026 / 15 Jul 26 (English + a few common month spellings)
const DATE_MONTH_RE =
  /\b\d{1,2}\s?(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s?\d{2,4}\b/i

function detectDocType(lower) {
  if (/bijli|electricity|mseb|bescom|वीज|बिजली|বিদ্যুৎ/.test(lower)) return 'electricity bill'
  if (/cylinder|indane|bharatgas|bharat gas|hp gas|गैस|सिलेंडर|গ্যাস|সিলিন্ডার|\bgas\b/.test(lower))
    return 'gas bill'
  if (/water|\bjal\b|पानी|पाणी|জল|পানি/.test(lower)) return 'water bill'
  if (/\bbank\b|account|debit|credit|खाता|बैंक|ব্যাংক|অ্যাকাউন্ট/.test(lower)) return 'bank document'
  return 'document'
}

function detectScam(lower) {
  const hasOtp = /\botp\b|one[\s-]?time\s?password|ओटीपी|ওটিপি/.test(lower)
  const pressure = /share|urgent|blocked|verify|expire|suspend|तुरंत|जल्दी|शेयर|सत्यापित|ব্লক|যাচাই|জরুরি/.test(
    lower,
  )
  return hasOtp && pressure
}

// Build an offline result. `text` is the OCR output (possibly empty), `lang`
// the current UI language. Always returns a valid result object.
export function buildOfflineResult(text, lang) {
  const S = STRINGS[lang] || STRINGS.en
  const raw = text || ''
  const lower = raw.toLowerCase()

  const key_facts = []
  const amount = raw.match(AMOUNT_RE)
  if (amount) key_facts.push({ label: S.offlineLabelAmount, value: amount[0].trim() })
  const date = raw.match(DATE_NUMERIC_RE) || raw.match(DATE_MONTH_RE)
  if (date) key_facts.push({ label: S.offlineLabelDate, value: date[0].trim() })

  const is_possible_scam = detectScam(lower)

  return {
    offline: true, // marks this as a rule-based offline result (see ResultScreen)
    doc_type: detectDocType(lower),
    title: S.offlineTitle,
    summary: S.offlineSummary,
    key_facts,
    what_to_do: [S.offlineAction],
    warnings: is_possible_scam ? [S.scamBody] : [],
    is_possible_scam,
    confidence: 'low',
  }
}
