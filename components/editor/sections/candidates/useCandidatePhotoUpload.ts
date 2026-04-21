'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { uploadCandidatePhoto } from '@/lib/upload/candidate-photo'

const MAX_FILE_SIZE = 5 * 1024 * 1024

interface Options {
  deckId: string
  candidateId: string
  onUploaded: (photoUrl: string) => void
}

export function useCandidatePhotoUpload({
  deckId,
  candidateId,
  onUploaded,
}: Options) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Revoke any object URL we created once it's no longer rendered.
  useEffect(() => {
    if (!previewUrl) return
    return () => URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  // Keep the onUploaded callback fresh without destabilising `upload` — paste
  // listeners and drop handlers capture `upload` in their own effects.
  const onUploadedRef = useRef(onUploaded)
  useEffect(() => {
    onUploadedRef.current = onUploaded
  }, [onUploaded])

  const upload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        setError('Please select a JPEG, PNG, or WebP image.')
        return
      }
      if (file.size > MAX_FILE_SIZE) {
        setError('Image is larger than 5MB.')
        return
      }
      setError(null)
      const local = URL.createObjectURL(file)
      setPreviewUrl(local)
      setUploading(true)
      try {
        const url = await uploadCandidatePhoto(deckId, candidateId, file)
        onUploadedRef.current(url)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed')
      } finally {
        setUploading(false)
        // Clear the local preview; the effect above revokes its object URL.
        setPreviewUrl(null)
      }
    },
    [deckId, candidateId],
  )

  const openPicker = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const dismissError = useCallback(() => setError(null), [])

  return {
    inputRef,
    uploading,
    previewUrl,
    error,
    upload,
    openPicker,
    dismissError,
  }
}
