'use client'

// ---------------------------------------------------------------------------
// Small confirm dialog for destructive or consequential actions (rollback,
// revoke). Controlled component — parent owns open state. Esc cancels, Enter
// confirms. `destructive` tints the confirm button red and focuses Cancel on
// open (safer default for irreversible actions).
// ---------------------------------------------------------------------------

import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel?: string
  destructive?: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement | null>(null)
  const cancelRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (!busy) onConfirm()
      }
    }
    window.addEventListener('keydown', handleKey)
    const t = window.setTimeout(() => {
      if (destructive) cancelRef.current?.focus()
      else confirmRef.current?.focus()
    }, 120)
    return () => {
      window.removeEventListener('keydown', handleKey)
      window.clearTimeout(t)
    }
  }, [open, destructive, busy, onConfirm, onCancel])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4"
          onClick={onCancel}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-message"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm rounded-xl bg-white p-5 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.06)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="confirm-title"
              className="mb-1.5 text-sm font-semibold text-text"
            >
              {title}
            </h2>
            <p
              id="confirm-message"
              className="mb-5 text-sm leading-relaxed text-text-secondary"
            >
              {message}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                ref={cancelRef}
                type="button"
                onClick={onCancel}
                disabled={busy}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                ref={confirmRef}
                type="button"
                onClick={onConfirm}
                disabled={busy}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium text-white transition-[background-color,transform] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-default disabled:opacity-60 ${
                  destructive
                    ? 'bg-error hover:bg-error/90 focus-visible:outline-error'
                    : 'bg-accent hover:bg-accent-hover focus-visible:outline-accent'
                }`}
              >
                {busy ? 'Working…' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
