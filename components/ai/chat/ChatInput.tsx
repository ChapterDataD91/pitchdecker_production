'use client'

import { useState, useRef, useCallback, type KeyboardEvent } from 'react'

interface ChatInputProps {
  onSend: (content: string) => void
  isStreaming: boolean
  onCancel: () => void
  onFileUpload: (file: File) => Promise<void>
  isUploading: boolean
}

const ACCEPTED_FILE_TYPES = '.pdf,.docx,.txt,.png,.jpg,.jpeg,.webp'

export default function ChatInput({
  onSend,
  isStreaming,
  onCancel,
  onFileUpload,
  isUploading,
}: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || isStreaming) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [value, isStreaming, onSend])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && e.metaKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  const handleInput = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [])

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? [])
      if (files.length === 0) return
      for (const file of files) {
        await onFileUpload(file)
      }
      // Reset input so the same set can be re-selected
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [onFileUpload],
  )

  return (
    <div className="shrink-0 border-t border-border px-3 py-3">
      <div className="flex items-end gap-2">
        {/* File attachment button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || isStreaming}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-bg-hover hover:text-text-secondary disabled:opacity-40 active:scale-[0.96]"
          aria-label="Attach a file"
        >
          {isUploading ? (
            <svg width="16" height="16" viewBox="0 0 16 16" className="animate-spin">
              <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="8" strokeLinecap="round" />
            </svg>
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M13.5 7.5l-5.318 5.318a2.625 2.625 0 0 1-3.712-3.712L9.788 3.788a1.75 1.75 0 0 1 2.474 2.474L6.944 11.58a.875.875 0 0 1-1.237-1.237L10.5 5.5" />
            </svg>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_FILE_TYPES}
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            handleInput()
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ask about this section..."
          rows={1}
          className="max-h-[120px] min-h-[36px] flex-1 resize-none rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none placeholder:text-text-placeholder focus:border-border-strong"
        />

        {isStreaming ? (
          <button
            onClick={onCancel}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-error text-white transition-colors hover:bg-error/90 active:scale-[0.96]"
            aria-label="Stop generating"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <rect x="2" y="2" width="10" height="10" rx="1.5" />
            </svg>
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!value.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-white transition-colors hover:bg-accent-hover disabled:opacity-40 disabled:hover:bg-accent active:scale-[0.96]"
            aria-label="Send message"
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
              <line x1="8" y1="12" x2="8" y2="4" />
              <polyline points="4 7 8 3 12 7" />
            </svg>
          </button>
        )}
      </div>
      <p className="mt-1.5 text-[10px] text-text-tertiary">
        <kbd className="rounded bg-bg-muted px-1 py-0.5 text-[10px] font-medium">
          &#8984;Enter
        </kbd>{' '}
        to send
      </p>
    </div>
  )
}
