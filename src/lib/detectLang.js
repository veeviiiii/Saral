// Guess the language of a spoken transcript from its script (+ a few Marathi
// marker words, since Marathi and Hindi share the Devanagari script).
//
// Returns 'hi' | 'bn' | 'mr' | 'en', or null when we can't tell (empty text).
// Pure and defensive — never throws.

const DEVANAGARI = /[ऀ-ॿ]/
const BENGALI = /[ঀ-৿]/

// Distinctively-Marathi tokens (these differ from their Hindi equivalents).
const MARATHI_MARKERS = [
  'आहे', 'आहेत', 'नाही', 'मला', 'तुम्ही', 'तुम्हाला', 'काय', 'कसं', 'कसे',
  'पाहिजे', 'करायचे', 'होते', 'मराठी', 'कुठे', 'किती', 'माझा', 'माझी',
  'आम्ही', 'तू', 'छान', 'धन्यवाद', 'नको', 'झाले', 'करा',
]

export function detectLanguage(transcript) {
  const text = (transcript || '').trim()
  if (!text) return null

  if (BENGALI.test(text)) return 'bn'

  if (DEVANAGARI.test(text)) {
    if (MARATHI_MARKERS.some((w) => text.includes(w))) return 'mr'
    return 'hi'
  }

  // Latin / anything else → treat as English.
  return 'en'
}
