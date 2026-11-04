// OCR accuracy benchmark — DEV ONLY, never bundled into the app.
//
// Vite only treats index.html as a build entry, so nothing under dev/ ships to
// production. Open it with the dev server running:
//     http://localhost:5173/dev/ocr-bench.html
//
// What it measures: the *product* metric, not character error rate. For each
// synthetic document it runs the real pipeline (image.js -> ocr.js ->
// offlineExplain.js) and asks "did we get the doc type, amount, date and
// consumer number right?" — the things the offline card actually shows. It also
// records Tesseract's confidence and wall-clock time, because on this project
// speed is as much a constraint as accuracy.
//
// Pipeline variants are pluggable: "current" is the shipping path, and the
// improved path appears automatically once image.js exports fileToOcrImage.

import * as imageLib from '/src/lib/image.js'
import { getOcrText } from '/src/lib/ocr.js'
import { buildOfflineResult } from '/src/lib/offlineExplain.js'

// Benchmarks must never be cut short by the production timeout — we want the
// true duration, even when it is slow.
const NO_TIMEOUT = 120_000

// ── Test corpus ────────────────────────────────────────────────────────────
// Rendered at A4 300dpi so the source resembles what a phone camera actually
// captures; the pipeline under test does its own downscaling from here.
const PAGE_W = 2480
const PAGE_H = 3508

// Typography must match real documents or the benchmark flatters OCR. At 300dpi
// one point is 300/72 px, so real bill body copy (10pt) is ~42px — NOT the 64px+
// a naive synthetic test reaches for. The fine print carrying consumer numbers
// and account IDs is smaller still, and it is the first thing to fall apart when
// the image is downscaled.
const PT = 300 / 72
const FONT = {
  heading: `bold ${Math.round(18 * PT)}px Arial`, // 18pt — company name
  subhead: `${Math.round(12 * PT)}px Arial`, //      12pt — section titles
  body: `${Math.round(10 * PT)}px Arial`, //         10pt — standard body copy
  bodyBold: `bold ${Math.round(11 * PT)}px Arial`, //11pt — the amount due
  fine: `${Math.round(8 * PT)}px Arial`, //           8pt — fine print / IDs
}

// Phone screenshots are a different beast: captured at screen resolution, where
// text is large relative to the frame. A 1080x2400 screenshot still gets
// downscaled by the pipeline, so they are not automatically safe.
const SHOT_W = 1080
const SHOT_H = 2400
const SHOT_FONT = { sender: 'bold 44px Arial', body: '40px Arial' }

// Each doc: how to draw it, and what a correct reading looks like.
const DOCS = [
  {
    id: 'electricity',
    expect: {
      category: 'electricity',
      amount: '1250',
      date: '15/07/2026',
      consumerNo: '170012345678',
    },
    draw(c) {
      c.font = FONT.heading
      c.fillText('MAHAVITARAN  MSEDCL', 200, 260)
      c.font = FONT.subhead
      c.fillText('Maharashtra State Electricity Distribution Co. Ltd.', 200, 330)
      c.fillText('Electricity Bill — July 2026', 200, 420)
      c.font = FONT.fine
      c.fillText('Consumer No: 170012345678', 200, 560)
      c.fillText('Billing Unit: 4521 / Cycle 07', 200, 615)
      c.fillText('Meter No: MSE-88213-A   Reading: 45210', 200, 670)
      c.fillText('Sanctioned Load: 1.5 kW   Connection: Domestic', 200, 725)
      c.font = FONT.body
      c.fillText('Units consumed: 320 kWh', 200, 850)
      c.fillText('Energy Charges           Rs 980.00', 200, 915)
      c.fillText('Fixed Charges            Rs 130.00', 200, 975)
      c.fillText('Electricity Duty         Rs 140.00', 200, 1035)
      c.font = FONT.bodyBold
      c.fillText('Total Due: Rs 1,250.00', 200, 1140)
      c.font = FONT.body
      c.fillText('Due Date: 15/07/2026', 200, 1215)
      c.font = FONT.fine
      c.fillText('Pay before the due date to avoid disconnection of supply.', 200, 1330)
      c.fillText('For complaints call 1912. Visit www.mahadiscom.in', 200, 1385)
    },
  },
  {
    id: 'gas',
    expect: { category: 'gas', amount: '903', date: '10/07/2026', consumerNo: null },
    draw(c) {
      c.font = FONT.heading
      c.fillText('BHARAT GAS', 200, 260)
      c.font = FONT.subhead
      c.fillText('LPG Cylinder Refill Booking', 200, 340)
      c.font = FONT.fine
      c.fillText('Booking Ref: BG7781234', 200, 470)
      c.fillText('Distributor: Shree Enterprises, Pune', 200, 525)
      c.fillText('Cylinder: 14.2 kg Domestic', 200, 580)
      c.font = FONT.body
      c.fillText('Refill charges          Rs 903.00', 200, 700)
      c.font = FONT.bodyBold
      c.fillText('Amount: Rs 903.00', 200, 800)
      c.font = FONT.body
      c.fillText('Delivery by 10/07/2026', 200, 875)
      c.font = FONT.fine
      c.fillText('Subsidy of Rs 40.00 credited to your bank account.', 200, 980)
      c.fillText('Missed call booking: 7718012345', 200, 1035)
    },
  },
  {
    id: 'water',
    expect: { category: 'water', amount: '380', date: '20/07/2026', consumerNo: null },
    draw(c) {
      c.font = FONT.heading
      c.fillText('MUNICIPAL CORPORATION', 200, 260)
      c.font = FONT.subhead
      c.fillText('Water Supply Department — Bill', 200, 340)
      c.font = FONT.fine
      c.fillText('Property No: PMC/44/1123', 200, 470)
      c.fillText('Billing period: Apr 2026 to Jun 2026', 200, 525)
      c.font = FONT.body
      c.fillText('Water charges for 14 KL', 200, 640)
      c.fillText('Sewerage charges        Rs 80.00', 200, 700)
      c.font = FONT.bodyBold
      c.fillText('Amount payable: Rs 380', 200, 800)
      c.font = FONT.body
      c.fillText('Due date 20/07/2026', 200, 875)
      c.font = FONT.fine
      c.fillText('A late fee of 2% per month applies after the due date.', 200, 980)
    },
  },
  {
    // Calibration case: genuinely too blurry to read. This one SHOULD be
    // rejected by the retake gate, so its confidence sets the floor that
    // separates "warn the user" from "this is fine".
    id: 'blurry-reject',
    blur: 7,
    shadow: 0.45,
    expect: { category: 'electricity', amount: null, date: null, consumerNo: null },
    draw(c) {
      c.font = FONT.heading
      c.fillText('MAHAVITARAN  MSEDCL', 200, 260)
      c.font = FONT.body
      c.fillText('Electricity Bill — July 2026', 200, 400)
      c.fillText('Units consumed: 320 kWh', 200, 520)
      c.font = FONT.bodyBold
      c.fillText('Total Due: Rs 1,250.00', 200, 640)
      c.font = FONT.body
      c.fillText('Due Date: 15/07/2026', 200, 740)
    },
  },
  {
    // Phone screenshots are captured digitally at screen resolution — no skew,
    // shadow or focus loss. They still get downscaled by the pipeline though,
    // and they guard against preprocessing making already-crisp input worse.
    id: 'bank-sms',
    kind: 'screenshot',
    w: SHOT_W,
    h: SHOT_H,
    expect: { category: 'bank', amount: '500', date: '01/07/2026', consumerNo: null },
    draw(c) {
      c.fillStyle = '#e9e9eb'
      c.fillRect(48, 300, SHOT_W - 96, 700)
      c.fillStyle = '#111'
      c.font = SHOT_FONT.sender
      c.fillText('HDFC Bank', 90, 390)
      c.font = SHOT_FONT.body
      c.fillText('A/c XX4321 debited by Rs 500', 90, 480)
      c.fillText('on 01/07/2026. Available', 90, 545)
      c.fillText('balance Rs 12,340.', 90, 610)
      c.fillText('Never share your OTP with', 90, 720)
      c.fillText('anyone. Helpline 18002586161', 90, 785)
    },
  },
  {
    id: 'recharge',
    kind: 'screenshot',
    w: SHOT_W,
    h: SHOT_H,
    expect: { category: 'mobile_recharge', amount: '239', date: null, consumerNo: null },
    draw(c) {
      c.fillStyle = '#e9e9eb'
      c.fillRect(48, 300, SHOT_W - 96, 560)
      c.fillStyle = '#111'
      c.font = SHOT_FONT.sender
      c.fillText('Jio Recharge Successful', 90, 390)
      c.font = SHOT_FONT.body
      c.fillText('Plan Rs 239, validity 28 days', 90, 480)
      c.fillText('1.5GB data per day', 90, 545)
      c.fillText('Unlimited calls included', 90, 610)
    },
  },
  {
    id: 'scam',
    kind: 'screenshot',
    w: SHOT_W,
    h: SHOT_H,
    expect: { category: 'sms_scam', scam: true, amount: null, date: null, consumerNo: null },
    draw(c) {
      c.fillStyle = '#e9e9eb'
      c.fillRect(48, 300, SHOT_W - 96, 820)
      c.fillStyle = '#111'
      c.font = SHOT_FONT.sender
      c.fillText('CONGRATULATIONS!', 90, 390)
      c.font = SHOT_FONT.body
      c.fillText('You WON Rs 25 Lakh in KBC', 90, 480)
      c.fillText('Lucky Draw lottery. To claim', 90, 545)
      c.fillText('prize pay processing fee', 90, 610)
      c.fillText('Rs 5,000 immediately.', 90, 675)
      c.fillText('Call 9876543210 now or', 90, 785)
      c.fillText('prize expires in 24 hours.', 90, 850)
    },
  },
]

// ── Rendering + realistic camera degradation ───────────────────────────────

function renderClean(doc) {
  const cv = document.createElement('canvas')
  cv.width = doc.w ?? PAGE_W
  cv.height = doc.h ?? PAGE_H
  const c = cv.getContext('2d')
  c.fillStyle = '#fff'
  c.fillRect(0, 0, cv.width, cv.height)
  c.fillStyle = '#111'
  c.textBaseline = 'alphabetic'
  doc.draw(c)
  return cv
}

// Approximate what a hand-held phone photo does to a flat page: a few degrees
// of skew, uneven lighting, and slight focus softness. Screenshots skip most of
// this — they are captured digitally, not photographed.
function degrade(src, doc) {
  // Screenshots are pixel-perfect captures — return them untouched.
  if (doc.kind === 'screenshot') return src

  const angle = (Math.random() * 4 - 2) * (Math.PI / 180) // ±2° hand tilt
  const blurPx = doc.blur ?? 1.6
  const shadow = doc.shadow ?? 0.28

  const cv = document.createElement('canvas')
  cv.width = src.width
  cv.height = src.height
  const c = cv.getContext('2d')

  // A photographed page never fills the frame — there is always desk visible
  // around it. That margin costs real resolution: the page ends up spanning
  // only ~78% of the captured pixels, on top of our own downscale later.
  const fill = 0.78
  const dw = src.width * fill
  const dh = src.height * fill
  const dx = (cv.width - dw) / 2
  const dy = (cv.height - dh) / 2

  c.fillStyle = '#c8c6c0' // desk / surface behind the page
  c.fillRect(0, 0, cv.width, cv.height)

  c.save()
  c.translate(cv.width / 2, cv.height / 2)
  c.rotate(angle)
  c.translate(-cv.width / 2, -cv.height / 2)
  c.filter = `blur(${blurPx}px)`
  c.drawImage(src, dx, dy, dw, dh)
  c.restore()

  // Diagonal shadow — the classic "my hand blocked the light" gradient that
  // breaks a single global threshold.
  const g = c.createLinearGradient(0, 0, cv.width, cv.height)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, `rgba(0,0,0,${shadow})`)
  c.fillStyle = g
  c.fillRect(0, 0, cv.width, cv.height)
  return cv
}

function canvasToFile(cv, name) {
  return new Promise((resolve) => {
    // Camera-quality JPEG: this is the *source photo*, not our compression step.
    cv.toBlob((b) => resolve(new File([b], name, { type: 'image/jpeg' })), 'image/jpeg', 0.92)
  })
}

// ── Pipeline variants ──────────────────────────────────────────────────────
// Each returns a value getOcrText accepts (data URL or canvas).

const VARIANTS = [
  {
    id: 'current',
    label: 'Current — 1024px JPEG q0.82 (shared with Gemini)',
    async prepare(file) {
      const img = await imageLib.fileToCompressedBase64(file)
      return `data:${img.mimeType};base64,${img.base64}`
    },
  },
]

// Appears automatically once Phase 2 lands.
if (typeof imageLib.fileToOcrImage === 'function') {
  VARIANTS.push({
    id: 'ocr-tuned',
    label: 'Tuned — high-res grayscale + binarised + deskewed PNG',
    async prepare(file) {
      return imageLib.fileToOcrImage(file)
    },
  })
}

// ── Scoring ────────────────────────────────────────────────────────────────

const digits = (s) => String(s ?? '').replace(/[^\d]/g, '')

// A field counts as correct when the expected value is present in what we
// extracted (or when nothing was expected and nothing was invented).
function scoreField(expected, actual) {
  if (expected == null) return actual == null || actual === '' ? 'n/a' : 'n/a'
  if (!actual) return false
  return digits(actual).includes(digits(expected))
}

function factValue(result, labelStartsWith) {
  const f = (result.key_facts || []).find((x) =>
    String(x.label || '').toLowerCase().startsWith(labelStartsWith),
  )
  return f?.value ?? null
}

async function runOne(variant, doc) {
  const clean = renderClean(doc)
  const photo = degrade(clean, doc)
  const file = await canvasToFile(photo, `${doc.id}.jpg`)

  const t0 = performance.now()
  const prepared = await variant.prepare(file)
  const tPrep = performance.now() - t0

  const t1 = performance.now()
  const ocr = await getOcrText(prepared, NO_TIMEOUT, 'en')
  const tOcr = performance.now() - t1

  const text = ocr?.text || ''
  const result = buildOfflineResult(text, 'en')

  // doc_type is a localized label now, so match on the English label text.
  const typeLabel = String(result.doc_type || '').toLowerCase()
  const typeOk =
    doc.expect.category === 'sms_scam'
      ? result.is_possible_scam === true
      : typeLabel.includes(doc.expect.category.split('_')[0])

  return {
    doc: doc.id,
    typeOk,
    amount: scoreField(doc.expect.amount, factValue(result, 'amount')),
    date: scoreField(doc.expect.date, factValue(result, 'date')),
    consumer: scoreField(doc.expect.consumerNo, factValue(result, 'consumer')),
    confidence: ocr?.confidence ?? null,
    msPrep: Math.round(tPrep),
    msOcr: Math.round(tOcr),
    chars: text.length,
    text,
  }
}

// ── Reporting ──────────────────────────────────────────────────────────────

const el = (id) => document.getElementById(id)
const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0)
const mark = (v) => (v === 'n/a' ? '–' : v ? '✅' : '❌')

function renderTable(variant, rows) {
  const scored = ['typeOk', 'amount', 'date', 'consumer']
  const hits = {}
  const totals = {}
  for (const k of scored) {
    hits[k] = rows.filter((r) => r[k] === true).length
    totals[k] = rows.filter((r) => r[k] !== 'n/a').length
  }
  const confs = rows.map((r) => r.confidence).filter((c) => typeof c === 'number')
  const meanConf = confs.length ? Math.round(confs.reduce((a, b) => a + b, 0) / confs.length) : 0
  const meanMs = Math.round(rows.reduce((a, r) => a + r.msPrep + r.msOcr, 0) / rows.length)
  const maxMs = Math.max(...rows.map((r) => r.msPrep + r.msOcr))

  const body = rows
    .map(
      (r) => `<tr>
        <td>${r.doc}</td>
        <td class="c">${mark(r.typeOk)}</td>
        <td class="c">${mark(r.amount)}</td>
        <td class="c">${mark(r.date)}</td>
        <td class="c">${mark(r.consumer)}</td>
        <td class="n">${r.confidence ?? '–'}</td>
        <td class="n">${r.msPrep}</td>
        <td class="n">${r.msOcr}</td>
        <td class="n">${r.chars}</td>
      </tr>`,
    )
    .join('')

  return `
    <section>
      <h2>${variant.label}</h2>
      <table>
        <thead><tr>
          <th>document</th><th>type</th><th>amount</th><th>date</th><th>consumer</th>
          <th>conf</th><th>prep ms</th><th>ocr ms</th><th>chars</th>
        </tr></thead>
        <tbody>${body}</tbody>
        <tfoot><tr>
          <td><b>accuracy</b></td>
          ${scored
            .map((k) => `<td class="c"><b>${pct(hits[k], totals[k])}%</b><br><span class="s">${hits[k]}/${totals[k]}</span></td>`)
            .join('')}
          <td class="n"><b>${meanConf}</b></td>
          <td class="n" colspan="2"><b>${meanMs}ms</b> avg<br><span class="s">${maxMs}ms max</span></td>
          <td></td>
        </tr></tfoot>
      </table>
    </section>`
}

async function run() {
  const btn = el('run')
  btn.disabled = true
  el('out').innerHTML = ''
  const store = {}

  for (const variant of VARIANTS) {
    el('status').textContent = `Running "${variant.id}" …`
    const rows = []
    for (const doc of DOCS) {
      el('status').textContent = `Running "${variant.id}" — ${doc.id} …`
      try {
        rows.push(await runOne(variant, doc))
      } catch (err) {
        rows.push({
          doc: doc.id, typeOk: false, amount: false, date: false, consumer: false,
          confidence: null, msPrep: 0, msOcr: 0, chars: 0, text: `ERROR: ${err.message}`,
        })
      }
    }
    store[variant.id] = rows
    el('out').insertAdjacentHTML('beforeend', renderTable(variant, rows))
    console.log(`[bench] ${variant.id}`, rows)
  }

  window.__benchResults = store // inspectable from the console / automation
  el('status').textContent = `Done — ${VARIANTS.length} variant(s), ${DOCS.length} documents. Full rows in window.__benchResults`
  btn.disabled = false
}

el('run').addEventListener('click', run)
el('status').textContent = `Ready — ${VARIANTS.length} variant(s), ${DOCS.length} documents.`
