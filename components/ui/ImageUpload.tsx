'use client'

import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { resizeImage } from '@/lib/image-resize'
import LoadingDots from './LoadingDots'

export interface FocalPoint {
  x: number
  y: number
}

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  deckId: string
  field: 'hero' | 'banner' | 'logo'
  label: string
  hint: string
  aspectRatio?: string
  /**
   * When both `focalPoint` and `onFocalPointChange` are provided, the preview
   * (after an image is uploaded) becomes a draggable focal-point picker that
   * matches the output shape. Drag the image inside the frame to choose which
   * part stays visible after the slant crop.
   */
  focalPoint?: FocalPoint
  onFocalPointChange?: (point: FocalPoint) => void
  /** Clip-path applied to the focal-point preview (matches the output slant). */
  previewClipPath?: string
  /** Aspect ratio of the focal-point preview (may differ from the drop-zone). */
  previewAspectRatio?: string
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
  focalPoint,
  onFocalPointChange,
  previewClipPath,
  previewAspectRatio,
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
  const focalMode = hasImage && focalPoint !== undefined && onFocalPointChange !== undefined

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-text">
        {label}
      </label>

      {focalMode ? (
        <FocalPointPreview
          src={value}
          focalPoint={focalPoint}
          onFocalPointChange={onFocalPointChange}
          aspectRatio={previewAspectRatio ?? aspectRatio ?? '2.4 / 1'}
          clipPath={previewClipPath}
          onReplace={() => inputRef.current?.click()}
          onRemove={handleRemove}
        />
      ) : hasImage ? (
        // --- Static preview (hero, logo) ---
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

// ---------------------------------------------------------------------------
// FocalPointPreview — draggable image inside a slanted frame that mirrors the
// output banner. Dragging updates `object-position` live; the new focal point
// is committed (onChange) only on pointer-up so autosave isn't spammed.
// ---------------------------------------------------------------------------

interface FocalPointPreviewProps {
  src: string
  focalPoint: FocalPoint
  onFocalPointChange: (point: FocalPoint) => void
  aspectRatio: string
  clipPath?: string
  onReplace: () => void
  onRemove: () => void
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

function FocalPointPreview({
  src,
  focalPoint,
  onFocalPointChange,
  aspectRatio,
  clipPath,
  onReplace,
  onRemove,
}: FocalPointPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [livePoint, setLivePoint] = useState<FocalPoint>(focalPoint)
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<{
    startClientX: number
    startClientY: number
    startPoint: FocalPoint
  } | null>(null)

  // Sync external changes (e.g. after autosave round-trip) into live state when
  // not in the middle of a drag.
  useEffect(() => {
    if (!dragRef.current) setLivePoint(focalPoint)
  }, [focalPoint])

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (!naturalSize) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = {
      startClientX: e.clientX,
      startClientY: e.clientY,
      startPoint: livePoint,
    }
    setIsDragging(true)
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag || !containerRef.current || !naturalSize) return

    const rect = containerRef.current.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return

    const imgRatio = naturalSize.w / naturalSize.h
    const conRatio = rect.width / rect.height

    // With object-fit: cover, only ONE axis overflows (the other fits exactly).
    let overflowX = 0
    let overflowY = 0
    if (imgRatio > conRatio) {
      // Image is wider than container → overflows horizontally.
      const scaledW = rect.height * imgRatio
      overflowX = scaledW - rect.width
    } else {
      // Image is narrower → overflows vertically.
      const scaledH = rect.width / imgRatio
      overflowY = scaledH - rect.height
    }

    const dx = e.clientX - drag.startClientX
    const dy = e.clientY - drag.startClientY

    // Dragging right (+dx) reveals the LEFT side of the image → lower X%.
    const deltaXPct = overflowX > 0 ? (-dx / overflowX) * 100 : 0
    const deltaYPct = overflowY > 0 ? (-dy / overflowY) * 100 : 0

    setLivePoint({
      x: clamp(drag.startPoint.x + deltaXPct, 0, 100),
      y: clamp(drag.startPoint.y + deltaYPct, 0, 100),
    })
  }

  function handlePointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    const committed = livePoint
    dragRef.current = null
    setIsDragging(false)
    if (committed.x !== focalPoint.x || committed.y !== focalPoint.y) {
      onFocalPointChange(committed)
    }
  }

  const canDrag = naturalSize !== null

  return (
    <div className="group relative">
      <div
        ref={containerRef}
        className="relative overflow-hidden bg-bg-muted select-none touch-none"
        style={{
          aspectRatio,
          clipPath,
          cursor: !canDrag ? 'default' : isDragging ? 'grabbing' : 'grab',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="Banner preview"
          draggable={false}
          onLoad={(e) => {
            const img = e.currentTarget
            setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight })
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: `${livePoint.x}% ${livePoint.y}%`,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        />

        {/* Drag hint — fades in on hover, hides while dragging */}
        <div
          className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity ${
            isDragging ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <span className="rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white shadow-sm">
            Drag to reposition
          </span>
        </div>
      </div>

      {/* Action buttons — positioned outside the clipped container so they're
          fully visible in corners that the clip-path would otherwise cut off. */}
      <div className="pointer-events-none absolute right-3 top-3 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={onReplace}
          className="pointer-events-auto rounded-md bg-white/95 px-2.5 py-1 text-xs font-medium text-text-secondary shadow-sm hover:bg-white hover:text-text"
          aria-label="Replace banner"
        >
          Replace
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-md bg-white/95 text-text-secondary shadow-sm hover:bg-white hover:text-error"
          aria-label="Remove banner"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
