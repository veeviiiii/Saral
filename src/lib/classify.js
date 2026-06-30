// On-device document pre-classification with MobileNet (TensorFlow.js).
//
// Everything here is lazy: the heavy tfjs + mobilenet bundles are only pulled
// in via dynamic import() the first time we touch them (warm-up on the Capture
// screen, or the first photo). If anything fails — offline, WebGL missing,
// CDN blocked — we resolve to null and the caller silently skips the feature.
// This NEVER throws into the Gemini flow.

let modelPromise = null

async function getModel() {
  if (!modelPromise) {
    modelPromise = (async () => {
      const tf = await import('@tensorflow/tfjs')
      const mobilenet = await import('@tensorflow-models/mobilenet')
      // WebGL keeps inference on the GPU so it doesn't freeze the main thread.
      try {
        await tf.setBackend('webgl')
        await tf.ready()
      } catch {
        /* fall back to whatever backend tfjs picked (usually cpu) */
      }
      return mobilenet.load({ version: 2, alpha: 1.0 })
    })().catch((err) => {
      // Reset so a later attempt can retry, and bubble null up.
      modelPromise = null
      throw err
    })
  }
  return modelPromise
}

// Kick off the (slow) model download ahead of time, without blocking the UI.
export function warmUpClassifier() {
  getModel().catch(() => {
    /* ignore — feature just won't be available */
  })
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// Map MobileNet's ImageNet labels onto Saral's coarse doc categories.
// Order matters: a "notebook computer" is a laptop (screenshot), not paper.
function mapToCategory(predictions) {
  const text = predictions
    .map((p) => (p.className || '').toLowerCase())
    .join(' | ')

  if (
    /screen|monitor|television|laptop|desktop computer|web site|website|notebook computer|cellular|cell ?phone|ipod|hand-held|hand held|modem/.test(
      text,
    )
  ) {
    return 'screenshot'
  }
  if (/envelope|letter/.test(text)) {
    return 'letter'
  }
  if (
    /menu|book jacket|\bbook\b|binder|packet|carton|paper|folder|wrapper|comic|magazine|newspaper|diary|ring-binder|\bfile\b|crossword|scoreboard|web page/.test(
      text,
    )
  ) {
    return 'document'
  }
  return 'other'
}

// Returns one of: 'document' | 'letter' | 'screenshot' | 'other', or null on
// failure. `dataUrl` is a full data: URL (mime + base64).
export async function classifyImage(dataUrl) {
  try {
    const [model, img] = await Promise.all([getModel(), loadImage(dataUrl)])
    const predictions = await model.classify(img, 3)
    if (!predictions || !predictions.length) return 'other'
    return mapToCategory(predictions)
  } catch {
    return null
  }
}
