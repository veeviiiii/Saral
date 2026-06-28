---
name: saral
description: Use this skill whenever you are building, editing, or extending the Saral app — a mobile-first PWA that explains bills/notices in plain local-language text (Samjhao feature) and walks users through everyday digital tasks step by step (Sikhao feature). Trigger on any mention of Saral, either feature name, the Gemini proxy, the bill-explanation card, the walkthrough flow, or any of the four supported languages (Hindi/Marathi/Bengali/English) in the context of this project. This skill defines the design system, Gemini prompt schema, curated content structure, safety rules, and architecture decisions — always read it before writing any code for this project.
---

# Saral — build skill

Saral is a mobile-web PWA for people with low digital literacy. It does two things:

1. **Samjhao** ("explain") — photograph or upload a bill, government notice, bank SMS, or form → Gemini reads it multimodally and returns a calm, plain-language explanation in the user's chosen language.
2. **Sikhao** ("show me how") — step-by-step guided walkthroughs for everyday tasks: UPI payment, gas cylinder booking, mobile recharge, filling an online form.

Languages: **Hindi (hi), English (en), Marathi (mr), Bengali (bn).**
Platform: mobile-first single-column PWA (~390px), installable on Android.

---

## Design system — apply this to every screen, every component

### Colours (6 named tokens — use no others)
| Token | Hex | Use |
|---|---|---|
| `indigo` | `#1E2A78` | Header background, headings, primary trust colour |
| `indigo-tint` | `#EAECF7` | Secondary card backgrounds, icon backgrounds |
| `marigold` | `#F4A300` | **The one accent** — every primary action button, active states, numbered step markers |
| `marigold-soft` | `#FFF4DC` | Samjhao card fill, highlighted rows |
| `ink` | `#1A1A1A` | All body text |
| `surface` | `#F5F6FA` | Page background |
| `success` | `#1B7F5C` | Confirmations |
| `caution` | `#C2410C` | Warnings, scam flag |
| `caution-soft` | `#FBEAE2` | Warning row background |
| `line` | `#E4E7F0` | Borders, dividers |

Marigold is the **only** accent. Never use a second colour for actions or highlights.

### Typography
- **Body / UI:** `Noto Sans` → covers Latin, Devanagari (Hindi + Marathi), Bengali. Import all four subsets.
- **Display / headings:** `Baloo 2` — warm, rounded, friendly. Use at large sizes only (h1/h2). Don't overuse.
- **Numbers in chips:** `font-variant-numeric: tabular-nums` so amounts/dates align.
- Minimum body size: **16px**. Card titles: **20–22px**. Hero headline: **26–28px**.

### Layout rules
- Single column, mobile-first, max content width ~390px centred on desktop.
- Minimum tap target: **44×44px** — non-negotiable for the elderly/low-vision user.
- Primary action always bottom-anchored within thumb reach.
- One task, one primary action per screen.
- Generous vertical spacing (20–24px between sections).

### Tone and copy
- Plain active verbs. Sentence case. No jargon (say "amount to pay", not "outstanding dues").
- Buttons say exactly what happens: **Listen**, **Next**, **Explain**, not "Submit" or "Proceed".
- Errors say what to do, never blame the user.
- Every screen carries the trust line: *"Saral will never ask for your PIN or OTP."*

---

## Architecture

```
React + Vite + Tailwind  →  1 serverless function (Gemini proxy)  →  Gemini multimodal
      PWA / installable         (API key never in client)               Flash tier default
```

- **Frontend:** React + Vite + Tailwind. Fonts via Google Fonts (Noto Sans + Baloo 2).
- **Backend:** one serverless function on Vercel/Netlify — the only place the Gemini key lives.
- **AI:** Gemini via Google AI Studio. Flash tier for demo speed; Pro if Flash struggles on messy bills.
- **Voice:** Web Speech API — `SpeechSynthesis` for read-aloud (core feature); `SpeechRecognition` for input (optional, degrade gracefully — Indic recognition is patchy in browsers).
- **Image handling:** compress client-side to ~1024px longest edge before upload (bandwidth + cost).
- **Content:** static JSON for curated Sikhao flows + UI strings. `localStorage` for optional recent-history (on-device only, never sent anywhere).
- **Deploy:** Vercel or Netlify free tier — produces a shareable URL for the demo.

### Language state
Pass the selected language code (`hi | en | mr | bn`) in every API call. Keep prompts in English; all human-readable values returned in the target language. Test each language on real sample documents — translation quality varies.

---

## Gemini integration

### System persona (inject on every call)
```
You are Saral, a calm and friendly helper for someone with low digital literacy
who may be elderly. Always reply in {language}. Use short, simple sentences and
plain everyday words — no technical, banking, or legal jargon. Be reassuring
and concrete. Never ask the user for a password, PIN, OTP, card number, or any
secret information. If a document looks like a scam or phishing attempt, say so
clearly and gently.
```

### Samjhao — structured JSON output schema
Ask Gemini to return **only** this JSON, no prose wrapper:

```json
{
  "doc_type": "electricity_bill | water_bill | gas_bill | bank_sms | govt_notice | exam_form | other",
  "title": "plain short name of the document in the user's language",
  "summary": "1–2 sentence plain explanation in the user's language",
  "key_facts": [
    { "label": "Amount due", "value": "₹1,240" },
    { "label": "Pay by", "value": "15 July" }
  ],
  "what_to_do": [
    "step 1 in plain language",
    "step 2"
  ],
  "warnings": ["e.g. pay before the due date to avoid a penalty"],
  "is_possible_scam": false,
  "confidence": "high | medium | low"
}
```

**Why structured output matters:** the UI renders each field into a labeled section (chips, numbered list, caution row). A plain prose response cannot be rendered cleanly — always enforce the schema.

**`confidence` handling:** when `low`, show a gentle nudge: *"Please double-check this with someone you trust."* Keep a human in the loop; never claim the model is infallible.

**`is_possible_scam`:** when `true`, render a prominent caution card and remind the user Saral will never ask for their OTP.

### Sikhao — generated path schema
For the "Something else" path, ask Gemini to return:

```json
{
  "task_title": "plain name of the task in user's language",
  "steps": [
    { "text": "step instruction in user's language" }
  ]
}
```

Validate the response has a `steps` array before rendering. Always render one step per screen.

---

## Screen inventory and component patterns

### 7 screens
1. **Home** — wordmark + language pill, "How can I help?" headline, Samjhao card (marigold), Sikhao card (indigo-tint), Speak button (marigold outlined), trust footer.
2. **Language picker** — bottom sheet, 4 rows, each language in its own script (हिंदी / English / मराठी / বাংলা), selected row: marigold outline + marigold-soft fill + checkmark.
3. **Capture** — camera viewfinder large, marigold shutter button, "Upload from gallery" secondary link, plain hint text above.
4. **Samjhao result** — eyebrow + doc title + summary + key-fact chips + numbered what-to-do + caution row + Listen / Ask more buttons. This is the signature screen — give it the most polish.
5. **Sikhao task list** — vertical rows (icon + label + chevron): UPI, gas cylinder, mobile recharge, fill a form. "Something else" row visually distinct (dashed outline).
6. **Walkthrough step** — progress dots (marigold active), illustration placeholder, step counter label, one large instruction, Listen (ghost) + Next (marigold) buttons.
7. **Follow-up** *(optional)* — one suggested question chip + simple input + send.

### Key component: Samjhao result card
This is what judges will remember. Build it first, polish it most.
- `doc_type` eyebrow (small caps, camera icon)
- `title` in Baloo 2 at ~25px, indigo
- `summary` in Noto Sans at ~18px, ink, generous line-height (1.5)
- `key_facts` as side-by-side chips: label (12px muted), value (18px bold tabular)
- `what_to_do` as numbered list, marigold circle numbers
- `warnings` as caution row (caution-soft background, caution text, warning icon)
- `is_possible_scam: true` → prominent scam-flag card above everything else
- Bottom bar: **Listen** (marigold, speaker icon) + **Ask more** (ghost)

### Voice (read-aloud)
Read-aloud is a core feature, not optional. On every result screen and walkthrough step, a prominent **Listen / सुनो / ऐका / শোনো** button triggers `SpeechSynthesis`:

```js
const u = new SpeechSynthesisUtterance(text);
u.lang = { hi: 'hi-IN', en: 'en-IN', mr: 'mr-IN', bn: 'bn-IN' }[lang];
u.rate = 0.95;
speechSynthesis.speak(u);
```

Always cancel any in-progress utterance before starting a new one. Show a visual "speaking" state on the button. Degrade gracefully if the API is unavailable — never throw.

---

## Curated Sikhao flows (static JSON)

Ship these 4 flows fully authored and verified — these are demo-safe:

```json
[
  {
    "id": "upi_payment",
    "title": { "hi": "UPI से पैसे भेजें", "en": "Send money with UPI", "mr": "UPI ने पैसे पाठवा", "bn": "UPI দিয়ে টাকা পাঠান" },
    "steps": [
      { "hi": "PhonePe, Google Pay या Paytm खोलें।", "en": "Open PhonePe, Google Pay, or Paytm.", "mr": "PhonePe, Google Pay किंवा Paytm उघडा.", "bn": "PhonePe, Google Pay বা Paytm খুলুন।" },
      { "hi": "Pay दबाएँ और QR स्कैन करें या नंबर डालें।", "en": "Tap Pay and scan the QR or enter the number.", "mr": "Pay दाबा आणि QR स्कॅन करा.", "bn": "Pay চাপুন এবং QR স্ক্যান করুন।" },
      { "hi": "रकम लिखें, नाम जाँचें, Pay करें।", "en": "Enter the amount, check the name, and pay.", "mr": "रक्कम लिहा, नाव तपासा, Pay करा.", "bn": "টাকার পরিমাণ লিখুন, নাম দেখুন, Pay করুন।" }
    ]
  },
  {
    "id": "gas_cylinder",
    "title": { "hi": "गैस सिलेंडर बुक करें", "en": "Book a gas cylinder", "mr": "गॅस सिलिंडर बुक करा", "bn": "গ্যাস সিলিন্ডার বুক করুন" },
    "steps": [
      { "hi": "अपनी गैस कंपनी का ऐप खोलें (Indane, HP, Bharat)।", "en": "Open your gas company app (Indane, HP, or Bharat Gas).", "mr": "तुमच्या गॅस कंपनीचे ॲप उघडा.", "bn": "আপনার গ্যাস কোম্পানির অ্যাপ খুলুন।" },
      { "hi": "Book Cylinder पर टैप करें।", "en": "Tap 'Book Cylinder'.", "mr": "Book Cylinder दाबा.", "bn": "'Book Cylinder' চাপুন।" },
      { "hi": "अपना पता जाँचें और बुकिंग की पुष्टि करें।", "en": "Check your address and confirm the booking.", "mr": "पत्ता तपासा आणि बुकिंग पुष्टी करा.", "bn": "ঠিকানা দেখুন এবং বুকিং নিশ্চিত করুন।" }
    ]
  },
  {
    "id": "mobile_recharge",
    "title": { "hi": "मोबाइल रिचार्ज करें", "en": "Recharge your mobile", "mr": "मोबाइल रिचार्ज करा", "bn": "মোবাইল রিচার্জ করুন" },
    "steps": [
      { "hi": "PhonePe या Google Pay खोलें, Mobile Recharge चुनें।", "en": "Open PhonePe or Google Pay and choose Mobile Recharge.", "mr": "PhonePe उघडा, Mobile Recharge निवडा.", "bn": "PhonePe খুলুন, Mobile Recharge বেছে নিন।" },
      { "hi": "अपना नंबर डालें और प्लान चुनें।", "en": "Enter your number and choose a plan.", "mr": "तुमचा नंबर टाका आणि plan निवडा.", "bn": "আপনার নম্বর দিন এবং প্ল্যান বেছে নিন।" },
      { "hi": "भुगतान करें।", "en": "Pay.", "mr": "पैसे द्या.", "bn": "টাকা দিন।" }
    ]
  },
  {
    "id": "online_form",
    "title": { "hi": "ऑनलाइन फॉर्म भरें", "en": "Fill an online form", "mr": "ऑनलाइन फॉर्म भरा", "bn": "অনলাইন ফর্ম পূরণ করুন" },
    "steps": [
      { "hi": "फॉर्म में अपना नाम, जन्म तारीख और पता भरें।", "en": "Fill in your name, date of birth, and address.", "mr": "नाव, जन्मतारीख आणि पत्ता भरा.", "bn": "নাম, জন্মতারিখ এবং ঠিকানা লিখুন।" },
      { "hi": "जरूरी कागजों की फोटो अपलोड करें।", "en": "Upload photos of required documents.", "mr": "आवश्यक कागदपत्रे अपलोड करा.", "bn": "প্রয়োজনীয় কাগজপত্রের ছবি আপলোড করুন।" },
      { "hi": "Submit से पहले सब जाँच लें।", "en": "Check everything before tapping Submit.", "mr": "Submit आधी सर्व तपासा.", "bn": "Submit করার আগে সব দেখে নিন।" }
    ]
  }
]
```

---

## Safety rules — always enforce these

1. **The API key lives only in the serverless function.** Never in the React client, never in a `.env` file committed to the repo.
2. **No transactions.** Saral guides the user; it never logs in to a bank, executes a UPI payment, or submits a form on their behalf.
3. **No user accounts.** Everything works anonymously. History stays in `localStorage` only.
4. **The trust line is always visible** on the home screen footer and on any Samjhao result.
5. **Scam flag** (`is_possible_scam: true`) gets a prominent caution card, not a quiet footnote.
6. **Low-confidence results** get a gentle "please verify with someone you trust" nudge — never suppress uncertainty.
7. **Voice never required.** If `SpeechSynthesis` is unavailable, the app works perfectly without it — no crashes, no dead ends.

---

## What's out of scope — don't build these

- Real-time live data (transport schedules, stock prices, live government databases)
- Any actual payment execution or UPI transaction
- User login / accounts / server-side database
- Native mobile app (PWA is the target; Capacitor wrap comes later)
- More than 4 languages for the hackathon
- More than 4–5 Sikhao task flows

If someone asks for these during the build, decline and refer to this list.

---

## Demo flow (60 seconds)

1. Open app — already in Hindi. (Signals: for someone who doesn't read English.)
2. Tap Samjhao → photograph a real electricity bill → calm card appears in Hindi → tap Listen → it reads aloud.
3. Tap Sikhao → UPI payment → 3 large steps, each read aloud.
4. Photograph a fake "your account is blocked, share OTP" SMS → scam flag appears → trust line reinforced.

**Always have a fallback.** Pre-load a sample image. Cache a known-good Gemini response. Record a 60-second screen capture as the ultimate backup. Test on the actual phone and network you'll demo on.
