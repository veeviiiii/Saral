// Client for the Saral Q&A proxy (/api/ask). `language` is the full name (e.g. "Hindi").
export async function askSaral({ question, language, context }) {
  let res
  try {
    res = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, language, context }),
    })
  } catch {
    throw new Error('network')
  }

  let data = null
  try {
    data = await res.json()
  } catch {
    /* non-JSON */
  }

  if (!res.ok) throw new Error(data?.error || `request_failed_${res.status}`)
  return data?.answer || ''
}
