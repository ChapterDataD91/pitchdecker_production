'use client'

import { useRef, useState, type DragEvent } from 'react'
import { resizeImage } from '@/lib/image-resize'
import LoadingDots from './LoadingDots'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  deckId: string
  field: 'hero' | 'banner' | 'logo'
  label: string
  hint: string
  aspectRatio?: string
}

const ACCEPT = 'image/png,image/jpeg,image/webp'

export default function ImageUpload({
  value,
  onChange,
  deckId,
  field,
  label,
  hint,
  aspectRatio,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function upload(file: File) {
    setIsUploading(true)
    setError(null)
    try {
      const blob = await resizeImage(file)

      const ext = blob.type === 'image/png' ? '.png' : blob.type === 'image/webp' ? '.webp' : '.jpg'
      const fileName = `${field}${ext}`

      const formData = new FormData()
      formData.append('file', blob, fileName)
      formData.append('field', field)

      const res = await fetch(`/api/deck/${deckId}/image`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Upload failed (${res.status})`)
      }

      const { url } = (await res.json()) as { url: string }
      onChange(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  function handleFileChange(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    upload(file)
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer?.files?.[0]
    if (file?.type.startsWith('image/')) upload(file)
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault()
    setIsDragging(false)
  }

  function handleRemove() {
    onChange('')
    setError(null)
  }

  const hasImage = value.trim() !== ''

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-text">
        {label}
      </label>

      {hasImage ? (
        // --- Preview state ---
        <div
          className="group relative cursor-pointer overflow-hidden rounded-xl border border-border transition-colors hover:border-border-strong"
          style={aspectRatio ? { aspectRatio } : undefined}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
          }}
          aria-label={`Replace ${label.toLowerCase()}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt={label}
            className="h-full w-full object-cover"
          />

          {/* Hover overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
            <span className="text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
              Click to replace
            </span>
          </div>

          {/* Remove button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleRemove()
            }}
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-text-secondary shadow-sm opacity-0 transition-opacity hover:bg-white hover:text-error group-hover:opacity-100"
            aria-label={`Remove ${label.toLowerCase()}`}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        // --- Empty / uploading state ---
        <div
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
            isDragging
              ? 'border-accent bg-accent-light'
              : 'border-border-dashed hover:border-accent hover:bg-accent-light'
          } ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
          style={aspectRatio ? { aspectRatio } : undefined}
          onClick={() => !isUploading && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
          }}
          aria-label={`Upload ${label.toLowerCase()}`}
        >
          {isUploading ? (
            <>
              <LoadingDots className="mb-2" />
              <p className="text-sm font-medium text-text-secondary">
                Uploading...
              </p>
            </>
          ) : (
            <>
              <svg
                className="mb-2 h-8 w-8 text-text-tertiary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                />
              </svg>
              <p className="text-sm font-medium text-text">Upload {label.toLowerCase()}</p>
              <p className="mt-1 text-xs text-text-secondary">{hint}</p>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="mt-1.5 text-xs text-error">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          handleFileChange(e.target.files)
          e.target.value = ''
        }}
      />
    </div>
  )
}
