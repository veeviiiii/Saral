import { useCallback, useEffect, useRef, useState } from 'react'
import { SPEECH_LANG } from '../i18n/strings.js'

// Read-aloud (core feature). Degrades gracefully if unavailable.
export function useSpeech() {
  const supported =
    typeof window !== 'undefined' && 'speechSynthesis' in window
  const [speaking, setSpeaking] = useState(false)

  // Stop any speech when the component using this unmounts.
  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel()
    }
  }, [supported])

  const speak = useCallback(
    (text, code) => {
      if (!supported || !text) return
      window.speechSynthesis.cancel() // always cancel in-progress first
      const u = new SpeechSynthesisUtterance(text)
      u.lang = SPEECH_LANG[code] || 'en-IN'
      u.rate = 0.95
      u.onend = () => setSpeaking(false)
      u.onerror = () => setSpeaking(false)
      setSpeaking(true)
      window.speechSynthesis.speak(u)
    },
    [supported],
  )

  const stop = useCallback(() => {
    if (supported) window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [supported])

  return { supported, speaking, speak, stop }
}

// Optional voice input (SpeechRecognition). Patchy for Indic — degrade gracefully.
export function useSpeechInput() {
  const Rec =
    typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition)
  const supported = Boolean(Rec)
  const [listening, setListening] = useState(false)
  const recRef = useRef(null)

  const stop = useCallback(() => {
    try {
      recRef.current?.stop()
    } catch {
      /* ignore */
    }
    setListening(false)
  }, [])

  const start = useCallback(
    (code, onResult) => {
      if (!supported) return
      try {
        const rec = new Rec()
        rec.lang = SPEECH_LANG[code] || 'en-IN'
        rec.interimResults = false
        rec.maxAlternatives = 1
        rec.onresult = (e) => {
          const transcript = e.results?.[0]?.[0]?.transcript?.trim()
          if (transcript) onResult?.(transcript)
        }
        rec.onend = () => setListening(false)
        rec.onerror = () => setListening(false)
        recRef.current = rec
        setListening(true)
        rec.start()
      } catch {
        setListening(false)
      }
    },
    [Rec, supported],
  )

  useEffect(() => () => stop(), [stop])

  return { supported, listening, start, stop }
}

// Voice input that lets the browser transcribe without a fixed language, so we
// can auto-detect the spoken language from the resulting text. Finishes on the
// recogniser's own end, on error, or after 3s of silence — whichever first.
export function useVoiceAutoDetect() {
  const Rec =
    typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition)
  const supported = Boolean(Rec)
  const [listening, setListening] = useState(false)
  const recRef = useRef(null)
  const silenceRef = useRef(null)
  const textRef = useRef('')
  const doneRef = useRef(false)

  const stop = useCallback(() => {
    clearTimeout(silenceRef.current)
    try {
      recRef.current?.stop()
    } catch {
      /* ignore */
    }
    setListening(false)
  }, [])

  const start = useCallback(
    (onResult) => {
      if (!supported) {
        onResult?.(null)
        return
      }
      try {
        const rec = new Rec()
        // Intentionally do NOT set rec.lang — let the browser transcribe with
        // its default and we detect the language from the text afterwards.
        rec.interimResults = true
        rec.continuous = false
        rec.maxAlternatives = 1
        textRef.current = ''
        doneRef.current = false

        const finish = () => {
          if (doneRef.current) return
          doneRef.current = true
          clearTimeout(silenceRef.current)
          try {
            rec.stop()
          } catch {
            /* ignore */
          }
          setListening(false)
          onResult?.(textRef.current.trim() || null)
        }

        rec.onresult = (e) => {
          let txt = ''
          for (let i = 0; i < e.results.length; i++) {
            txt += e.results[i][0]?.transcript || ''
          }
          textRef.current = txt
          // Reset the 3-second silence countdown on every new chunk.
          clearTimeout(silenceRef.current)
          silenceRef.current = setTimeout(finish, 3000)
        }
        rec.onend = finish
        rec.onerror = finish
        recRef.current = rec
        setListening(true)
        rec.start()
      } catch {
        setListening(false)
        onResult?.(null)
      }
    },
    [Rec, supported],
  )

  useEffect(() => () => stop(), [stop])

  return { supported, listening, start, stop }
}
