// Saral — open-ended Q&A proxy. POST { question, language, context? } -> { answer }.
// Same persona + safety rules as the Samjhao proxy: text in, plain text out.
// Powers the result-screen "Ask more" (with document context) and voice "ask anything".

const MODEL = 'gemini-2.5-flash'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed. Use POST.' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || apiKey === 'placeholder') {
    return res.status(500).json({
      error: 'Server is not configured. Set GEMINI_API_KEY in the environment.',
    })
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body || {}
  const { question, language, context } = body
  if (!question || !String(question).trim()) {
    return res.status(400).json({ error: 'question is required.' })
  }

  const lang = (language && String(language).trim()) || 'English'

  const systemPrompt =
    `You are Saral, a calm friendly helper for someone with low digital literacy ` +
    `who may be elderly. Always reply in ${lang}. Use short simple sentences and ` +
    `plain everyday words. Answer only what is asked, in 2 to 4 short sentences. ` +
    `Never ask the user for a password, PIN, OTP or card number; if someone is asking ` +
    `them to share one, warn them clearly that it is likely a scam. If you are not ` +
    `sure, say so gently and suggest checking with someone they trust. Do not invent facts.`

  const parts = []
  if (context && String(context).trim()) {
    parts.push({
      text: `The user is asking about this document:\n${String(context).slice(0, 4000)}`,
    })
  }
  parts.push({ text: `Question: ${String(question).slice(0, 1000)}` })

  const payload = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts }],
    generationConfig: { temperature: 0.3 },
  }

  try {
    const upstream = await fetch(`${ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!upstream.ok) {
      const detail = await upstream.text()
      return res
        .status(502)
        .json({ error: 'Gemini request failed.', status: upstream.status, detail })
    }

    const data = await upstream.json()
    const answer = data?.candidates?.[0]?.content?.parts
      ?.map((p) => p.text)
      .filter(Boolean)
      .join(' ')
      .trim()

    if (!answer) {
      return res.status(502).json({ error: 'Empty response from Gemini.', raw: data })
    }

    return res.status(200).json({ answer })
  } catch (err) {
    return res
      .status(500)
      .json({ error: 'Unexpected error talking to Gemini.', detail: String(err) })
  }
}

function safeParse(str) {
  try {
    return JSON.parse(str)
  } catch {
    return null
  }
}
