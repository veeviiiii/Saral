// Offline fallback "explanation": when there's no internet, we can't call
// Gemini, so we OCR the image (Tesseract) and apply rules to the text to build
// a result object matching the Gemini schema exactly — the same ResultScreen
// renders it, with a low-confidence nudge to verify.
//
// Three rule layers, all on-device:
//   1. Extraction  — amount, date, biller, consumer/account no, units, phones.
//   2. Classifier  — score-based doc-type over a multi-script keyword
//                    dictionary (every script the shipped traineddata can read:
//                    Latin, Devanagari, Bengali, Tamil, Telugu, Gujarati,
//                    Kannada).
//   3. Scam check  — combination heuristics; single keywords never flag
//                    (a bank letter merely mentioning OTP policy must pass).
//
// The summary/what-to-do come from per-doc-type templates in the i18n files
// (English until `npm run translate` fills the other languages — the per-key
// English fallback below keeps it rendering everywhere meanwhile).

import { STRINGS } from '../i18n/strings.js'

// ── 1. Extraction ──────────────────────────────────────────────────────────

// ₹1,234 / ₹ 1,234.00 / Rs. 1234 / INR 1,234.50 / Rs 25 Lakh (no trailing
// comma — digit groups must start with a digit after each comma).
const AMOUNT_RE =
  /(?:₹|Rs\.?|INR)\s?\d+(?:,\d+)*(?:\.\d{1,2})?(?:\s?(?:lakh|lac|crore|cr\b))?/i
// "Total due: 1,250" — label + comma-grouped number (comma required so a bare
// "15" out of a date can never be mistaken for money).
const AMOUNT_LABELLED_RE =
  /(?:total|amount|payable|due|bill)\D{0,12}(\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?)/i
// 15/07/2026, 15-7-26, 1.12.2026
const DATE_NUMERIC_RE = /\b\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}\b/
// 15 July 2026 / 15 Jul 26
const DATE_MONTH_RE =
  /\b\d{1,2}\s?(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s?\d{2,4}\b/i
// "Consumer No: AB123456" — label word, then a 6–20 char alphanumeric id.
const CONSUMER_RE =
  /(?:consumer|customer|account|a\/?c|acct|connection|उपभोक्ता|ग्राहक|खाता)\s*(?:no|number|num|id|क्रमांक|संख्या|नं)?\s*[:#.\-]?\s*([A-Z0-9][A-Z0-9\-/]{5,19})/i
// 320 kWh / 45 units / 14.2 KL / 5 litres — same-line only ([ \t], not \s,
// so a number ending one line never pairs with a unit word starting the next).
const UNITS_RE = /(\d+(?:,\d+)*(?:\.\d+)?)[ \t]*(?:kwh|units?|यूनिट|kl\b|litres?|liters?)/i
// Indian mobile (10 digits starting 6-9, optional +91/0) — no lookbehind so
// older WebKit doesn't choke parsing the bundle.
const MOBILE_RE = /(?:^|\D)((?:\+?91[\s-]?|0)?[6-9]\d{9})(?=\D|$)/
const TOLLFREE_RE = /\b1800[\s-]?\d{2,4}[\s-]?\d{3,4}\b/

// Known company names → canonical display form. Brand hits also feed the
// classifier (weight 2). Names mirror the ones used in the Sikhao content
// (Jio, Airtel, Indane, …) so both features speak the same language.
const BRANDS = [
  // electricity boards / suppliers
  ['electricity', ['msedcl', 'mseb', 'mahavitaran', 'mahadiscom'], 'Mahavitaran (MSEDCL)'],
  ['electricity', ['bescom'], 'BESCOM'],
  ['electricity', ['tneb', 'tangedco'], 'TANGEDCO (TNEB)'],
  ['electricity', ['tsspdcl', 'apspdcl', 'apepdcl'], 'AP/TS Power Distribution'],
  ['electricity', ['pgvcl', 'mgvcl', 'ugvcl', 'dgvcl'], 'Gujarat Vij Company'],
  ['electricity', ['torrent power'], 'Torrent Power'],
  ['electricity', ['tata power'], 'Tata Power'],
  ['electricity', ['adani electricity'], 'Adani Electricity'],
  ['electricity', ['bses'], 'BSES'],
  ['electricity', ['cesc'], 'CESC'],
  ['electricity', ['wbsedcl'], 'WBSEDCL'],
  ['electricity', ['uppcl'], 'UPPCL'],
  ['electricity', ['kseb'], 'KSEB'],
  // gas companies (same names as the Sikhao gas flows)
  ['gas', ['indane', 'indianoil', 'indian oil'], 'Indane (IndianOil)'],
  ['gas', ['hp gas', 'hpcl'], 'HP Gas'],
  ['gas', ['bharat gas', 'bharatgas', 'bpcl'], 'Bharat Gas'],
  // banks
  ['bank', ['sbi', 'state bank'], 'State Bank of India'],
  ['bank', ['hdfc'], 'HDFC Bank'],
  ['bank', ['icici'], 'ICICI Bank'],
  ['bank', ['axis bank'], 'Axis Bank'],
  ['bank', ['pnb', 'punjab national'], 'Punjab National Bank'],
  ['bank', ['canara'], 'Canara Bank'],
  ['bank', ['kotak'], 'Kotak Bank'],
  ['bank', ['bank of baroda'], 'Bank of Baroda'],
  ['bank', ['union bank'], 'Union Bank'],
  ['bank', ['ippb', 'india post payments'], 'India Post Payments Bank'],
  // telecom (same names as the Sikhao recharge flows)
  ['mobile_recharge', ['jio'], 'Jio'],
  ['mobile_recharge', ['airtel'], 'Airtel'],
  ['mobile_recharge', ['vodafone', ' vi ', 'vi-'], 'Vi'],
  ['mobile_recharge', ['bsnl'], 'BSNL'],
]

function findBrand(lower) {
  for (const [category, aliases, display] of BRANDS) {
    if (aliases.some((a) => lower.includes(a))) return { category, display }
  }
  return null
}

// First plausible name-ish line near the top of the document (biller names sit
// at the top of most bills). Letter-heavy, no long digit runs, sane length.
function guessBillerFromTopLines(raw) {
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 4)
  for (const line of lines) {
    if (line.length < 3 || line.length > 48) continue
    if (/\d{4,}/.test(line)) continue
    const letters = (line.match(/\p{L}/gu) || []).length
    if (letters / line.length >= 0.6) return line
  }
  return null
}

function extractFields(raw, lower) {
  const fields = {}

  const amount = raw.match(AMOUNT_RE)?.[0] ?? raw.match(AMOUNT_LABELLED_RE)?.[1]
  if (amount) fields.amount = amount.trim()

  const date = raw.match(DATE_NUMERIC_RE) || raw.match(DATE_MONTH_RE)
  if (date) fields.date = date[0].trim()

  const mobile = raw.match(MOBILE_RE)?.[1]?.trim()
  const tollfree = raw.match(TOLLFREE_RE)?.[0]?.trim()
  if (mobile || tollfree) fields.phone = mobile || tollfree
  if (mobile) fields.mobile = mobile // scam signal: callback number

  const consumer = raw.match(CONSUMER_RE)?.[1]
  // Don't let "customer care no: 98765..." masquerade as an account number.
  if (consumer && consumer !== mobile && consumer.replace(/\D/g, '') !== mobile) {
    fields.consumerNo = consumer.trim()
  }

  const units = raw.match(UNITS_RE)?.[0]
  if (units) fields.units = units.trim()

  const brand = findBrand(lower)
  if (brand) {
    fields.biller = brand.display
    fields.brandCategory = brand.category
  } else {
    const guess = guessBillerFromTopLines(raw)
    if (guess) fields.biller = guess
  }

  return fields
}

// ── 2. Doc-type classifier ─────────────────────────────────────────────────
// Keyword variants per category in every script the shipped traineddata can
// read (eng + hin/Devanagari + ben + tam + tel + guj + kan). Each keyword hit
// scores 1, a brand hit scores 2; highest total wins, minimum score 2, else
// "other".

const CATEGORIES = [
  {
    id: 'electricity',
    typeKey: 'otTypeElectricity',
    keywords: [
      'electricity', 'bijli', 'kwh', 'meter', 'energy charge', 'power supply',
      'बिजली', 'विद्युत', 'वीज', 'मीटर', 'यूनिट',
      'বিদ্যুৎ', 'মিটার',
      'மின்சாரம்', 'மின்', 'மீட்டர்',
      'విద్యుత్', 'కరెంటు', 'మీటర్',
      'વીજળી', 'વીજ', 'મીટર',
      'ವಿದ್ಯುತ್', 'ಕರೆಂಟ್', 'ಮೀಟರ್',
    ],
  },
  {
    id: 'gas',
    typeKey: 'otTypeGas',
    keywords: [
      'gas', 'cylinder', 'lpg', 'refill', 'subsidy',
      'गैस', 'सिलेंडर', 'सिलिंडर',
      'গ্যাস', 'সিলিন্ডার',
      'எரிவாயு', 'சிலிண்டர்',
      'గ్యాస్', 'సిలిండర్',
      'ગેસ', 'સિલિન્ડર',
      'ಗ್ಯಾಸ್', 'ಸಿಲಿಂಡರ್',
    ],
  },
  {
    id: 'water',
    typeKey: 'otTypeWater',
    keywords: [
      'water bill', 'water supply', 'water charge', 'jal board', 'litres',
      'पानी', 'जल', 'पाणी', 'पेयजल',
      'জল', 'পানি',
      'தண்ணீர்', 'குடிநீர்',
      'నీటి', 'మంచినీరు',
      'પાણી',
      'ನೀರು', 'ನೀರಿನ',
    ],
  },
  {
    id: 'bank',
    typeKey: 'otTypeBank',
    keywords: [
      'bank', 'account', 'a/c', 'balance', 'debited', 'credited', 'ifsc',
      'atm', 'passbook', 'statement', 'neft', 'imps',
      'बैंक', 'खाता', 'जमा', 'शेष',
      'ব্যাংক', 'অ্যাকাউন্ট',
      'வங்கி', 'கணக்கு',
      'బ్యాంక్', 'ఖాతా',
      'બેંક', 'ખાતું',
      'ಬ್ಯಾಂಕ್', 'ಖಾತೆ',
    ],
  },
  {
    id: 'mobile_recharge',
    typeKey: 'otTypeRecharge',
    keywords: [
      'recharge', 'prepaid', 'validity', 'talktime', 'data pack', 'plan',
      'unlimited calls',
      'रिचार्ज', 'वैधता',
      'রিচার্জ',
      'ரீசார்ஜ்',
      'రీఛార్జ్',
      'રિચાર્જ',
      'ರೀಚಾರ್ಜ್',
    ],
  },
  {
    id: 'govt_notice',
    typeKey: 'otTypeGovt',
    keywords: [
      'government', 'notice', 'municipal', 'panchayat', 'tehsil', 'collector',
      'application', 'aadhaar', 'ration', 'certificate', '.gov.in',
      'सरकार', 'नोटिस', 'कार्यालय', 'आधार', 'राशन', 'प्रमाण',
      'সরকার', 'নোটিশ', 'আধার',
      'அரசு', 'அறிவிப்பு', 'ஆதார்',
      'ప్రభుత్వం', 'నోటీసు', 'ఆధార్',
      'સરકાર', 'નોટિસ', 'આધાર',
      'ಸರ್ಕಾರ', 'ನೋಟಿಸ್', 'ಆಧಾರ್',
    ],
  },
  {
    id: 'sms_scam',
    typeKey: 'otTypeScam',
    keywords: [
      'lottery', 'prize', 'winner', 'won', 'congratulations', 'lucky draw',
      'claim', 'kyc', 'suspended', 'blocked', 'click here', 'verify now',
      'crore', 'lakh',
      'लॉटरी', 'इनाम', 'जीता', 'बधाई', 'केवाईसी',
      'লটারি', 'পুরস্কার', 'জিতেছেন',
      'லாட்டரி', 'பரிசு', 'வென்றீர்கள்',
      'లాటరీ', 'బహుమతి', 'గెలిచారు',
      'લોટરી', 'ઇનામ', 'જીત્યા',
      'ಲಾಟರಿ', 'ಬಹುಮಾನ', 'ಗೆದ್ದಿದ್ದೀರಿ',
    ],
  },
]

const MIN_SCORE = 2

function classify(lower, fields) {
  let best = { id: 'other', score: 0 }
  for (const cat of CATEGORIES) {
    let score = cat.keywords.reduce((n, kw) => n + (lower.includes(kw) ? 1 : 0), 0)
    if (fields.brandCategory === cat.id) score += 2
    if (score > best.score) best = { id: cat.id, score }
  }
  return best.score >= MIN_SCORE ? best.id : 'other'
}

// ── 3. Scam heuristics ─────────────────────────────────────────────────────
// Combinations only — no single keyword can flag. A legit bank statement that
// merely says "never share your OTP" has the secret word but no urgency and no
// callback channel, so it passes.

const URGENCY = [
  'immediately', 'urgent', 'within 24', '24 hours', 'today only', 'right now',
  'expire', 'expir', 'blocked', 'block', 'suspend', 'deactivat', 'last chance',
  'तुरंत', 'तत्काल', 'जल्दी', 'ब्लॉक', 'बंद हो', 'निलंबित', 'समाप्त',
  'এখনই', 'জরুরি', 'ব্লক', 'বন্ধ',
  'உடனே', 'அவசரம்',
  'వెంటనే', 'తక్షణమే',
  'તાત્કાલિક', 'તરત',
  'ತಕ್ಷಣ', 'ಕೂಡಲೇ',
]
const SECRET = ['otp', 'one time password', 'pin', 'cvv', 'password',
  'ओटीपी', 'पिन', 'पासवर्ड', 'ওটিপি', 'পিন', 'பின்', 'పిన్', 'પિન', 'ಪಿನ್']
const LINK = ['http', 'www.', 'bit.ly', 'tinyurl', 'wa.me', '.apk', 'click',
  'लिंक', 'লিংক', 'கிளிக்', 'క్లిక్', 'ક્લિક', 'ಕ್ಲಿಕ್']
const LOTTERY = ['lottery', 'prize', 'winner', 'won', 'congratulations',
  'lucky draw', 'crore', 'lakh',
  'लॉटरी', 'इनाम', 'जीता', 'बधाई', 'লটারি', 'পুরস্কার', 'জিতেছেন',
  'லாட்டரி', 'பரிசு', 'లాటరీ', 'బహుమతి', 'લોટરી', 'ઇનામ', 'ಲಾಟರಿ', 'ಬಹುಮಾನ']
const PAYMENT = ['pay', 'fee', 'deposit', 'transfer', 'send money', 'processing',
  'भुगतान', 'फीस', 'भेजें', 'கட்டண', 'ఫీజు', 'ફી', 'ಶುಲ್ಕ']
const PERSONAL = ['aadhaar', 'pan', 'bank details', 'account number', 'card number',
  'आधार', 'पैन', 'আধার', 'ஆதார்', 'ఆధార్', 'આધાર', 'ಆಧಾರ್']
const KYC = ['kyc', 'केवाईसी']

const hasAny = (lower, list) => list.some((w) => lower.includes(w))

function assessScam(lower, fields) {
  const urgency = hasAny(lower, URGENCY)
  const secret = hasAny(lower, SECRET)
  const link = hasAny(lower, LINK)
  const lottery = hasAny(lower, LOTTERY)
  const payment = hasAny(lower, PAYMENT)
  const personal = hasAny(lower, PERSONAL)
  const kyc = hasAny(lower, KYC)
  const callback = Boolean(fields.mobile) // a mobile number to call back

  const isScam =
    (urgency && secret && (link || callback)) || // "share OTP now or account blocked"
    (lottery && (payment || personal || secret)) || // "you won — pay the fee"
    (kyc && urgency && (link || callback)) // "KYC expires today, click link"

  // Which red flag to name in the template, most alarming first.
  let redFlagKey = 'otFlagPersonal'
  if (secret) redFlagKey = lower.includes('otp') || lower.includes('ओटीपी') ? 'otFlagOtp' : 'otFlagPin'
  else if (personal && hasAny(lower, ['bank details', 'account number', 'card number']))
    redFlagKey = 'otFlagBankDetails'
  else if (payment) redFlagKey = 'otFlagPayment'

  return { isScam, redFlagKey }
}

// ── 4. Templates → result object ───────────────────────────────────────────

// Per-category template keys (summary + actions). "other" keeps the original
// generic offline strings, so unclassified documents look exactly like before.
const TEMPLATES = {
  electricity: { summary: 'otElectricitySummary', actions: ['otActionPayByDate', 'otActionKeepSafe'] },
  gas: { summary: 'otGasSummary', actions: ['otActionPayByDate', 'otActionKeepSafe'] },
  water: { summary: 'otWaterSummary', actions: ['otActionPayByDate', 'otActionKeepSafe'] },
  bank: { summary: 'otBankSummary', actions: ['otActionBankCheck', 'otActionKeepSafe'] },
  mobile_recharge: { summary: 'otRechargeSummary', actions: ['otActionRechargeCheck'] },
  govt_notice: { summary: 'otGovtSummary', actions: ['otActionGovtOffice', 'otActionKeepSafe'] },
  sms_scam: { summary: 'otScamSummary', actions: ['scamBody', 'otScamAction'] },
  other: { summary: 'offlineSummary', actions: [] },
}

function fill(template, vars) {
  let out = template
  for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, v)
  return out
}

// Build an offline result. `text` is the OCR output (possibly empty), `lang`
// the current UI language. Always returns a valid result object in the exact
// shape the Gemini path produces.
export function buildOfflineResult(text, lang) {
  // Per-key fallback to English: the new template strings exist only in
  // en.json until the translate script runs for the other languages.
  const s = (key) => STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? ''

  const raw = text || ''
  const lower = raw.toLowerCase()

  const fields = extractFields(raw, lower)
  const { isScam, redFlagKey } = assessScam(lower, fields)
  let category = classify(lower, fields)
  if (isScam) category = 'sms_scam' // high-confidence scam overrides the topic

  // Key facts from whatever was extracted, most useful first.
  const key_facts = []
  if (fields.biller && category !== 'sms_scam' && category !== 'other')
    key_facts.push({ label: s('offlineLabelBiller'), value: fields.biller })
  if (fields.amount) key_facts.push({ label: s('offlineLabelAmount'), value: fields.amount })
  if (fields.date) key_facts.push({ label: s('offlineLabelDate'), value: fields.date })
  if (fields.consumerNo)
    key_facts.push({ label: s('offlineLabelConsumerNo'), value: fields.consumerNo })
  if (fields.units) key_facts.push({ label: s('offlineLabelUnits'), value: fields.units })
  if (fields.phone && category !== 'sms_scam')
    key_facts.push({ label: s('offlineLabelPhone'), value: fields.phone })

  // Summary: category template (+ biller sentence when we know the company).
  const tpl = TEMPLATES[category]
  let summary = fill(s(tpl.summary), { red_flag: s(redFlagKey) })
  if (fields.biller && !['sms_scam', 'other'].includes(category)) {
    summary += ' ' + fill(s('otFromBiller'), { biller: fields.biller })
  }

  const what_to_do = [...tpl.actions.map((k) => s(k)), s('offlineAction')].filter(Boolean)

  return {
    offline: true, // marks this as a rule-based offline result (see ResultScreen)
    // Localized eyebrow label; 'other' → '' so ResultScreen falls back to the
    // already-localized generic ("What this paper says").
    doc_type: s(CATEGORIES.find((c) => c.id === category)?.typeKey ?? ''),
    title: s('offlineTitle'),
    summary,
    key_facts,
    what_to_do,
    warnings: isScam ? [s('scamBody')] : [],
    is_possible_scam: isScam,
    confidence: 'low',
  }
}
