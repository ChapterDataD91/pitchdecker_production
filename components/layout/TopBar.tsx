'use client'

// ---------------------------------------------------------------------------
// TopBar — Sticky top bar spanning full width
// Shows: back arrow, editable deck title, completion count, and save status.
// Preview button lives in the Sidebar per v8 prototype.
// ---------------------------------------------------------------------------

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

type SaveStatus = 'saved' | 'saving' | 'error' | 'idle'

interface TopBarProps {
  deckTitle: string
  onTitleChange: (title: string) => void
  completedSections: number
  totalSections: number
  saveStatus: SaveStatus
  onBack: () => void
}

const saveStatusConfig: Record<SaveStatus, { label: string; dotClass: string; animate: boolean }> = {
  saved: { label: 'Saved', dotClass: 'bg-success', animate: false },
  saving: { label: 'Saving...', dotClass: 'bg-warning', animate: true },
  error: { label: 'Error saving', dotClass: 'bg-error', animate: false },
  idle: { label: '', dotClass: 'bg-text-tertiary', animate: false },
}

export default function TopBar({
  deckTitle,
  onTitleChange,
  completedSections,
  totalSections,
  saveStatus,
  onBack,
}: TopBarProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(deckTitle)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setEditValue(deckTitle)
  }, [deckTitle])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  function handleTitleSubmit() {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== deckTitle) {
      onTitleChange(trimmed)
    } else {
      setEditValue(deckTitle)
    }
    setIsEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleTitleSubmit()
    } else if (e.key === 'Escape') {
      setEditValue(deckTitle)
      setIsEditing(false)
    }
  }

  const statusCfg = saveStatusConfig[saveStatus]

  return (
    <header className="sticky top-0 z-40 flex h-12 items-center gap-4 border-b border-border bg-bg px-5">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center justify-center rounded-sm p-1.5 text-text-secondary transition-colors hover:bg-bg-hover hover:text-text"
        aria-label="Go back to dashboard"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 20 20"
          fill="none"
          className="shrink-0"
        >
          <path
            d="M12.5 15L7.5 10L12.5 5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Editable deck title */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={handleKeyDown}
            className="min-w-0 flex-1 rounded-sm border border-border bg-bg-subtle px-2.5 py-1 text-sm font-medium text-text outline-none focus:border-accent"
          />
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="min-w-0 truncate rounded-sm px-2.5 py-1 text-left text-sm font-medium text-text transition-colors hover:bg-bg-hover"
            title="Click to edit title"
          >
            {deckTitle || 'Untitled Deck'}
          </button>
        )}

        {/* Section completion count */}
        <span className="hidden shrink-0 text-xs text-text-tertiary sm:inline">
          {completedSections} of {totalSections} sections
        </span>
      </div>

      {/* Save status indicator */}
      {saveStatus !== 'idle' && (
        <div className="flex items-center gap-1.5">
          <motion.span
            className={`inline-block h-1.5 w-1.5 rounded-full ${statusCfg.dotClass}`}
            animate={
              statusCfg.animate
                ? { scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }
                : undefined
            }
            transition={
              statusCfg.animate
                ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
                : undefined
            }
          />
          <span className="text-xs text-text-secondary">{statusCfg.label}</span>
        </div>
      )}
    </header>
  )
}
