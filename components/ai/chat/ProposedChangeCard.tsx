'use client'

import { motion } from 'framer-motion'
import type { ProposedChange } from '@/lib/ai-types'

interface ProposedChangeCardProps {
  change: ProposedChange
  onAccept: () => void
  onDismiss: () => void
}

export default function ProposedChangeCard({
  change,
  onAccept,
  onDismiss,
}: ProposedChangeCardProps) {
  const isPending = change.status === 'pending'

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="mt-2 rounded-lg border border-border bg-bg p-3"
    >
      <div className="mb-1 flex items-center gap-2">
        <span className="rounded bg-accent-light px-1.5 py-0.5 text-[10px] font-medium text-accent">
          {change.sectionKey}
        </span>
        <span className="text-xs text-text-secondary">{change.description}</span>
      </div>

      {isPending && (
        <div className="mt-2 flex gap-2">
          <button
            onClick={onAccept}
            className="rounded-md bg-accent px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-accent-hover active:scale-[0.98]"
          >
            Apply
          </button>
          <button
            onClick={onDismiss}
            className="rounded-md px-3 py-1 text-xs text-text-secondary transition-colors hover:bg-bg-hover hover:text-text active:scale-[0.98]"
          >
            Dismiss
          </button>
        </div>
      )}

      {change.status === 'accepted' && (
        <div className="mt-1.5 flex items-center gap-1 text-xs text-success">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="2 6 5 9 10 3" />
          </svg>
          Applied
        </div>
      )}

      {change.status === 'dismissed' && (
        <span className="mt-1.5 inline-block text-xs text-text-tertiary">
          Dismissed
        </span>
      )}
    </motion.div>
  )
}
