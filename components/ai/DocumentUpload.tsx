'use client'

import { useCallback, useRef, useState } from 'react'
import LoadingDots from '@/components/ui/LoadingDots'

interface DocumentUploadProps {
  onAnalyze: (file: File, instruction?: string) => void
  isAnalyzing: boolean
  instruction: string
  onInstructionChange: (value: string) => void
}

const ACCEPT = '.pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.webp'
const MAX_SIZE = 10 * 1024 * 1024

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DocumentUpload({
  onAnalyze,
  isAnalyzing,
  instruction,
  onInstructionChange,
}: DocumentUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    setError(null)
    const toAdd: File[] = []
    for (const f of Array.from(newFiles)) {
      if (f.size > MAX_SIZE) {
        setError(`${f.name} exceeds 10 MB limit.`)
        continue
      }
      toAdd.push(f)
    }
    setFiles((prev) => [...prev, ...toAdd])
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files)
    },
    [addFiles],
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) addFiles(e.target.files)
      if (inputRef.current) inputRef.current.value = ''
    },
    [addFiles],
  )

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setError(null)
  }

  const handleAnalyze = () => {
    for (const file of files) {
      onAnalyze(file, instruction || undefined)
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Drop zone — always visible for adding more files */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center rounded-xl text-center transition-colors cursor-pointer ${
          dragOver
            ? 'border-2 border-dashed border-accent bg-accent-light'
            : 'border-2 border-dashed border-border-dashed'
        } ${files.length > 0 ? 'p-4' : 'p-8'}`}
      >
        <svg
          width={files.length > 0 ? 20 : 32}
          height={files.length > 0 ? 20 : 32}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-text-tertiary mb-1"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p className={`font-medium text-text ${files.length > 0 ? 'text-xs' : 'text-sm'}`}>
          {files.length > 0 ? 'Drop more files or click to browse' : 'Drop files here'}
        </p>
        {files.length === 0 && (
          <p className="text-xs text-text-tertiary mt-1">
            PDF, DOCX, TXT, or images up to 10MB
          </p>
        )}
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                className="text-accent shrink-0"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text truncate">{file.name}</p>
                <p className="text-[10px] text-text-tertiary">{formatFileSize(file.size)}</p>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="p-0.5 rounded hover:bg-bg-muted text-text-tertiary hover:text-text transition-colors shrink-0"
                aria-label="Remove file"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <input ref={inputRef} type="file" accept={ACCEPT} multiple onChange={handleInputChange} className="hidden" />

      {error && <p className="text-xs text-error">{error}</p>}

      {/* Instruction input */}
      {files.length > 0 && (
        <input
          type="text"
          value={instruction}
          onChange={(e) => onInstructionChange(e.target.value)}
          placeholder="Focus on... (optional, e.g. 'leadership qualities' or 'technical skills')"
          className="w-full rounded-md border border-border px-3 py-2 text-xs text-text placeholder-text-placeholder outline-none focus:border-accent transition-colors"
        />
      )}

      {files.length > 0 && (
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="self-end inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium rounded-md hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isAnalyzing ? (<>Analyzing<LoadingDots className="ml-1" /></>) : `Analyze ${files.length > 1 ? `${files.length} files` : ''}`}
        </button>
      )}
    </div>
  )
}
