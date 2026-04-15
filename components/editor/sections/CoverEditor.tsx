'use client'

import { useRef, useState } from 'react'
import type { CoverSection } from '@/lib/types'
import { useAIStore } from '@/lib/store/ai-store'
import { useEditorStore } from '@/lib/store/editor-store'
import LoadingDots from '@/components/ui/LoadingDots'

interface CoverEditorProps {
  data: CoverSection
  onChange: (data: CoverSection) => void
}

const ACCEPTED = '.pdf,.docx,.txt'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function CoverEditor({ data, onChange }: CoverEditorProps) {
  void onChange

  const deckId = useEditorStore((s) => s.deck?.id ?? null)
  const deckDocuments = useAIStore((s) => s.deckDocuments)
  const uploadDocument = useAIStore((s) => s.uploadDocument)
  const removeDocument = useAIStore((s) => s.removeDocument)
  const isUploadingDocument = useAIStore((s) => s.isUploadingDocument)

  const inputRef = useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || !deckId) return
    setUploadError(null)
    for (const file of Array.from(files)) {
      const doc = await uploadDocument(deckId, file)
      if (!doc) {
        setUploadError(`Couldn't upload ${file.name}`)
      }
    }
  }

  async function handleRemove(docId: string) {
    if (!deckId) return
    await removeDocument(deckId, docId)
  }

  return (
    <div className="space-y-5">
      {/* Client name & Role title */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            Client Name
          </label>
          <input
            type="text"
            placeholder="e.g. Acme Corporation"
            defaultValue={data.clientName}
            className="w-full rounded-md border border-border bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            Role Title
          </label>
          <input
            type="text"
            placeholder="e.g. Chief Financial Officer"
            defaultValue={data.roleTitle}
            className="w-full rounded-md border border-border bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </div>
      </div>

      {/* Intro paragraph */}
      <div>
        <label className="block text-sm font-medium text-text mb-1.5">
          Introduction
        </label>
        <textarea
          placeholder="Write a compelling introduction paragraph for this pitch deck..."
          defaultValue={data.introParagraph}
          rows={3}
          style={{ fieldSizing: 'content' } as React.CSSProperties}
          className="w-full min-h-[5rem] rounded-md border border-border bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
        />
        <p className="mt-1.5 text-xs text-text-tertiary">
          This appears on the cover page below the title. Keep it concise and engaging.
        </p>
      </div>

      {/* Context documents */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-medium text-text">
            Context Documents
          </label>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={!deckId || isUploadingDocument}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:text-accent hover:border-accent hover:bg-accent-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploadingDocument ? (
              <>
                <LoadingDots />
                <span>Uploading…</span>
              </>
            ) : (
              <>
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                <span>Upload context</span>
              </>
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            multiple
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </div>

        {deckDocuments.length === 0 ? (
          <p className="text-xs text-text-tertiary">
            Drop the job description, call notes, or any briefing documents here.
            Every AI step downstream will read from these.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {deckDocuments.map((doc) => (
              <li
                key={doc.id}
                className="group inline-flex items-center gap-2 rounded-md border border-border bg-bg-subtle pl-2.5 pr-1.5 py-1 text-xs text-text"
                title={`${doc.fileType.toUpperCase()} · ${formatBytes(doc.fileSize)}`}
              >
                <svg
                  className="h-3.5 w-3.5 text-text-tertiary shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
                <span className="font-medium truncate max-w-[18rem]">
                  {doc.fileName}
                </span>
                <span className="text-text-tertiary">
                  {formatBytes(doc.fileSize)}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(doc.id)}
                  className="h-5 w-5 flex items-center justify-center rounded text-text-tertiary hover:text-rose-600 hover:bg-white transition-colors"
                  aria-label={`Remove ${doc.fileName}`}
                >
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}

        {uploadError && (
          <p className="mt-2 text-xs text-rose-600">{uploadError}</p>
        )}
      </div>

      {/* Hero image */}
      <div>
        <label className="block text-sm font-medium text-text mb-1.5">
          Hero Image
        </label>
        <div className="border-2 border-dashed border-border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-accent hover:bg-accent-light transition-colors">
          <div className="flex justify-center mb-2">
            <svg className="h-8 w-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-text">Upload hero image</p>
          <p className="mt-1 text-xs text-text-secondary">
            PNG, JPG up to 5MB. Recommended 1600x900px.
          </p>
        </div>
      </div>
    </div>
  )
}
