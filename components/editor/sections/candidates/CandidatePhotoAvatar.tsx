'use client'

import type { Candidate } from '@/lib/types'
import { useEditorStore } from '@/lib/store/editor-store'
import { useCandidatePhotoUpload } from './useCandidatePhotoUpload'

type Size = 'sm' | 'lg'

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'h-12 w-12 text-sm',
  lg: 'h-16 w-16 text-lg',
}

const ICON_CLASSES: Record<Size, string> = {
  sm: 'h-4 w-4',
  lg: 'h-5 w-5',
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

interface Props {
  candidate: Candidate
  size: Size
}

export default function CandidatePhotoAvatar({ candidate, size }: Props) {
  const deckId = useEditorStore((s) => s.deck?.id ?? '')
  const patchCandidate = useEditorStore((s) => s.patchCandidate)

  const { inputRef, uploading, previewUrl, error, upload, openPicker } =
    useCandidatePhotoUpload({
      deckId,
      candidateId: candidate.id,
      onUploaded: (photoUrl) => patchCandidate(candidate.id, { photoUrl }),
    })

  const displayUrl = previewUrl ?? candidate.photoUrl
  const hasPhoto = displayUrl.trim() !== ''
  const sizeClass = SIZE_CLASSES[size]
  const iconClass = ICON_CLASSES[size]

  return (
    <div className="group relative inline-block">
      <button
        type="button"
        onClick={openPicker}
        disabled={uploading}
        className={`relative block overflow-hidden rounded-md transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${sizeClass} ${
          hasPhoto ? '' : 'bg-bg-muted'
        } ${uploading ? 'cursor-wait' : 'cursor-pointer'}`}
        aria-label={
          hasPhoto
            ? `Replace photo for ${candidate.name || 'candidate'}`
            : `Upload photo for ${candidate.name || 'candidate'}`
        }
      >
        {hasPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayUrl}
            alt={candidate.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-semibold text-text-tertiary">
            {getInitials(candidate.name)}
          </span>
        )}

        {/* Hover / uploading overlay */}
        <span
          className={`absolute inset-0 flex items-center justify-center transition-colors ${
            uploading
              ? 'bg-black/40'
              : 'bg-black/0 group-hover:bg-black/35 group-focus-visible:bg-black/35'
          }`}
          aria-hidden="true"
        >
          {uploading ? (
            <svg
              className={`animate-spin text-white ${iconClass}`}
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeOpacity="0.3"
                strokeWidth="3"
              />
              <path
                d="M22 12a10 10 0 0 1-10 10"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg
              className={`text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 ${iconClass}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          )}
        </span>
      </button>

      {hasPhoto && !uploading && (
        <button
          type="button"
          onClick={() => patchCandidate(candidate.id, { photoUrl: '' })}
          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-text-secondary shadow-sm ring-1 ring-border opacity-0 transition-opacity hover:text-error hover:ring-border-strong group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label={`Remove photo for ${candidate.name || 'candidate'}`}
          title="Remove photo"
        >
          <svg
            width="9"
            height="9"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) upload(file)
          e.target.value = ''
        }}
      />

      {error && (
        <p
          role="alert"
          className="absolute left-0 top-full mt-1 whitespace-nowrap text-[10px] font-medium text-error"
        >
          {error}
        </p>
      )}
    </div>
  )
}
