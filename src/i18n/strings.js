// Language metadata + UI strings for Saral's 17 languages.
//
// The human-facing UI strings live in one JSON file per language under
// ./locales (hi/en/mr/bn have real content; the rest are being translated —
// mai.json is currently an English placeholder). Assembling them here keeps a
// single STRINGS import for the rest of the app. Prompts to Gemini stay in
// English — see API_LANGUAGE_NAME.

import hi from './locales/hi.json'
import en from './locales/en.json'
import mr from './locales/mr.json'
import bn from './locales/bn.json'
import ta from './locales/ta.json'
import te from './locales/te.json'
import kn from './locales/kn.json'
import ml from './locales/ml.json'
import gu from './locales/gu.json'
import pa from './locales/pa.json'
import or from './locales/or.json'
import as from './locales/as.json'
import ur from './locales/ur.json'
import sa from './locales/sa.json'
import ne from './locales/ne.json'
import kok from './locales/kok.json'
import mai from './locales/mai.json'

export const STRINGS = {
  hi, en, mr, bn, ta, te, kn, ml, gu, pa, or, as, ur, sa, ne, kok, mai,
}

// Language config. `label` is the endonym (the language's name in its own
// script). `dir` is the writing direction — 'rtl' only for Urdu — and drives
// the document direction so the whole layout mirrors for RTL.
export const LANGUAGES = [
  { code: 'hi', label: 'हिंदी', dir: 'ltr' },
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'mr', label: 'मराठी', dir: 'ltr' },
  { code: 'bn', label: 'বাংলা', dir: 'ltr' },
  { code: 'ta', label: 'தமிழ்', dir: 'ltr' },
  { code: 'te', label: 'తెలుగు', dir: 'ltr' },
  { code: 'kn', label: 'ಕನ್ನಡ', dir: 'ltr' },
  { code: 'ml', label: 'മലയാളം', dir: 'ltr' },
  { code: 'gu', label: 'ગુજરાતી', dir: 'ltr' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ', dir: 'ltr' },
  { code: 'or', label: 'ଓଡ଼ିଆ', dir: 'ltr' },
  { code: 'as', label: 'অসমীয়া', dir: 'ltr' },
  { code: 'ur', label: 'اردو', dir: 'rtl' },
  { code: 'sa', label: 'संस्कृतम्', dir: 'ltr' },
  { code: 'ne', label: 'नेपाली', dir: 'ltr' },
  { code: 'kok', label: 'कोंकणी', dir: 'ltr' },
  { code: 'mai', label: 'मैथिली', dir: 'ltr' },
]

// Right-to-left language codes, derived from the config above.
export const RTL_LANGS = LANGUAGES.filter((l) => l.dir === 'rtl').map((l) => l.code)

// Writing direction ('ltr' | 'rtl') for a code; defaults to ltr for unknowns.
export function dirForLang(code) {
  return LANGUAGES.find((l) => l.code === code)?.dir ?? 'ltr'
}

// Pick a per-language content field (Sikhao steps/titles), falling back to
// English then Hindi so nothing ever renders blank while translations land.
export function pickLang(obj, lang) {
  if (!obj) return ''
  return obj[lang] ?? obj.en ?? obj.hi ?? ''
}

// Full language name sent to the Gemini proxy ("Always reply in {language}").
export const API_LANGUAGE_NAME = {
  hi: 'Hindi',
  en: 'English',
  mr: 'Marathi',
  bn: 'Bengali',
  ta: 'Tamil',
  te: 'Telugu',
  kn: 'Kannada',
  ml: 'Malayalam',
  gu: 'Gujarati',
  pa: 'Punjabi',
  or: 'Odia',
  as: 'Assamese',
  ur: 'Urdu',
  sa: 'Sanskrit',
  ne: 'Nepali',
  kok: 'Konkani',
  mai: 'Maithili',
}

// SpeechSynthesis / SpeechRecognition BCP-47 locale per language.
//
// Device voice coverage is uneven. Well-supported on most phones: hi, en, mr,
// bn, ta, te, kn, ml, gu, pa. Rarely shipped: Odia (or-IN), Assamese (as-IN),
// Nepali (ne-NP) and Urdu (ur-IN / ur-PK) — these may have no on-device voice.
// Sanskrit, Konkani and Maithili have essentially no TTS voices, so they fall
// back to hi-IN (all three use the Devanagari script, which the Hindi voice can
// pronounce acceptably). When no matching voice exists the browser picks its
// default; the Listen button already hides/degrades gracefully in that case.
export const SPEECH_LANG = {
  hi: 'hi-IN',
  en: 'en-IN',
  mr: 'mr-IN',
  bn: 'bn-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  gu: 'gu-IN',
  pa: 'pa-IN',
  or: 'or-IN', // Odia — device voice rare
  as: 'as-IN', // Assamese — device voice rare
  ur: 'ur-IN', // Urdu — may need ur-PK on some devices; often unsupported
  sa: 'hi-IN', // Sanskrit — no voice; read via Hindi (shared Devanagari)
  ne: 'ne-NP', // Nepali — device voice rare
  kok: 'hi-IN', // Konkani — no voice; read via Hindi (shared Devanagari)
  mai: 'hi-IN', // Maithili — no voice; read via Hindi (shared Devanagari)
}
