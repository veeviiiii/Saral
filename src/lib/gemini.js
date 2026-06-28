// Client for the Saral Gemini proxy (/api/gemini).
// `language` is the full language NAME (e.g. "Hindi") the proxy injects into
// the persona — see API_LANGUAGE_NAME in i18n/strings.js.

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
  return data
}
