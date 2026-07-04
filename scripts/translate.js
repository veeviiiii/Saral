#!/usr/bin/env node
/**
 * scripts/translate.js — one-off translation generator (build tool, NOT app code).
 *
 * Fills in the real translations for Saral's newer languages by calling the
 * Gemini API directly. Runs from your terminal (`npm run translate`), never in
 * the browser and never bundled into the app.
 *
 * What it does:
 *   1. Reads the English source catalogs:
 *        - src/i18n/locales/en.json            (UI strings, keyed by string id)
 *        - src/content/sikhao/locales/en.json  (Sikhao strings, keyed by English)
 *   2. For each target language, asks Gemini to translate the values, then writes
 *      src/<...>/locales/<code>.json.
 *   3. Skips languages that are already fully translated (resume), waits between
 *      calls, backs off on rate limits, logs progress, and prints a summary.
 *
 * Robustness notes (learned the hard way):
 *   - Payloads are sent to Gemini re-keyed by a plain number ("0","1",...), never
 *     by the raw English string. Content keys contain double-quotes (e.g.
 *     'Tap "Recharge & Pay Bills".') which make Gemini emit invalid JSON. We map
 *     the numbered response back to the real keys before writing.
 *   - Thinking is disabled and the output-token cap is raised, so large content
 *     responses don't get truncated mid-JSON.
 *
 * Options:
 *   FORCE=1 npm run translate   # re-translate even languages already done
 *
 * Setup: put your key in a local .env / .env.local at the repo root (gitignored):
 *        GEMINI_API_KEY=your_key_here
 *
 * The runtime overlay (src/content/sikhao/applyTranslations.js) picks up the
 * generated content files automatically; the UI files are imported directly.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ROOT = new URL('../', import.meta.url) // repo root (scripts/ is one level down)
const rel = (p) => fileURLToPath(new URL(p, ROOT))

// ── Config ────────────────────────────────────────────────────────────────
const MODEL = 'gemini-2.5-flash' // matches api/gemini.js
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`
const DELAY_MS = 3000 // pause between successful calls (be gentle on the free tier)
const MAX_ATTEMPTS = 2 // attempts per language (1 retry)
const DEFAULT_BACKOFF_MS = 30000 // wait after a 429 when the API gives no retryDelay
const MAX_BACKOFF_MS = 60000
const FORCE = process.env.FORCE === '1' // re-translate even if an output file exists

// Target languages to generate. English + the original hi/mr/bn are left alone;
// Sanskrit (sa) already has real translations and isn't in scope.
const TARGETS = [
  { code: 'te', name: 'Telugu' },
  { code: 'ta', name: 'Tamil' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'kn', name: 'Kannada' },
  { code: 'or', name: 'Odia' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'ur', name: 'Urdu' },
  { code: 'as', name: 'Assamese' },
  { code: 'mai', name: 'Maithili' },
  { code: 'ne', name: 'Nepali' },
  { code: 'kok', name: 'Konkani' },
]

// Each job = one English catalog to translate into every target language.
const JOBS = [
  { label: 'UI strings', dir: 'src/i18n/locales' },
  { label: 'Sikhao content', dir: 'src/content/sikhao/locales' },
]

// ── Tiny .env loader (no dependency) ────────────────────────────────────────
// Reads .env and .env.local from the repo root (both gitignored). An existing
// process.env value always wins. .env.local is loaded last so it can override.
function loadEnv() {
  for (const file of ['.env', '.env.local']) {
    const path = rel(file)
    if (!existsSync(path)) continue
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      if (line.trim().startsWith('#')) continue
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
      if (!m) continue
      let val = m[2].trim()
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1)
      }
      if (!(m[1] in process.env)) process.env[m[1]] = val
    }
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ── Prompt ──────────────────────────────────────────────────────────────────
function buildPrompt(languageName, numberedObj) {
  return (
    `Translate the string values of this JSON object into ${languageName}. This ` +
    `is for an app helping elderly, low-literacy users in India understand bills ` +
    `and documents. Use simple, warm, natural ${languageName} — not literal ` +
    `word-for-word translation, and not overly formal or bureaucratic language.\n\n` +
    `Rules:\n` +
    `- The keys are plain numbers. Keep every key exactly as-is and return the ` +
    `same number of entries. Translate only the values.\n` +
    `- Keep placeholder tokens EXACTLY as they appear, untranslated: {n}, {total}, ` +
    `{type}, {title}, and any \${...}. They are filled in by code.\n` +
    `- Leave brand and technical terms as-is (do not translate or transliterate): ` +
    `Saral, Samjhao, Sikhao, PhonePe, Google Pay, Paytm, BHIM, Amazon Pay, UPI, ` +
    `PIN, OTP, SMS, Jio, Airtel, Vi, BSNL, Indane, HP, Bharat Gas, Listen, ₹, and .gov.in.\n` +
    `- Keep any leading emoji (⚠️, 🚨) at the start of the value.\n` +
    `- Return ONLY valid JSON, no markdown fences, no explanation.\n\n` +
    `Input: ${JSON.stringify(numberedObj, null, 2)}`
  )
}

// ── Gemini call ───────────────────────────────────────────────────────────────
async function callGemini(apiKey, prompt) {
  const payload = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.3,
      maxOutputTokens: 65536, // headroom so big content responses aren't truncated
      thinkingConfig: { thinkingBudget: 0 }, // translation needs no reasoning tokens
    },
  }
  const res = await fetch(`${ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const bodyText = await res.text().catch(() => '')
    const err = new Error(`HTTP ${res.status}: ${bodyText.slice(0, 140).replace(/\s+/g, ' ')}`)
    err.status = res.status
    if (res.status === 429) err.retryAfterMs = parseRetryDelay(bodyText) ?? DEFAULT_BACKOFF_MS
    throw err
  }
  const data = await res.json()
  const cand = data?.candidates?.[0]
  const text = cand?.content?.parts?.[0]?.text
  if (cand?.finishReason === 'MAX_TOKENS') throw new Error('response truncated (MAX_TOKENS)')
  if (!text) throw new Error(`empty response (finishReason: ${cand?.finishReason || 'unknown'})`)
  return text
}

// Pull "retryDelay":"34s" out of a 429 body, capped, so we wait about the right time.
function parseRetryDelay(bodyText) {
  const m = bodyText.match(/"retryDelay"\s*:\s*"(\d+)s"/)
  if (!m) return null
  return Math.min(Number(m[1]) * 1000 + 1000, MAX_BACKOFF_MS)
}

// Strip accidental ```json fences, then parse.
function parseJson(text) {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
  return JSON.parse(cleaned)
}

// The response must have every key we sent, all with string values.
function validate(sent, out) {
  const keys = Object.keys(sent)
  const missing = keys.filter((k) => !(k in out))
  if (missing.length) throw new Error(`missing ${missing.length}/${keys.length} entries`)
  const bad = keys.find((k) => typeof out[k] !== 'string')
  if (bad != null) throw new Error(`entry ${bad} is not a string`)
}

// Translate one catalog: re-key by number, call Gemini, map the response back to
// the original keys. Retries once (transient errors / bad JSON / truncation).
async function translateCatalog(apiKey, languageName, source) {
  const keys = Object.keys(source)
  const numbered = {}
  keys.forEach((k, i) => {
    numbered[String(i)] = source[k]
  })

  let lastErr
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const text = await callGemini(apiKey, buildPrompt(languageName, numbered))
      const out = parseJson(text)
      validate(numbered, out)
      const result = {}
      keys.forEach((k, i) => {
        result[k] = out[String(i)]
      })
      return result
    } catch (err) {
      lastErr = err
      if (attempt < MAX_ATTEMPTS) {
        const wait = err.retryAfterMs ?? DELAY_MS
        process.stdout.write(`(retry in ${Math.round(wait / 1000)}s) `)
        await sleep(wait)
      }
    }
  }
  throw lastErr
}

// A target is "done" if its file exists and already has every source key.
function isComplete(outPath, source) {
  if (!existsSync(outPath)) return false
  try {
    const existing = JSON.parse(readFileSync(outPath, 'utf8'))
    return Object.keys(source).every((k) => typeof existing[k] === 'string')
  } catch {
    return false
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  loadEnv()
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || apiKey === 'placeholder') {
    console.error(
      '\n✖ GEMINI_API_KEY is not set.\n' +
        '  Add it to a local .env / .env.local at the repo root:  GEMINI_API_KEY=your_key_here\n',
    )
    process.exit(1)
  }

  const results = [] // { job, code, name, ok, skipped?, error? }
  let quotaHit = false

  outer: for (const job of JOBS) {
    const srcPath = rel(`${job.dir}/en.json`)
    if (!existsSync(srcPath)) {
      console.error(`\n! Skipping "${job.label}" — no source file at ${job.dir}/en.json`)
      continue
    }
    const source = JSON.parse(readFileSync(srcPath, 'utf8'))
    console.log(`\n=== ${job.label} (${Object.keys(source).length} strings) → ${job.dir}/ ===`)

    for (const { code, name } of TARGETS) {
      const outPath = rel(`${job.dir}/${code}.json`)
      if (!FORCE && isComplete(outPath, source)) {
        console.log(`• ${name} (${code}) — already done, skipping.`)
        results.push({ job: job.label, code, name, ok: true, skipped: true })
        continue
      }

      process.stdout.write(`Translating to ${name} (${code})... `)
      try {
        const out = await translateCatalog(apiKey, name, source)
        writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n', 'utf8')
        console.log('done.')
        results.push({ job: job.label, code, name, ok: true })
        await sleep(DELAY_MS)
      } catch (err) {
        console.log(`FAILED — ${err.message}`)
        results.push({ job: job.label, code, name, ok: false, error: err.message })
        if (err.status === 429) {
          // Rate/quota limit survived the retry — almost certainly the free-tier
          // per-minute or daily cap. Stop now instead of spamming identical 429s;
          // a later re-run skips everything already done.
          quotaHit = true
          break outer
        }
        await sleep(DELAY_MS)
      }
    }
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  const done = results.filter((r) => r.ok && !r.skipped)
  const skipped = results.filter((r) => r.skipped)
  const failed = results.filter((r) => !r.ok)
  console.log('\n──────────── Summary ────────────')
  console.log(`✔ Translated this run: ${done.length}`)
  if (done.length) console.log('   ' + done.map((r) => `${r.code}/${r.job.split(' ')[0]}`).join(', '))
  if (skipped.length) console.log(`• Already done (skipped): ${skipped.length}`)
  console.log(`✖ Failed: ${failed.length}`)
  for (const r of failed) console.log(`   ${r.name} (${r.code}) — ${r.job}: ${r.error}`)
  console.log('─────────────────────────────────')

  if (quotaHit) {
    console.log(
      '\n⏳ Stopped early on a rate/quota limit (HTTP 429).\n' +
        '   The free Gemini tier has tight per-minute and per-day caps. Wait for the\n' +
        '   quota to reset (per-minute: ~1 min; per-day: resets ~midnight Pacific) or\n' +
        '   use a billing-enabled key, then just re-run `npm run translate` — finished\n' +
        '   languages are skipped automatically, so it only retries what is left.\n',
    )
    process.exitCode = 1
  } else if (failed.length) {
    console.log('Re-run `npm run translate` to retry the failed languages (done ones are skipped).')
    process.exitCode = 1
  }
}

main().catch((err) => {
  console.error('\nUnexpected error:', err)
  process.exit(1)
})
