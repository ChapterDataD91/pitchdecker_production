// ---------------------------------------------------------------------------
// Client-side image resize utility. Runs in the browser only.
// Scales images down to a maximum width and compresses as JPEG (or keeps
// PNG when preserveFormat is true, for logos with transparency).
// ---------------------------------------------------------------------------

export async function resizeImage(
  file: File,
  options?: { maxWidth?: number; quality?: number },
): Promise<Blob> {
  const maxWidth = options?.maxWidth ?? 1920
  const quality = options?.quality ?? 0.85

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable'))
        return
      }
      // Preserve the source format. PNGs keep transparency (critical for
      // hero collages that float on the page background). JPEGs stay JPEG.
      const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
      ctx.drawImage(img, 0, 0, width, height)
      const outputQuality = outputType === 'image/png' ? undefined : quality

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas toBlob returned null'))
            return
          }
          resolve(blob)
        },
        outputType,
        outputQuality,
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image for resizing'))
    }

    img.src = url
  })
}
