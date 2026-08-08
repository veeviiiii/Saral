import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

// Register the service worker for PWA install + offline app shell.
// Degrade gracefully — never block the app if registration fails.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(async () => {
        // On the very first visit the page's hashed assets load BEFORE the
        // service worker takes control, so they'd be missing from the offline
        // cache until a second visit. Once the SW is active, re-request every
        // /assets/ file this page used — they come from the HTTP cache (free)
        // and get stored by the SW, so ONE online visit gives full offline.
        await navigator.serviceWorker.ready
        performance
          .getEntriesByType('resource')
          .map((e) => e.name)
          .filter((u) => u.includes('/assets/'))
          .forEach((u) => fetch(u).catch(() => {}))
        // Offline OCR needs the lazily-split tesseract.js chunk too — import it
        // once now (module load only, no worker spun up) so the SW caches it
        // even if the user never opens Capture while online.
        import('tesseract.js').catch(() => {})
      })
      .catch((err) => console.error('Service worker registration failed:', err))
  })
}
