// Guess the language of a spoken transcript from its script. Scripts with a
// unique Unicode block map straight to a language; shared scripts fall back to
// the most common language for that script (Devanagari → Hindi/Marathi, Bengali
// script → Bengali). Best-effort — voice recognition for Indic is patchy.
//
// Returns a language code, or null when we can't tell (empty text).
// Pure and defensive — never throws.

// Scripts with a single dominant language in this app → detect directly.
const UNIQUE_SCRIPTS = [
  [/[஀-௿]/, 'ta'], // Tamil
  [/[ఀ-౿]/, 'te'], // Telugu
  [/[ಀ-೿]/, 'kn'], // Kannada
  [/[ഀ-ൿ]/, 'ml'], // Malayalam
  [/[઀-૿]/, 'gu'], // Gujarati
  [/[਀-੿]/, 'pa'], // Gurmukhi (Punjabi)
  [/[଀-୿]/, 'or'], // Odia
  [/[؀-ۿ]/, 'ur'], // Arabic script (Urdu)
]

const DEVANAGARI = /[ऀ-ॿ]/ // Hindi, Marathi, Sanskrit, Nepali, Konkani
const BENGALI = /[ঀ-৿]/ // Bengali, Assamese

// Distinctively-Marathi tokens (these differ from their Hindi equivalents).
const MARATHI_MARKERS = [
  'आहे', 'आहेत', 'नाही', 'मला', 'तुम्ही', 'तुम्हाला', 'काय', 'कसं', 'कसे',
  'पाहिजे', 'करायचे', 'होते', 'मराठी', 'कुठे', 'किती', 'माझा', 'माझी',
  'आम्ही', 'तू', 'छान', 'धन्यवाद', 'नको', 'झाले', 'करा',
]

export function detectLanguage(transcript) {
  const text = (transcript || '').trim()
  if (!text) return null

  for (const [re, code] of UNIQUE_SCRIPTS) {
    if (re.test(text)) return code
  }

  if (BENGALI.test(text)) return 'bn' // Assamese shares this script → defaults to bn

  if (DEVANAGARI.test(text)) {
    // Marathi vs Hindi (Sanskrit/Nepali/Konkani also share Devanagari → hi).
    if (MARATHI_MARKERS.some((w) => text.includes(w))) return 'mr'
    return 'hi'
  }

  // Latin / anything else → treat as English.
  return 'en'
}
