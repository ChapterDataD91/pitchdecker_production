'use client'

import type { ClientPlacement } from '@/app/api/ai/credentials/find-placements/route'

interface ClientListProps {
  clients: ClientPlacement[]
  acceptedIds: Set<string>
  contextLabel: string
  onAccept: (client: ClientPlacement) => void
}

export default function ClientList({
  clients,
  acceptedIds,
  contextLabel,
  onAccept,
}: ClientListProps) {
  if (clients.length === 0) {
    return (
      <p className="text-sm text-text-tertiary text-center py-3">
        No matching placements found for this axis.
      </p>
    )
  }

  const pending = clients.filter((c) => !acceptedIds.has(c.placementId))
  const acceptedCount = clients.length - pending.length

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-text-tertiary">
          {pending.length} client{pending.length === 1 ? '' : 's'} remaining
          {acceptedCount > 0 && (
            <span className="text-accent"> · {acceptedCount} added</span>
          )}
        </p>
      </div>

      {/* Pending clients */}
      {pending.map((client) => (
        <div
          key={client.placementId}
          className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-md hover:bg-bg-subtle transition-colors group"
        >
          <div className="flex-1 min-w-0 grid grid-cols-3 gap-2">
            <span className="text-sm font-medium text-text truncate">
              {client.role}
            </span>
            <span className="text-sm text-text truncate">
              {client.company}
            </span>
            <span className="text-sm text-text-secondary truncate">
              {client.context}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onAccept(client)}
            className="shrink-0 flex items-center justify-center h-7 w-7 rounded-md border border-border text-text-tertiary hover:text-accent hover:border-accent hover:bg-accent-light transition-colors opacity-0 group-hover:opacity-100"
            title="Add to axis"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
      ))}

      {/* Column header for context */}
      {pending.length > 0 && (
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border-subtle mt-2">
          <span className="text-[10px] uppercase tracking-wider text-text-tertiary">Role</span>
          <span className="text-[10px] uppercase tracking-wider text-text-tertiary">Company</span>
          <span className="text-[10px] uppercase tracking-wider text-text-tertiary">{contextLabel}</span>
        </div>
      )}

      {/* All added — empty state */}
      {pending.length === 0 && (
        <p className="text-sm text-text-tertiary text-center py-3">
          All {acceptedCount} client{acceptedCount === 1 ? '' : 's'} added. Remove one from the axis above to bring it back.
        </p>
      )}
    </div>
  )
}
