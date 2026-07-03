#!/usr/bin/env node
/**
 * scripts/translate.js — one-off translation generator (build tool, NOT app code).
 *
 * Fills in the real translations for Saral's newer languages by calling the
 * Gemini API directly. Runs from your terminal (`npm run translate`), never in
 * the browser and never bundled into the app, so it can spend as many tokens as
 * it needs without touching the client or a chat context window.
 *
 * What it does:
 *   1. Reads the English source catalogs:
 *        - src/i18n/locales/en.json            (UI strings)
 *        - src/content/sikhao/locales/en.json  (Sikhao walkthrough strings)
 *   2. For each target language, asks Gemini to translate the *values* (keys stay
 *      identical), then writes src/<...>/locales/<code>.json, overwriting the
 *      English placeholder.
 *   3. Waits ~2s between calls to stay under rate limits, logs progress, and
 *      keeps going if one language fails — printing a success/failure summary
 *      at the end.
 *
 * Setup: put your key in a local .env at the repo root (already gitignored):
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
const DELAY_MS = 2000 // pause between API calls
const MAX_ATTEMPTS = 2 // one retry on transient error / bad JSON

// Target languages to (re)generate. English (en) and the original hi/mr/bn are
// left alone; Sanskrit (sa) already has real translations and isn't in scope.
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
// process.env value always wins, so `GEMINI_API_KEY=... npm run translate` works
// too. .env.local is loaded last so it can override .env.
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
function buildPrompt(languageName, englishJson) {
  return (
    `Translate this UI string JSON from English into ${languageName}. This is ` +
    `for an app helping elderly, low-literacy users in India understand bills ` +
    `and documents. Use simple, warm, natural ${languageName} — not literal ` +
    `word-for-word translation, and not overly formal or bureaucratic language.\n\n` +
    `Rules:\n` +
    `- Preserve the exact JSON structure and every key unchanged. Translate only the values.\n` +
    `- Keep placeholder tokens EXACTLY as they appear, untranslated: {n}, {total}, ` +
    `{type}, {title}, and any \${...}. They are filled in by code.\n` +
    `- Leave brand and technical terms as-is (do not translate or transliterate): ` +
    `Saral, Samjhao, Sikhao, PhonePe, Google Pay, Paytm, BHIM, Amazon Pay, UPI, ` +
    `PIN, OTP, SMS, Jio, Airtel, Vi, BSNL, Indane, HP, Bharat Gas, Listen, ₹, and .gov.in.\n` +
    `- Keep any leading emoji (⚠️, 🚨) at the start of the value.\n` +
    `- Return ONLY valid JSON, no markdown fences, no explanation.\n\n` +
    `Input: ${JSON.stringify(englishJson, null, 2)}`
  )
}

// ── Gemini call ───────────────────────────────────────────────────────────────
async function callGemini(apiKey, prompt) {
  const payload = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.3,
      maxOutputTokens: 16384,
    },
  }
  const res = await fetch(`${ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status}: ${detail.slice(0, 300)}`)
  }
  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('empty response from Gemini')
  return text
}

// Strip accidental ```json fences, then parse.
function parseJson(text) {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
  return JSON.parse(cleaned)
}

// A good result has every source key, no extras, and all-string values.
function validate(source, out) {
  const srcKeys = Object.keys(source)
  const outKeys = Object.keys(out)
  const missing = srcKeys.filter((k) => !(k in out))
  if (missing.length) throw new Error(`missing ${missing.length} key(s), e.g. "${missing[0]}"`)
  const extra = outKeys.filter((k) => !(k in source))
  if (extra.length) throw new Error(`unexpected ${extra.length} extra key(s), e.g. "${extra[0]}"`)
  const nonString = outKeys.find((k) => typeof out[k] !== 'string')
  if (nonString) throw new Error(`value for "${nonString}" is not a string`)
}

async function translateOne(apiKey, languageName, source) {
  let lastErr
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const text = await callGemini(apiKey, buildPrompt(languageName, source))
      const out = parseJson(text)
      validate(source, out)
      // Re-key in the source's order so files stay stable/diff-friendly.
      const ordered = {}
      for (const k of Object.keys(source)) ordered[k] = out[k]
      return ordered
    } catch (err) {
      lastErr = err
      if (attempt < MAX_ATTEMPTS) await sleep(DELAY_MS)
    }
  }
  throw lastErr
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  loadEnv()
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || apiKey === 'placeholder') {
    console.error(
      '\n✖ GEMINI_API_KEY is not set.\n' +
        '  Add it to a local .env at the repo root:  GEMINI_API_KEY=your_key_here\n',
    )
    process.exit(1)
  }

  const results = [] // { job, code, name, ok, error }

  for (const job of JOBS) {
    const srcPath = rel(`${job.dir}/en.json`)
    if (!existsSync(srcPath)) {
      console.error(`\n! Skipping "${job.label}" — no source file at ${job.dir}/en.json`)
      continue
    }
    const source = JSON.parse(readFileSync(srcPath, 'utf8'))
    const count = Object.keys(source).length
    console.log(`\n=== ${job.label} (${count} strings) → ${job.dir}/ ===`)

    for (const { code, name } of TARGETS) {
      process.stdout.write(`Translating to ${name} (${code})... `)
      try {
        const out = await translateOne(apiKey, name, source)
        writeFileSync(rel(`${job.dir}/${code}.json`), JSON.stringify(out, null, 2) + '\n', 'utf8')
        console.log('done.')
        results.push({ job: job.label, code, name, ok: true })
      } catch (err) {
        console.log(`FAILED — ${err.message}`)
        results.push({ job: job.label, code, name, ok: false, error: err.message })
      }
      await sleep(DELAY_MS) // stay under rate limits
    }
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  const ok = results.filter((r) => r.ok)
  const failed = results.filter((r) => !r.ok)
  console.log('\n──────────── Summary ────────────')
  console.log(`✔ Succeeded: ${ok.length}`)
  if (ok.length) console.log('   ' + ok.map((r) => `${r.code}/${r.job.split(' ')[0]}`).join(', '))
  console.log(`✖ Failed: ${failed.length}`)
  for (const r of failed) console.log(`   ${r.name} (${r.code}) — ${r.job}: ${r.error}`)
  console.log('─────────────────────────────────')
  if (failed.length) {
    console.log('Re-run `npm run translate` to retry the failed languages.')
    process.exitCode = 1
  }
}

main().catch((err) => {
  console.error('\nUnexpected error:', err)
  process.exit(1)
})
