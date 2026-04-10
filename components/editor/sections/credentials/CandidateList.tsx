'use client'

import type { CandidatePlacement } from '@/app/api/ai/credentials/find-placements/route'

interface CandidateListProps {
  candidates: CandidatePlacement[]
  acceptedIds: Set<string>
  contextLabel: string
  onAccept: (candidate: CandidatePlacement) => void
}

export default function CandidateList({
  candidates,
  acceptedIds,
  contextLabel,
  onAccept,
}: CandidateListProps) {
  if (candidates.length === 0) {
    return (
      <p className="text-sm text-text-tertiary text-center py-3">
        No matching placements found for this axis.
      </p>
    )
  }

  const pending = candidates.filter((c) => !acceptedIds.has(c.placementId))
  const accepted = candidates.filter((c) => acceptedIds.has(c.placementId))

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-text-tertiary">
          {candidates.length} candidate{candidates.length === 1 ? '' : 's'} found
          {accepted.length > 0 && (
            <span className="text-accent"> · {accepted.length} added</span>
          )}
        </p>
      </div>

      {/* Pending candidates */}
      {pending.map((candidate) => (
        <div
          key={candidate.placementId}
          className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-md hover:bg-bg-subtle transition-colors group"
        >
          <div className="flex-1 min-w-0 grid grid-cols-3 gap-2">
            <span className="text-sm font-medium text-text truncate">
              {candidate.role}
            </span>
            <span className="text-sm text-text truncate">
              {candidate.company}
            </span>
            <span className="text-sm text-text-secondary truncate">
              {candidate.context}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onAccept(candidate)}
            className="shrink-0 flex items-center justify-center h-7 w-7 rounded-md border border-border text-text-tertiary hover:text-accent hover:border-accent hover:bg-accent-light transition-colors opacity-0 group-hover:opacity-100"
            title="Add to axis"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
      ))}

      {/* Accepted candidates (dimmed) */}
      {accepted.map((candidate) => (
        <div
          key={candidate.placementId}
          className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-md opacity-40"
        >
          <div className="flex-1 min-w-0 grid grid-cols-3 gap-2">
            <span className="text-sm text-text truncate">{candidate.role}</span>
            <span className="text-sm text-text truncate">{candidate.company}</span>
            <span className="text-sm text-text-secondary truncate">{candidate.context}</span>
          </div>
          <div className="shrink-0 flex items-center justify-center h-7 w-7 text-accent">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
        </div>
      ))}

      {/* Column header for context */}
      {candidates.length > 0 && (
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border-subtle mt-2">
          <span className="text-[10px] uppercase tracking-wider text-text-tertiary">Role</span>
          <span className="text-[10px] uppercase tracking-wider text-text-tertiary">Company</span>
          <span className="text-[10px] uppercase tracking-wider text-text-tertiary">{contextLabel}</span>
        </div>
      )}
    </div>
  )
}
