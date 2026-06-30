import { useState } from 'react'
import { LanguageProvider } from './state/LanguageContext.jsx'
import LanguageSheet from './components/LanguageSheet.jsx'
import HomeScreen from './screens/HomeScreen.jsx'
import CaptureScreen from './screens/CaptureScreen.jsx'
import ResultScreen from './screens/ResultScreen.jsx'
import SikhaoListScreen from './screens/SikhaoListScreen.jsx'
import WalkthroughScreen from './screens/WalkthroughScreen.jsx'
import AskScreen from './screens/AskScreen.jsx'
import HistoryScreen from './screens/HistoryScreen.jsx'
import { saveToHistory } from './lib/history.js'

// Simple screen state machine — no router needed for this single-task PWA.
function Router() {
  const [screen, setScreen] = useState('home')
  const [result, setResult] = useState(null)
  const [resultImage, setResultImage] = useState(null) // { imageBase64, mimeType } for re-translation
  const [flow, setFlow] = useState(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [askSeed, setAskSeed] = useState(null) // a voice question to auto-ask
  const [askContext, setAskContext] = useState(null) // document context for follow-ups
  const [askReturn, setAskReturn] = useState('home') // where Ask's back goes

  const openLanguage = () => setSheetOpen(true)
  const go = (next) => setScreen(next)

  const openAsk = ({ seed = null, context = null, from = 'home' }) => {
    setAskSeed(seed)
    setAskContext(context)
    setAskReturn(from)
    go('ask')
  }

  let view
  switch (screen) {
    case 'capture':
      view = (
        <CaptureScreen
          onBack={() => go('home')}
          onLanguage={openLanguage}
          onResult={(data, image) => {
            setResult(data)
            setResultImage(image || null)
            // Auto-save to on-device history (thumbnail generated async; non-blocking).
            saveToHistory(data, image)
            go('result')
          }}
        />
      )
      break
    case 'result':
      view = (
        <ResultScreen
          result={result}
          imageBase64={resultImage?.imageBase64}
          mimeType={resultImage?.mimeType}
          onResultChange={setResult}
          onLanguage={openLanguage}
          onBack={() => go('home')}
          onScanAnother={() => go('capture')}
          onAskMore={() =>
            openAsk({
              context: [result?.title, result?.summary].filter(Boolean).join('. '),
              from: 'result',
            })
          }
        />
      )
      break
    case 'ask':
      view = (
        <AskScreen
          seedQuestion={askSeed}
          context={askContext}
          onLanguage={openLanguage}
          onBack={() => go(askReturn)}
        />
      )
      break
    case 'history':
      view = <HistoryScreen onBack={() => go('home')} onLanguage={openLanguage} />
      break
    case 'sikhao':
      view = (
        <SikhaoListScreen
          onBack={() => go('home')}
          onLanguage={openLanguage}
          onOpenFlow={(f) => {
            setFlow(f)
            go('walkthrough')
          }}
        />
      )
      break
    case 'walkthrough':
      view = (
        <WalkthroughScreen
          flow={flow}
          onLanguage={openLanguage}
          onBack={() => go('sikhao')}
        />
      )
      break
    case 'home':
    default:
      view = (
        <HomeScreen
          onSamjhao={() => go('capture')}
          onSikhao={() => go('sikhao')}
          onLanguage={openLanguage}
          onOpenFlow={(f) => {
            setFlow(f)
            go('walkthrough')
          }}
          onAsk={(q) => openAsk({ seed: q, from: 'home' })}
          onHistory={() => go('history')}
        />
      )
  }

  return (
    <>
      {view}
      <LanguageSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      {/* Mobile-first frame, centred on desktop. */}
      <div className="mx-auto min-h-screen w-full max-w-[412px] border-line bg-surface sm:border-x">
        <Router />
      </div>
    </LanguageProvider>
  )
}
