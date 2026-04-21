import { resizeImage } from '@/lib/image-resize'

// Photos render at 48–64px in the editor and the output template's candidate
// cards, so there's no benefit to storing large files. 512px is comfortable
// for retina.
const MAX_PHOTO_WIDTH = 512

export async function uploadCandidatePhoto(
  deckId: string,
  candidateId: string,
  file: File,
): Promise<string> {
  const blob = await resizeImage(file, { maxWidth: MAX_PHOTO_WIDTH })
  const ext =
    blob.type === 'image/png'
      ? '.png'
      : blob.type === 'image/webp'
        ? '.webp'
        : '.jpg'

  const formData = new FormData()
  formData.append('file', blob, `candidate-${candidateId}${ext}`)

  const res = await fetch(
    `/api/deck/${deckId}/candidate/${candidateId}/photo`,
    { method: 'POST', body: formData },
  )

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? `Upload failed (${res.status})`)
  }

  const { url } = (await res.json()) as { url: string }
  return url
}
