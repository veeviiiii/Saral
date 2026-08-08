// Client for the Saral Gemini proxy (/api/gemini).
// `language` is the full language NAME (e.g. "Hindi") the proxy injects into
// the persona — see API_LANGUAGE_NAME in i18n/strings.js.

// Coerce whatever the proxy returns into the exact result shape the UI renders.
// The server enforces a responseSchema, but a manipulated document could still
// nudge Gemini's values — so we re-validate types client-side and drop anything
// unexpected. Everything renders as React text children (never raw HTML), so
// this is defence-in-depth, not the only guard.
function normalizeResult(data) {
  const d = data && typeof data === 'object' ? data : {}
  const str = (v) => (typeof v === 'string' ? v : '')
  const strList = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [])
  return {
    doc_type: str(d.doc_type),
    title: str(d.title),
    summary: str(d.summary),
    key_facts: Array.isArray(d.key_facts)
      ? d.key_facts
          .filter((f) => f && typeof f === 'object')
          .map((f) => ({ label: str(f.label), value: str(f.value) }))
      : [],
    what_to_do: strList(d.what_to_do),
    warnings: strList(d.warnings),
    is_possible_scam: d.is_possible_scam === true,
    confidence: ['high', 'medium', 'low'].includes(d.confidence) ? d.confidence : 'low',
    offline: d.offline === true,
  }
}

export async function explainDocument({ imageBase64, mimeType, language }) {
  let res
  try {
    res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, mimeType, language }),
    })
  } catch {
    throw new Error('network')
  }

  let data = null
  try {
    data = await res.json()
  } catch {
    /* non-JSON response */
  }

  if (!res.ok) {
    throw new Error(data?.error || `request_failed_${res.status}`)
  }
  return normalizeResult(data)
}
