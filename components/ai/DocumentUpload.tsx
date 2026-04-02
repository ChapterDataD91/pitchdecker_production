'use client'

import { useCallback, useRef, useState } from 'react'
import LoadingDots from '@/components/ui/LoadingDots'

interface DocumentUploadProps {
  onAnalyze: (file: File) => void
  isAnalyzing: boolean
}

const ACCEPT =
  '.pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.webp'

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DocumentUpload({
  onAnalyze,
  isAnalyzing,
}: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((f: File) => {
    setError(null)
    if (f.size > MAX_SIZE) {
      setError('File exceeds 10 MB limit.')
      return
    }
    setFile(f)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const dropped = e.dataTransfer.files[0]
      if (dropped) handleFile(dropped)
    },
    [handleFile],
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0]
      if (selected) handleFile(selected)
    },
    [handleFile],
  )

  const removeFile = () => {
    setFile(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !file && inputRef.current?.click()}
        className={`flex flex-col items-center justify-center rounded-xl p-8 text-center transition-colors cursor-pointer ${
          dragOver
            ? 'border-2 border-dashed border-accent bg-accent-light'
            : 'border-2 border-dashed border-border-dashed'
        } ${file ? 'cursor-default' : ''}`}
      >
        {!file ? (
          <>
            {/* Upload icon */}
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-text-tertiary mb-3"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="text-sm font-medium text-text">Drop files here</p>
            <p className="text-xs text-text-tertiary mt-1">
              PDF, DOCX, TXT, or images up to 10MB
            </p>
          </>
        ) : (
          <div className="flex items-center gap-3 w-full">
            {/* File icon */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-accent shrink-0"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm text-text truncate">{file.name}</p>
              <p className="text-xs text-text-tertiary">
                {formatFileSize(file.size)}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                removeFile()
              }}
              className="p-1 rounded hover:bg-bg-muted text-text-tertiary hover:text-text transition-colors shrink-0"
              aria-label="Remove file"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="4.5" y1="4.5" x2="11.5" y2="11.5" />
                <line x1="11.5" y1="4.5" x2="4.5" y2="11.5" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Error */}
      {error && (
        <p className="text-xs text-error">{error}</p>
      )}

      {/* Analyze button — only visible when a file is selected */}
      {file && (
        <button
          onClick={() => onAnalyze(file)}
          disabled={isAnalyzing}
          className="self-end inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium rounded-md hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isAnalyzing ? (
            <>
              Analyzing
              <LoadingDots className="ml-1" />
            </>
          ) : (
            'Analyze'
          )}
        </button>
      )}
    </div>
  )
}
