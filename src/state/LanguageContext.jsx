import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { LANGUAGES, STRINGS } from '../i18n/strings.js'

const STORAGE_KEY = 'saral.lang'
const DEFAULT_LANG = 'hi' // App opens in Hindi (SKILL.md demo flow).

const LanguageContext = createContext(null)

function readStoredLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && STRINGS[saved]) return saved
  } catch {
    /* localStorage may be unavailable — ignore */
  }
  return DEFAULT_LANG
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(readStoredLang)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      /* ignore */
    }
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((code) => {
    if (STRINGS[code]) setLangState(code)
  }, [])

  // t('key') with optional {tokens} interpolation. Falls back to English, then key.
  const t = useCallback(
    (key, vars) => {
      let str = STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replaceAll(`{${k}}`, String(v))
        }
      }
      return str
    },
    [lang],
  )

  const langLabel = useMemo(
    () => LANGUAGES.find((l) => l.code === lang)?.label ?? lang,
    [lang],
  )

  const value = useMemo(() => ({ lang, setLang, t, langLabel }), [lang, setLang, t, langLabel])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>')
  return ctx
}
