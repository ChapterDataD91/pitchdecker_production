'use client'

import { motion } from 'framer-motion'
import Badge from '@/components/ui/Badge'
import type { AISuggestion } from '@/lib/ai-types'

interface SuggestionCardProps {
  suggestion: AISuggestion
  onAccept: (id: string) => void
  onDismiss: (id: string) => void
}

export default function SuggestionCard({
  suggestion,
  onAccept,
  onDismiss,
}: SuggestionCardProps) {
  const { id, text, weight, category, reasoning, status } = suggestion

  const isAccepted = status === 'accepted'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
      className={`border rounded-md px-4 py-3 ${
        isAccepted
          ? 'border-l-2 border-l-success bg-success-light/40 border-t-border border-r-border border-b-border'
          : 'border-border'
      }`}
    >
      {/* Top row: text + actions */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-text leading-snug flex-1">{text}</p>

        {status === 'pending' && (
          <div className="flex items-center gap-1 shrink-0 mt-0.5">
            {/* Accept */}
            <button
              onClick={() => onAccept(id)}
              className="p-1 rounded hover:bg-success-light text-text-tertiary hover:text-success transition-colors"
              aria-label="Accept suggestion"
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
                <polyline points="3.5 8.5 6.5 11.5 12.5 5" />
              </svg>
            </button>

            {/* Dismiss */}
            <button
              onClick={() => onDismiss(id)}
              className="p-1 rounded hover:bg-error-light text-text-tertiary hover:text-error transition-colors"
              aria-label="Dismiss suggestion"
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

        {isAccepted && (
          <span className="shrink-0 mt-0.5 text-success">
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
              <polyline points="3.5 8.5 6.5 11.5 12.5 5" />
            </svg>
          </span>
        )}
      </div>

      {/* Meta row: weight dots + category badge */}
      <div className="flex items-center gap-3 mt-2">
        {/* Weight dots */}
        <div className="flex items-center gap-0.5" title={`Weight: ${weight}`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={`inline-block w-1.5 h-1.5 rounded-full ${
                i < weight ? 'bg-accent' : 'bg-border'
              }`}
            />
          ))}
        </div>

        <Badge
          text={category === 'mustHave' ? 'Must-Have' : 'Nice-to-Have'}
          color={category === 'mustHave' ? 'rose' : 'sage'}
        />
      </div>

      {/* Optional reasoning */}
      {reasoning && (
        <p className="mt-2 text-xs text-text-tertiary leading-relaxed">
          {reasoning}
        </p>
      )}
    </motion.div>
  )
}
