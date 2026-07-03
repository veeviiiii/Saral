// Overlays machine-translated Sikhao strings onto the base flows at load time.
//
// scripts/translate.js writes one file per language into ./locales (keyed by the
// English source string). Here we load whatever exists and, for every multilang
// object in the flows, fill in obj[<code>] from the matching English string.
// Matching by the source string (not by position) means it's robust to flow
// edits and safe: a missing translation leaves the existing value untouched, so
// pickLang still falls back to English. This module is imported once for its
// side effect and is app-only — the translate script reads the base flows
// directly and never touches import.meta.glob.
import { ALL_FLOWS, CATEGORIES } from './index.js'

// Eager glob: Vite inlines only the files that exist, so this is a no-op until
// the translate script has generated locale files.
const modules = import.meta.glob('./locales/*.json', { eager: true })

const TABLES = {} // { code: { [englishSource]: translated } }
for (const [path, mod] of Object.entries(modules)) {
  const code = path.match(/([a-z]+)\.json$/)?.[1]
  if (code && code !== 'en') TABLES[code] = mod.default ?? mod
}

const CODES = Object.keys(TABLES)

// Walk any flow value; when we hit a multilang leaf (an object with a string
// `en`), overlay each language's translation if we have one.
function overlay(node) {
  if (Array.isArray(node)) {
    for (const child of node) overlay(child)
    return
  }
  if (!node || typeof node !== 'object') return
  if (typeof node.en === 'string') {
    for (const code of CODES) {
      const translated = TABLES[code][node.en]
      if (translated) node[code] = translated
    }
    return
  }
  for (const value of Object.values(node)) overlay(value)
}

if (CODES.length) {
  for (const flow of ALL_FLOWS) overlay(flow)
  for (const cat of CATEGORIES) overlay(cat.label)
}
