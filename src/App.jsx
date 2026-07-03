import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom'
import { LanguageProvider, useLanguage } from './state/LanguageContext.jsx'
import LanguageSheet from './components/LanguageSheet.jsx'
import HomeScreen from './screens/HomeScreen.jsx'
import CaptureScreen from './screens/CaptureScreen.jsx'
import ResultScreen from './screens/ResultScreen.jsx'
import SikhaoListScreen from './screens/SikhaoListScreen.jsx'
import WalkthroughScreen from './screens/WalkthroughScreen.jsx'
import AskScreen from './screens/AskScreen.jsx'
import HistoryScreen from './screens/HistoryScreen.jsx'
import OnboardingLanguageScreen from './components/OnboardingLanguageScreen.jsx'
import OnboardingWalkthrough from './components/OnboardingWalkthrough.jsx'
import { getFlowById } from './content/sikhao/index.js'
import './content/sikhao/applyTranslations.js' // overlays generated Sikhao translations (no-op until scripts/translate.js runs)
import { saveToHistory } from './lib/history.js'

const ONBOARDING_KEY = 'saral_onboarding_seen'

// Resolve the flow from the URL and render its walkthrough.
function WalkthroughRoute({ onLanguage }) {
  const { flowId } = useParams()
  const navigate = useNavigate()
  const flow = getFlowById(flowId)
  if (!flow) return <Navigate to="/sikhao" replace />
  return <WalkthroughScreen flow={flow} onLanguage={onLanguage} onBack={() => navigate(-1)} />
}

function AppRoutes() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setLang } = useLanguage()

  // Transient cross-route data — kept in memory (lost on refresh by design).
  const [result, setResult] = useState(null)
  const [resultImage, setResultImage] = useState(null)
  const [askSeed, setAskSeed] = useState(null)
  const [askContext, setAskContext] = useState(null)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [obPhase, setObPhase] = useState(null) // 'language' | 'tour' | null

  const openLanguage = () => setSheetOpen(true)

  // Language sheet is an overlay, not a route: while it's open, push a throwaway
  // history entry so the back button just closes it (instead of navigating away).
  useEffect(() => {
    if (!sheetOpen) return
    window.history.pushState(window.history.state, '')
    const onPop = () => setSheetOpen(false)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [sheetOpen])
  const closeLanguage = () => window.history.back() // pops the throwaway entry → closes sheet

  // First-ever visit → onboarding language picker, then the guided tour.
  useEffect(() => {
    let seen = true
    try {
      seen = localStorage.getItem(ONBOARDING_KEY) === '1'
    } catch {
      /* localStorage unavailable — don't nag */
    }
    if (seen) return
    const id = setTimeout(() => setObPhase('language'), 300)
    return () => clearTimeout(id)
  }, [])

  const pickTourLanguage = (code) => {
    setLang(code)
    navigate('/')
    setObPhase('tour')
  }
  const finishTour = () => {
    try {
      localStorage.setItem(ONBOARDING_KEY, '1')
    } catch {
      /* ignore */
    }
    setObPhase(null)
    navigate('/')
  }
  const replayTour = () => {
    navigate('/')
    setObPhase('tour')
  }

  const goAsk = ({ seed = null, context = null }) => {
    setAskSeed(seed)
    setAskContext(context)
    navigate('/ask')
  }

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <HomeScreen
              onSamjhao={() => navigate('/capture')}
              onSikhao={() => navigate('/sikhao')}
              onLanguage={openLanguage}
              onOpenFlow={(f) => navigate(`/sikhao/${f.id}`)}
              onAsk={(q) => goAsk({ seed: q })}
              onHistory={() => navigate('/history')}
              onReplayTour={replayTour}
            />
          }
        />
        <Route
          path="/capture"
          element={
            <CaptureScreen
              onBack={() => navigate(-1)}
              onLanguage={openLanguage}
              onResult={(data, image) => {
                setResult(data)
                setResultImage(image || null)
                saveToHistory(data, image)
                navigate('/result')
              }}
            />
          }
        />
        <Route
          path="/result"
          element={
            result ? (
              <ResultScreen
                result={result}
                imageBase64={resultImage?.imageBase64}
                mimeType={resultImage?.mimeType}
                onResultChange={setResult}
                onLanguage={openLanguage}
                onBack={() => navigate(-1)}
                onScanAnother={() => navigate('/capture')}
                onAskMore={() =>
                  goAsk({ context: [result?.title, result?.summary].filter(Boolean).join('. ') })
                }
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/sikhao"
          element={
            <SikhaoListScreen
              onBack={() => navigate(-1)}
              onLanguage={openLanguage}
              onOpenFlow={(f) => navigate(`/sikhao/${f.id}`)}
            />
          }
        />
        <Route path="/sikhao/:flowId" element={<WalkthroughRoute onLanguage={openLanguage} />} />
        <Route path="/history" element={<HistoryScreen onBack={() => navigate(-1)} onLanguage={openLanguage} />} />
        <Route
          path="/ask"
          element={
            <AskScreen seedQuestion={askSeed} context={askContext} onLanguage={openLanguage} onBack={() => navigate(-1)} />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <LanguageSheet open={sheetOpen} onClose={closeLanguage} />
      {obPhase === 'language' ? <OnboardingLanguageScreen onSelect={pickTourLanguage} /> : null}
      {obPhase === 'tour' ? (
        <OnboardingWalkthrough screen={location.pathname} onNavigate={navigate} onClose={finishTour} />
      ) : null}
    </>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      {/* Mobile-first frame, centred on desktop. */}
      <div className="mx-auto min-h-screen w-full max-w-[412px] border-line bg-surface sm:border-x">
        <AppRoutes />
      </div>
    </LanguageProvider>
  )
}
