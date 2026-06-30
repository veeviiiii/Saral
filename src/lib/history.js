// On-device document history (localStorage only — never sent anywhere).
// Stores a capped list of recent Samjhao results for the History screen.

import { dataUrlToThumbnail } from './image.js'

const KEY = 'saral.history'
const CAP = 20 // keep only the 20 most recent

function read() {
  try {
    const raw = localStorage.getItem(KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function write(arr) {
  try {
    localStorage.setItem(KEY, JSON.stringify(arr))
  } catch {
    /* quota / unavailable — history is best-effort */
  }
}

function uuid() {
  try {
    return crypto.randomUUID()
  } catch {
    return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
}

export function getHistory() {
  // Newest first (we always prepend).
  return read()
}

export function deleteHistoryItem(id) {
  const next = read().filter((x) => x.id !== id)
  write(next)
  return next
}

export function clearHistory() {
  write([])
  return []
}

// Save a result. `image` is { imageBase64, mimeType } or null (e.g. offline).
// Async only because the thumbnail is generated on a canvas; fire-and-forget.
export async function saveToHistory(result, image) {
  if (!result) return getHistory()

  let thumbnail = null
  if (image?.imageBase64) {
    const dataUrl = `data:${image.mimeType || 'image/jpeg'};base64,${image.imageBase64}`
    thumbnail = await dataUrlToThumbnail(dataUrl, 200)
  }

  const entry = {
    id: uuid(),
    timestamp: Date.now(),
    doc_type: result.doc_type || '',
    title: result.title || '',
    key_facts: Array.isArray(result.key_facts) ? result.key_facts : [],
    warnings: Array.isArray(result.warnings) ? result.warnings : [],
    is_possible_scam: result.is_possible_scam === true,
    thumbnail,
  }

  const next = [entry, ...read()].slice(0, CAP)
  write(next)
  return next
}
