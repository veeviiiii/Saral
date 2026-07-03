import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLanguage } from '../state/LanguageContext.jsx'

// Config-driven spotlight tour that spans multiple screens. Each step names the
// screen it belongs to, the target selector on that screen (or null for a
// centered explainer card), placement, and an optional custom button label.
export const TOUR_STEPS = [
  // ── Home (5) ──
  { screen: '/', target: '[data-tour="language"]', title: 'obLangTitle', body: 'obLangBody', place: 'below' },
  { screen: '/', target: '[data-tour="samjhao"]', title: 'obSamjhaoTitle', body: 'obSamjhaoBody', place: 'below' },
  { screen: '/', target: '[data-tour="sikhao"]', title: 'obSikhaoTitle', body: 'obSikhaoBody', place: 'below' },
  { screen: '/', target: '[data-tour="voice"]', title: 'obVoiceTitle', body: 'obVoiceBody', place: 'above' },
  { screen: '/', target: '[data-tour="trust"]', title: 'obTrustTitle', body: 'obTrustBody', place: 'above', button: 'obGetStarted' },
  // ── Samjhao / Capture (3) ──
  { screen: '/capture', target: '[data-tour="capture-camera"]', title: 'obCamTitle', body: 'obCamBody', place: 'above' },
  { screen: '/capture', target: '[data-tour="capture-gallery"]', title: 'obGalleryTitle', body: 'obGalleryBody', place: 'above' },
  { screen: '/capture', target: null, title: 'obSamjhaoDoneTitle', body: 'obSamjhaoDoneBody', place: 'center', button: 'obContinue' },
  // ── Sikhao (5) ──
  { screen: '/sikhao', target: '[data-tour="cat-send_money"]', title: 'obSendTitle', body: 'obSendBody', place: 'below' },
  { screen: '/sikhao', target: '[data-tour="cat-recharge"]', title: 'obRechargeTitle', body: 'obRechargeBody', place: 'below' },
  { screen: '/sikhao', target: '[data-tour="cat-gas"]', title: 'obGasTitle', body: 'obGasBody', place: 'below' },
  { screen: '/sikhao', target: '[data-tour="cat-forms"]', title: 'obFormsTitle', body: 'obFormsBody', place: 'above' },
  { screen: '/sikhao', target: '[data-tour="something-else"]', title: 'obElseTitle', body: 'obElseBody', place: 'above', button: 'obFinish' },
]

const PAD = 8 // spotlight padding around the target
const GAP = 14 // space between spotlight and tooltip

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Poll the DOM until the selector resolves to a laid-out element, or timeout.
// Uses setTimeout (not rAF) so it keeps ticking even during a heavy screen
// mount (e.g. Capture loading the tfjs/tesseract chunks).
const pollFor = (selector, timeout, isCancelled) =>
  new Promise((resolve) => {
    const start = Date.now()
    const tick = () => {
      if (isCancelled()) return resolve(null)
      const el = document.querySelector(selector)
      if (el && el.getBoundingClientRect().width > 0) return resolve(el)
      if (Date.now() - start > timeout) return resolve(null)
      setTimeout(tick, 60)
    }
    tick()
  })

function spotFromEl(el) {
  const r = el.getBoundingClientRect()
  const cs = window.getComputedStyle(el)
  let radius = parseFloat(cs.borderRadius) || 12
  const h = r.height + PAD * 2
  radius = radius >= r.height / 2 ? h / 2 : radius + PAD
  return { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: h, radius }
}

export default function OnboardingWalkthrough({ steps = TOUR_STEPS, screen, onNavigate, onClose }) {
  const { t } = useLanguage()
  const [index, setIndex] = useState(0)
  const [spot, setSpot] = useState(null) // { top,left,width,height,radius } | null
  const [centered, setCentered] = useState(false) // centered explainer (no target)
  const [tip, setTip] = useState(null) // { top, left, width }
  const tipRef = useRef(null)
  const rafRef = useRef(0)

  // Latest values without re-triggering the step effect.
  const screenRef = useRef(screen)
  const navRef = useRef(onNavigate)
  const closeRef = useRef(onClose)
  useEffect(() => {
    screenRef.current = screen
  }, [screen])
  useEffect(() => {
    navRef.current = onNavigate
  }, [onNavigate])
  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  const total = steps.length
  const step = steps[index]
  const isLast = index === total - 1
  const finish = useCallback(() => closeRef.current?.(), [])

  // Prepare each step: navigate to its screen if needed, wait for the target to
  // render (poll up to ~1.2s), scroll it into view, then spotlight it. Missing
  // targets are skipped gracefully.
  useEffect(() => {
    const s = steps[index]
    if (!s) {
      finish()
      return
    }
    let cancelled = false

    ;(async () => {
      if (s.screen && s.screen !== screenRef.current) {
        setTip(null)
        setSpot(null)
        setCentered(false)
        navRef.current?.(s.screen)
      }

      if (!s.target) {
        await wait(60)
        if (cancelled) return
        setSpot(null)
        setCentered(true)
        return
      }

      const el = await pollFor(s.target, 1200, () => cancelled)
      if (cancelled) return
      if (!el) {
        if (index + 1 >= total) finish()
        else setIndex((i) => i + 1)
        return
      }
      const r0 = el.getBoundingClientRect()
      if (r0.top < 8 || r0.bottom > window.innerHeight - 8) {
        try {
          el.scrollIntoView({ block: 'center', inline: 'nearest' })
        } catch {
          /* ignore */
        }
        await wait(60)
        if (cancelled) return
      }
      setCentered(false)
      setSpot(spotFromEl(el))
    })()

    return () => {
      cancelled = true
    }
  }, [index, steps, total, finish])

  // Keep the spotlight aligned on resize/scroll.
  useEffect(() => {
    const onChange = () => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        const s = steps[index]
        if (!s || !s.target) return
        const el = document.querySelector(s.target)
        if (el && el.getBoundingClientRect().width > 0) setSpot(spotFromEl(el))
      })
    }
    window.addEventListener('resize', onChange)
    window.addEventListener('scroll', onChange, true)
    return () => {
      window.removeEventListener('resize', onChange)
      window.removeEventListener('scroll', onChange, true)
      cancelAnimationFrame(rafRef.current)
    }
  }, [index, steps])

  // Intercept browser/Android back while the tour is active — behave like Skip
  // (close the overlay, set the flag, return Home) instead of stepping back
  // through the tour's own route changes. The guard entry duplicates the
  // router's current history state so React Router stays in sync.
  useEffect(() => {
    window.history.pushState(window.history.state, '')
    const onPop = () => finish()
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [finish])

  // Position the tooltip once we have a spotlight or a centered step.
  useLayoutEffect(() => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    const W = Math.min(vw - 24, 360)
    const H = tipRef.current ? tipRef.current.offsetHeight : 200
    if (centered) {
      setTip({ top: Math.max(12, (vh - H) / 2), left: Math.round((vw - W) / 2), width: W })
      return
    }
    if (!spot) return
    const centerX = spot.left + spot.width / 2
    const left = Math.max(12, Math.min(centerX - W / 2, vw - W - 12))
    const spaceBelow = vh - (spot.top + spot.height + GAP)
    const spaceAbove = spot.top - GAP
    const place = steps[index]?.place
    let top
    if (place === 'above') {
      top = spaceAbove >= H ? spot.top - GAP - H : spot.top + spot.height + GAP
    } else {
      top = spaceBelow >= H ? spot.top + spot.height + GAP : spot.top - GAP - H
    }
    top = Math.max(8, Math.min(top, vh - H - 8))
    setTip({ top, left, width: W })
  }, [spot, centered, index, steps])

  if (!step) return null

  const buttonLabel = step.button ? t(step.button) : isLast ? t('obFinish') : t('next')

  return (
    <div
      className="fixed inset-0"
      style={{ zIndex: 9998, pointerEvents: 'none' }}
      role="dialog"
      aria-modal="true"
      aria-label={t(step.title)}
    >
      {centered ? (
        // Centered explainer — plain dark backdrop, no spotlight.
        <div
          aria-hidden
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', pointerEvents: 'auto', zIndex: 1 }}
        />
      ) : spot ? (
        <>
          {/* Visual only: dark wash + marigold ring + glow. */}
          <div
            aria-hidden
            style={{
              position: 'fixed',
              top: spot.top,
              left: spot.left,
              width: spot.width,
              height: spot.height,
              borderRadius: spot.radius,
              boxShadow:
                '0 0 0 3px #F4A300, 0 0 18px 5px rgba(244,163,0,0.45), 0 0 0 9999px rgba(0,0,0,0.75)',
              transition: 'all 0.3s ease',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
          {/* Full-screen shield blocks stray taps (guided tour drives navigation). */}
          <div aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'auto', zIndex: 2 }} />
        </>
      ) : (
        // Transitioning between screens — keep the screen dimmed, no flashing.
        <div aria-hidden style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', pointerEvents: 'auto', zIndex: 1 }} />
      )}

      {/* Tooltip — own layer above the shield, fully interactive. */}
      {tip && (spot || centered) ? (
        <div
          ref={tipRef}
          style={{
            position: 'fixed',
            top: tip.top,
            left: tip.left,
            width: tip.width,
            zIndex: 3,
            pointerEvents: 'auto',
            transition: 'top 0.3s ease, left 0.3s ease',
          }}
          className="rounded-2xl bg-white p-4 shadow-xl"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[13px] font-semibold text-ink/50">
              {t('obStepOf', { n: index + 1, total })}
            </span>
            <button
              type="button"
              onClick={finish}
              className="min-h-[44px] px-2 text-[14px] font-semibold text-indigo/70 underline underline-offset-2 active:opacity-70"
            >
              {t('obSkip')}
            </button>
          </div>

          <h3 className="font-display text-[19px] font-bold leading-snug text-indigo">{t(step.title)}</h3>
          <p className="mt-1.5 text-[16px] leading-snug text-ink/85">{t(step.body)}</p>

          <button
            type="button"
            onClick={() => (isLast ? finish() : setIndex((i) => i + 1))}
            className="mt-4 min-h-[48px] w-full rounded-2xl bg-marigold text-[17px] font-semibold text-ink shadow-sm active:brightness-95"
          >
            {buttonLabel}
          </button>
        </div>
      ) : null}
    </div>
  )
}
