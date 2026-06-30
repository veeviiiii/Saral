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
