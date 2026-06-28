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
