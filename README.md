# Saral

**A calm, friendly mobile-first PWA that explains bills and notices in plain language — and teaches everyday digital tasks step by step.**

Saral is built for people with low digital literacy (first-time smartphone users, elderly relatives, anyone who finds bills, government notices, and banking apps intimidating). It does two things, in the user's own language:

- **समझाओ · Samjhao ("explain")** — photograph or upload a bill, government notice, bank SMS, or form, and Saral reads it and returns a calm, plain-language explanation: what it is, the key facts (amount, due date), what to do, and a clear warning if it looks like a scam.
- **सिखाओ · Sikhao ("show me how")** — short, illustrated, step-by-step walkthroughs for everyday tasks: UPI payments, mobile recharge, gas-cylinder booking, and filling online forms.

**Languages:** Hindi (hi), English (en), Marathi (mr), Bengali (bn).
**Platform:** mobile-first single-column PWA (~390px), installable on Android.

Every screen carries the trust line: *"Saral will never ask for your PIN or OTP."*

---

## Highlights

- **Plain-language bill explanations** via Google Gemini (multimodal), returned as a structured, friendly result card with read-aloud (text-to-speech).
- **Scam detection** — suspicious documents get a prominent caution flag.
- **Live language switching** — change language on the result card and the explanation re-translates in place, not just the UI labels.
- **16 curated Sikhao walkthroughs** across UPI, recharge, gas, and forms, each step paired with a generic schematic illustration (no real app branding).
- **On-device ML** (all client-side, no extra servers):
  - **Instant document pre-classification** — MobileNet (TensorFlow.js) shows a "Looks like: a document / letter / screenshot" pill within ~1s, before Gemini responds.
  - **Blur / legibility check** — Tesseract.js OCR scores the photo; a soft warning or a retake prompt appears if it's too blurry.
  - **Voice language auto-detection** — speak a question and Saral detects your language from the transcript and switches automatically.
  - **Offline fallback** — with no internet, Saral OCRs the image and uses rule-based logic (amount, date, doc-type, scam keywords) to show a basic summary instead of an error.
  - **Smart document history** — recently scanned docs are saved on-device, with rule-based insights (due-soon dates, spending totals, scam alerts, most-common type). Nothing leaves the device.

---

## Tech stack

- **React 18** + **Vite 5** + **Tailwind CSS 4**
- **Google Gemini** (`gemini-2.5-flash`) via a thin serverless proxy — the API key never touches client code
- **TensorFlow.js** + **MobileNet**, **Tesseract.js** (lazy-loaded, on-device)
- **Web Speech API** (voice input + read-aloud), **PWA** (service worker + manifest)
- Deployed on **Vercel** (static frontend + serverless functions in `api/`)

---

## Architecture

```
React + Vite + Tailwind  →  serverless proxy (api/)  →  Google Gemini (multimodal)
        │
        ├── on-device ML: TensorFlow.js (MobileNet), Tesseract.js
        ├── localStorage: language preference, document history
        └── PWA: service worker (offline app shell)
```

The Gemini API key lives only in the serverless environment. The browser calls `/api/gemini` and `/api/ask`; those handlers add the key and forward to Gemini. In local dev, a small Vite plugin runs the same `api/` handlers so `npm run dev` serves the frontend **and** the API together — no Vercel CLI needed.

---

## Project structure

```
saral/
├── api/                       # Vercel serverless functions (Gemini proxy)
│   ├── gemini.js              # Samjhao: multimodal bill/notice explanation
│   └── ask.js                 # "Ask Saral": plain-language follow-up Q&A
├── public/
│   ├── walkthrough/*.svg      # Schematic step illustrations for Sikhao
│   ├── manifest.webmanifest   # PWA manifest
│   └── sw.js                  # Service worker (offline app shell)
├── src/
│   ├── App.jsx                # Screen state machine (no router needed)
│   ├── components/            # Header, Button, Icon, ListenButton, ...
│   ├── content/sikhao/        # Curated walkthroughs: upi, recharge, gas, forms
│   ├── i18n/strings.js        # All UI strings in 4 languages
│   ├── lib/
│   │   ├── gemini.js          # Client for the /api/gemini proxy
│   │   ├── image.js           # Image compression + history thumbnails
│   │   ├── classify.js        # MobileNet pre-classification (TensorFlow.js)
│   │   ├── ocr.js             # Tesseract.js OCR (confidence + text)
│   │   ├── detectLang.js      # Spoken-language detection from transcript
│   │   ├── offlineExplain.js  # Rule-based offline result builder
│   │   ├── history.js         # On-device document history (localStorage)
│   │   ├── insights.js        # Rule-based history insights
│   │   ├── useSpeech.js       # Voice input + read-aloud hooks
│   │   └── useOnline.js       # Online/offline detection
│   ├── screens/               # Home, Capture, Result, SikhaoList, Walkthrough, Ask, History
│   └── state/LanguageContext.jsx
├── index.html
├── vite.config.js             # Dev plugin runs api/ handlers locally
└── vercel.json
```

---

## Getting started

### Prerequisites
- Node.js 18+ and npm
- A Google Gemini API key — get one free from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Add your Gemini key
cp .env.example .env.local
# then edit .env.local and set GEMINI_API_KEY=your_real_key

# 3. Run the dev server (frontend + API together)
npm run dev
```

Open the printed local URL (default http://localhost:5173). The dev server runs the `api/` handlers in-process, so the Samjhao bill-explanation flow works end to end locally.

> The API key lives **only** in `.env.local` (gitignored) and in the serverless environment — never in client code.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start Vite dev server + local API |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |

---

## On-device ML — how it behaves

All of the following run entirely in the browser. The heavy libraries (TensorFlow.js, Tesseract.js) are **lazy-loaded** only when the capture screen is opened, so the home screen stays light. If any model fails to load (offline, blocked CDN, unsupported device), that feature **silently skips** — it never breaks the core Gemini flow.

- **Pre-classification pill** — MobileNet classifies the photo and maps it to a coarse category (document / letter / screenshot / other), shown as an instant pill before Gemini answers.
- **OCR blur gate** — Tesseract scores legibility (0–100): ≥70 proceeds silently, 40–69 shows a soft "may be less accurate" note, <40 prompts a retake (with a "Try anyway" option).
- **Voice language auto-detection** — the spoken transcript's script (Devanagari / Bengali, plus Marathi marker words) selects the app language, then the request proceeds normally.
- **Offline mode** — when offline, OCR + regex/keyword rules build a low-confidence summary card; reconnecting prompts a full re-scan.
- **History insights** — rule-based patterns over saved results (due-soon dates, total amounts, scam alerts, most-common type).

---

## Privacy & safety

- **Your documents and history stay on your device.** Document history lives in `localStorage` only and is never uploaded.
- **Photos are sent to Google Gemini** (via the serverless proxy) only to generate the explanation; the API key is server-side.
- **Saral never asks for a PIN or OTP**, and flags documents that try to.

---

## Deployment

Saral deploys to **Vercel** (static frontend + serverless functions). Set the `GEMINI_API_KEY` environment variable in your Vercel project settings, then:

```bash
vercel --prod
```

`vercel.json` configures the Vite build and rewrites all non-`/api` routes to `index.html` (SPA).

---

## License

This is a personal/educational project. No license is currently specified — please ask the author before reuse.
