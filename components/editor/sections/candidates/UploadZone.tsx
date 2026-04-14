'use client'

import { useCallback, useRef, useState, type DragEvent } from 'react'

interface UploadZoneProps {
  variant?: 'hero' | 'compact'
  onFilesSelected: (files: File[]) => void
}

const ACCEPT = '.pdf,.docx,.txt'

export default function UploadZone({
  variant = 'hero',
  onFilesSelected,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return
      onFilesSelected(Array.from(fileList))
    },
    [onFilesSelected],
  )

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setDragOver(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles],
  )

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const open = () => inputRef.current?.click()

  if (variant === 'compact') {
    return (
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`flex items-center justify-between rounded-lg border border-dashed px-4 py-3 transition-colors ${
          dragOver
            ? 'border-accent bg-accent-light'
            : 'border-border-dashed hover:border-accent hover:bg-bg-subtle'
        }`}
      >
        <div className="flex items-center gap-3">
          <svg
            className="h-4 w-4 text-text-tertiary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
          <p className="text-sm text-text-secondary">
            Drop CVs here, or{' '}
            <button
              type="button"
              onClick={open}
              className="font-medium text-accent hover:text-accent-hover transition-colors"
            >
              browse
            </button>
          </p>
        </div>
        <p className="text-xs text-text-tertiary">PDF · DOCX · TXT</p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>
    )
  }

  return (
    <div
      onClick={open}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          open()
        }
      }}
      className={`rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
        dragOver
          ? 'border-accent bg-accent-light'
          : 'border-border-dashed hover:border-accent hover:bg-accent-light'
      }`}
    >
      <div className="flex justify-center mb-3">
        <svg
          className="h-8 w-8 text-text-tertiary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
      </div>
      <p className="text-base font-semibold text-text">Upload CVs</p>
      <p className="mt-1 text-sm text-text-secondary">
        Drag PDFs or Word documents here, or click to browse
      </p>
      <p className="mt-1 text-xs text-text-tertiary">
        LinkedIn profiles? Export as PDF and drop it here.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ''
        }}
      />
    </div>
  )
}
