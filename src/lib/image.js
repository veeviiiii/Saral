// Two different consumers want two different images from the same photo:
//
//   fileToCompressedBase64 — small JPEG for Gemini (bandwidth + token cost).
//   fileToOcrImage         — large, cleaned-up PNG for Tesseract.
//
// They must stay separate. Feeding Tesseract the Gemini-sized image drops a
// photographed A4 page to roughly 87 DPI, where 10pt body text renders ~10px
// tall against the ~20-30px the LSTM engine needs — measured on the dev bench,
// that costs about 40 points of OCR confidence and destroys dates and account
// numbers while headings still read fine.

// Compress a picked/captured image to ~1024px longest edge before upload,
// to save bandwidth + Gemini cost (SKILL.md). Returns base64 (no data: prefix).

export async function fileToCompressedBase64(file, maxEdge = 1024, quality = 0.82) {
  const bitmap = await createImageBitmap(file)
  const longest = Math.max(bitmap.width, bitmap.height)
  const scale = longest > maxEdge ? maxEdge / longest : 1
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, 0, 0, w, h)
  if (typeof bitmap.close === 'function') bitmap.close()

  const dataUrl = canvas.toDataURL('image/jpeg', quality)
  return { base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' }
}

// ── OCR image pipeline ─────────────────────────────────────────────────────

// Target ~3000px on the long edge (≈250-300 DPI for a photographed A4 page),
// with a pixel ceiling so we stay well inside mobile canvas limits and don't
// balloon memory on a mid-range phone.
const OCR_MAX_EDGE = 3000
const OCR_MAX_PIXELS = 12e6

// Skew search: ±4° in 0.5° steps covers normal hand-held tilt. Below ~0.4° the
// rotation costs more in resampling blur than it recovers.
const SKEW_RANGE_DEG = 4
const SKEW_STEP_DEG = 0.5
const SKEW_MIN_DEG = 0.4

// Luminance, then flatten uneven lighting. A phone photo of a bill almost
// always has a brightness gradient (a hand or head shadowing one corner), which
// defeats Tesseract's single global threshold — the page looks white at one end
// and mid-grey at the other, so one end binarises to solid black. We estimate
// that gradient by heavily downsampling, then divide it out, which leaves the
// ink intact while normalising the paper to a uniform white.
function toCorrectedGray(data, w, h) {
  const gray = new Uint8ClampedArray(w * h)
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    gray[p] = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) | 0
  }

  // Coarse background map: block maxima approximate the paper (ink is darker).
  const bw = 24
  const bh = 24
  const bg = new Float32Array(bw * bh)
  for (let by = 0; by < bh; by++) {
    for (let bx = 0; bx < bw; bx++) {
      const x0 = Math.floor((bx * w) / bw)
      const x1 = Math.max(x0 + 1, Math.floor(((bx + 1) * w) / bw))
      const y0 = Math.floor((by * h) / bh)
      const y1 = Math.max(y0 + 1, Math.floor(((by + 1) * h) / bh))
      // 90th-percentile-ish via max of row samples keeps text out of the estimate.
      let m = 0
      for (let y = y0; y < y1; y += 2) {
        const row = y * w
        for (let x = x0; x < x1; x += 2) {
          const v = gray[row + x]
          if (v > m) m = v
        }
      }
      bg[by * bw + bx] = m || 255
    }
  }

  // Bilinear sample of the background map, divide it out, then stretch.
  // The horizontal interpolation terms depend only on x, so they're computed
  // once into lookup tables rather than per pixel — this loop runs over every
  // pixel of a ~6 megapixel image, and hoisting the floor/clamp arithmetic out
  // of it is the difference between roughly two seconds and a few hundred
  // milliseconds on a phone.
  const xIdx0 = new Int32Array(w)
  const xIdx1 = new Int32Array(w)
  const xFrac = new Float32Array(w)
  for (let x = 0; x < w; x++) {
    const fx = (x / w) * bw - 0.5
    const x0 = Math.max(0, Math.min(bw - 1, Math.floor(fx)))
    xIdx0[x] = x0
    xIdx1[x] = Math.min(bw - 1, x0 + 1)
    xFrac[x] = fx - x0
  }

  let lo = 255
  let hi = 0
  const out = new Uint8ClampedArray(w * h)
  for (let y = 0; y < h; y++) {
    const fy = (y / h) * bh - 0.5
    const y0 = Math.max(0, Math.min(bh - 1, Math.floor(fy)))
    const y1 = Math.min(bh - 1, y0 + 1)
    const wy = fy - y0
    const row0 = y0 * bw
    const row1 = y1 * bw
    const rowOut = y * w
    for (let x = 0; x < w; x++) {
      const i0 = xIdx0[x]
      const i1 = xIdx1[x]
      const wx = xFrac[x]
      // Interpolate along x on each row, then blend the two rows.
      const top = bg[row0 + i0] + (bg[row0 + i1] - bg[row0 + i0]) * wx
      const bot = bg[row1 + i0] + (bg[row1 + i1] - bg[row1 + i0]) * wx
      const b = top + (bot - top) * wy
      const v = b > 0 ? Math.min(255, (gray[rowOut + x] / b) * 255) : 255
      out[rowOut + x] = v
      if (v < lo) lo = v
      if (v > hi) hi = v
    }
  }

  // Contrast stretch so ink reaches true black and paper true white.
  const span = Math.max(1, hi - lo)
  for (let i = 0; i < out.length; i++) {
    out[i] = ((out[i] - lo) / span) * 255
  }
  return out
}

// Estimate page skew by projection profile: rotate the (downsampled) ink map
// through candidate angles and keep the one whose horizontal projection has the
// highest variance — text lines stack into sharp peaks only when level.
function estimateSkew(gray, w, h) {
  // Work small; skew is a global property and this keeps the sweep cheap.
  const sw = Math.min(w, 800)
  const sh = Math.max(1, Math.round((h * sw) / w))
  const ink = new Uint8Array(sw * sh)
  for (let y = 0; y < sh; y++) {
    const sy = Math.floor((y * h) / sh) * w
    for (let x = 0; x < sw; x++) {
      // Ink = clearly darker than paper after correction.
      ink[y * sw + x] = gray[sy + Math.floor((x * w) / sw)] < 160 ? 1 : 0
    }
  }

  // Collect ink coordinates once. The sweep below then walks this short list
  // per angle instead of rescanning every pixel of the map — on a typical page
  // only a few percent of pixels are ink, so this is an order of magnitude less
  // work across the seventeen candidate angles.
  const xs = []
  const ys = []
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      if (ink[y * sw + x]) {
        xs.push(x - sw / 2)
        ys.push(y - sh / 2)
      }
    }
  }

  let best = 0
  let bestScore = -1
  const rows = new Float64Array(sh * 2)
  for (let deg = -SKEW_RANGE_DEG; deg <= SKEW_RANGE_DEG; deg += SKEW_STEP_DEG) {
    const rad = (deg * Math.PI) / 180
    const sin = Math.sin(rad)
    const cos = Math.cos(rad)
    rows.fill(0)
    for (let i = 0; i < xs.length; i++) {
      const r = (ys[i] * cos - xs[i] * sin + sh) | 0
      if (r >= 0 && r < rows.length) rows[r]++
    }
    // Variance of the profile — peaky (aligned) beats flat (skewed).
    let mean = 0
    for (let i = 0; i < rows.length; i++) mean += rows[i]
    mean /= rows.length
    let varsum = 0
    for (let i = 0; i < rows.length; i++) {
      const d = rows[i] - mean
      varsum += d * d
    }
    if (varsum > bestScore) {
      bestScore = varsum
      best = deg
    }
  }
  return Math.abs(best) >= SKEW_MIN_DEG ? best : 0
}

// Build the image Tesseract should actually see: high resolution, evenly lit,
// contrast-stretched, deskewed, and PNG-encoded so no JPEG ringing is
// re-introduced around the glyph edges. Returns a data: URL.
//
// Falls back to a plain high-res render if anything here throws — OCR with an
// unprocessed large image still beats the 1024px JPEG.
export async function fileToOcrImage(file) {
  const bitmap = await createImageBitmap(file)
  const longest = Math.max(bitmap.width, bitmap.height)

  // Never upscale: inventing pixels adds no detail for the recogniser.
  let scale = Math.min(1, OCR_MAX_EDGE / longest)
  const pixels = bitmap.width * bitmap.height * scale * scale
  if (pixels > OCR_MAX_PIXELS) scale *= Math.sqrt(OCR_MAX_PIXELS / pixels)

  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(bitmap, 0, 0, w, h)
  if (typeof bitmap.close === 'function') bitmap.close()

  try {
    const img = ctx.getImageData(0, 0, w, h)
    const gray = toCorrectedGray(img.data, w, h)

    // Write the cleaned luminance back as RGB.
    for (let p = 0, i = 0; p < gray.length; p++, i += 4) {
      img.data[i] = img.data[i + 1] = img.data[i + 2] = gray[p]
      img.data[i + 3] = 255
    }
    ctx.putImageData(img, 0, 0)

    const skew = estimateSkew(gray, w, h)
    if (skew !== 0) {
      // Rotate on a white ground so the exposed corners don't read as ink.
      const rot = document.createElement('canvas')
      rot.width = w
      rot.height = h
      const rctx = rot.getContext('2d')
      rctx.fillStyle = '#fff'
      rctx.fillRect(0, 0, w, h)
      rctx.translate(w / 2, h / 2)
      rctx.rotate((-skew * Math.PI) / 180)
      rctx.translate(-w / 2, -h / 2)
      rctx.drawImage(canvas, 0, 0)
      return rot.toDataURL('image/png')
    }
  } catch {
    /* fall through — the un-processed high-res render is still a big win */
  }

  return canvas.toDataURL('image/png')
}

// Small thumbnail (~200px wide) for the history list. Returns a full data: URL,
// or null on failure — display-only, never blocks anything.
export async function dataUrlToThumbnail(dataUrl, maxWidth = 200, quality = 0.7) {
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = reject
      i.src = dataUrl
    })
    const scale = img.width > maxWidth ? maxWidth / img.width : 1
    const w = Math.max(1, Math.round(img.width * scale))
    const h = Math.max(1, Math.round(img.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    canvas.getContext('2d').drawImage(img, 0, 0, w, h)
    return canvas.toDataURL('image/jpeg', quality)
  } catch {
    return null
  }
}
