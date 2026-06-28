// Saral — Gemini proxy (the ONLY place the API key lives).
// POST { imageBase64, mimeType, language } -> structured JSON explanation.
//
// The frontend never sees GEMINI_API_KEY. This function injects the Saral
// persona, enforces the response schema, and returns parsed JSON to the client.

// Flash tier per SKILL.md. gemini-1.5-flash is retired; this is the current
// stable Flash. Swap to 'gemini-flash-latest' (always-current) or a newer
// pin like 'gemini-3.5-flash' if you want — it's the only line to change.
const MODEL = 'gemini-2.5-flash'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

// Structured-output schema. Mirrors the Samjhao card the UI renders.
const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    doc_type: { type: 'string' },
    title: { type: 'string' },
    summary: { type: 'string' },
    key_facts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          value: { type: 'string' },
        },
        required: ['label', 'value'],
      },
    },
    what_to_do: { type: 'array', items: { type: 'string' } },
    warnings: { type: 'array', items: { type: 'string' } },
    is_possible_scam: { type: 'boolean' },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
  },
  required: [
    'doc_type',
    'title',
    'summary',
    'key_facts',
    'what_to_do',
    'warnings',
    'is_possible_scam',
    'confidence',
  ],
  propertyOrdering: [
    'doc_type',
    'title',
    'summary',
    'key_facts',
    'what_to_do',
    'warnings',
    'is_possible_scam',
    'confidence',
  ],
}

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

  // Vercel parses JSON bodies automatically; guard anyway.
  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body || {}
  const { imageBase64, mimeType, language } = body

  if (!imageBase64 || !mimeType) {
    return res
      .status(400)
      .json({ error: 'imageBase64 and mimeType are required.' })
  }

  const lang = (language && String(language).trim()) || 'English'

  const systemPrompt =
    `You are Saral, a calm friendly helper for someone with low digital literacy ` +
    `who may be elderly. Always reply in ${lang}. Use short simple sentences and ` +
    `plain everyday words. Never ask the user for a password, PIN, OTP or card ` +
    `number. If a document looks like a scam say so clearly.`

  const payload = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [
      {
        role: 'user',
        parts: [
          {
            text:
              'Look at this document and explain it for the user. ' +
              'Return only the structured JSON described by the schema.',
          },
          { inlineData: { mimeType, data: imageBase64 } },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.2,
    },
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
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      return res
        .status(502)
        .json({ error: 'Empty response from Gemini.', raw: data })
    }

    const parsed = safeParse(text)
    if (!parsed) {
      return res
        .status(502)
        .json({ error: 'Could not parse Gemini response as JSON.', raw: text })
    }

    return res.status(200).json(parsed)
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
