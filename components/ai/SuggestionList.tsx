'use client'

import { AnimatePresence } from 'framer-motion'
import SuggestionCard from './SuggestionCard'
import type { AISuggestion } from '@/lib/ai-types'

interface SuggestionListProps {
  suggestions: AISuggestion[]
  onAccept: (id: string) => void
  onDismiss: (id: string) => void
  onAcceptAll: () => void
  onDismissAll: () => void
}

export default function SuggestionList({
  suggestions,
  onAccept,
  onDismiss,
  onAcceptAll,
  onDismissAll,
}: SuggestionListProps) {
  const pendingCount = suggestions.filter((s) => s.status === 'pending').length
  const hasPending = pendingCount > 0

  if (suggestions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <p className="text-sm text-text-tertiary text-center">
          No suggestions yet. Use the inputs above to analyze content.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text">Suggestions</span>
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 rounded-full bg-bg-muted text-xs font-medium text-text-secondary px-1.5">
            {suggestions.length}
          </span>
        </div>

        {hasPending && (
          <div className="flex items-center gap-3">
            <button
              onClick={onAcceptAll}
              className="text-xs text-success hover:text-success font-medium hover:underline transition-colors"
            >
              Accept All
            </button>
            <button
              onClick={onDismissAll}
              className="text-xs text-text-tertiary hover:text-error font-medium hover:underline transition-colors"
            >
              Dismiss All
            </button>
          </div>
        )}
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        <AnimatePresence mode="popLayout">
          {suggestions
            .filter((s) => s.status !== 'dismissed')
            .map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onAccept={onAccept}
                onDismiss={onDismiss}
              />
            ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
