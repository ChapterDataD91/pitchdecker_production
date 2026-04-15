'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface PublishResult {
  viewerUrl: string
  pin: string
  expiresInDays: number
}

interface PublishModalProps {
  result: PublishResult | null
  clientName: string
  onClose: () => void
}

function formatPin(pin: string): string {
  return pin.length === 6 ? `${pin.slice(0, 3)} ${pin.slice(3)}` : pin
}

function formatExpiryDate(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatCombined(clientName: string, r: PublishResult): string {
  return `Pitch deck for ${clientName}\n\nLink: ${r.viewerUrl}\nPIN: ${r.pin}\n\nExpires in ${r.expiresInDays} days.`
}

export default function PublishModal({
  result,
  clientName,
  onClose,
}: PublishModalProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const copyTimer = useRef<number | null>(null)
  const copyBothRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!result) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKey)
    // Focus the primary next action after the enter animation settles
    const t = window.setTimeout(() => copyBothRef.current?.focus(), 150)
    return () => {
      window.removeEventListener('keydown', handleKey)
      window.clearTimeout(t)
    }
  }, [result, onClose])

  useEffect(() => {
    return () => {
      if (copyTimer.current) window.clearTimeout(copyTimer.current)
    }
  }, [])

  async function copyToClipboard(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(key)
      if (copyTimer.current) window.clearTimeout(copyTimer.current)
      copyTimer.current = window.setTimeout(() => setCopiedKey(null), 1200)
    } catch {
      // Silent fail — browser without clipboard access. User can still select.
    }
  }

  return (
    <AnimatePresence>
      {result && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4"
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Deck published"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.06)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Headline */}
            <div className="mb-5 flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success-light text-success">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M3.5 8.5L6.5 11.5L12.5 4.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <div>
                <h2 className="text-base font-semibold text-text">
                  Deck published
                </h2>
                <p className="mt-0.5 text-sm text-text-secondary">
                  Share the link and PIN with {clientName || 'the client'}.
                </p>
              </div>
            </div>

            {/* URL */}
            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-text-secondary">
                Link
              </label>
              <div className="flex items-stretch gap-2">
                <input
                  readOnly
                  value={result.viewerUrl}
                  onFocus={(e) => e.currentTarget.select()}
                  className="flex-1 rounded-md border border-border bg-bg-subtle px-3 py-2 font-mono text-xs text-text focus:border-accent focus:bg-white focus:outline-none"
                />
                <CopyButton
                  copied={copiedKey === 'url'}
                  onClick={() => copyToClipboard(result.viewerUrl, 'url')}
                  ariaLabel="Copy link"
                />
              </div>
            </div>

            {/* PIN */}
            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-text-secondary">
                PIN
              </label>
              <div className="flex items-stretch gap-2">
                <div className="flex-1 rounded-md border border-border bg-bg-subtle px-3 py-2 font-mono text-base tracking-[0.3em] text-text">
                  {formatPin(result.pin)}
                </div>
                <CopyButton
                  copied={copiedKey === 'pin'}
                  onClick={() => copyToClipboard(result.pin, 'pin')}
                  ariaLabel="Copy PIN"
                />
              </div>
            </div>

            {/* Expiry */}
            <p className="mb-5 text-xs text-text-tertiary">
              Expires in {result.expiresInDays} days · {formatExpiryDate(result.expiresInDays)}
            </p>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <button
                  ref={copyBothRef}
                  onClick={() =>
                    copyToClipboard(formatCombined(clientName, result), 'both')
                  }
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {copiedKey === 'both' ? 'Copied' : 'Copy both'}
                </button>
                <a
                  href={result.viewerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  Open viewer
                </a>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-white transition-[background-color,transform] hover:bg-accent-hover active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function CopyButton({
  copied,
  onClick,
  ariaLabel,
}: {
  copied: boolean
  onClick: () => void
  ariaLabel: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="flex w-9 shrink-0 items-center justify-center rounded-md border border-border bg-white text-text-secondary transition-colors hover:border-border-strong hover:bg-bg-hover hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M3.5 8.5L6.5 11.5L12.5 4.5"
            stroke="var(--color-success)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M11 5V3.5C11 2.94772 10.5523 2.5 10 2.5H3.5C2.94772 2.5 2.5 2.94772 2.5 3.5V10C2.5 10.5523 2.94772 11 3.5 11H5"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      )}
    </button>
  )
}
