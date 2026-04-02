'use client'

import { useState } from 'react'
import LoadingDots from '@/components/ui/LoadingDots'

interface WebSearchInputProps {
  onSearch: (query: string, instruction?: string) => void
  isSearching: boolean
  defaultQuery?: string
  instruction: string
  onInstructionChange: (value: string) => void
}

export default function WebSearchInput({
  onSearch,
  isSearching,
  defaultQuery = '',
  instruction,
  onInstructionChange,
}: WebSearchInputProps) {
  const [query, setQuery] = useState(defaultQuery)

  const canSearch = query.trim().length > 0 && !isSearching

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && canSearch) onSearch(query, instruction || undefined) }}
          placeholder="e.g. CFO requirements at Acme Corp"
          className="w-full border border-border rounded-md pl-9 pr-3 py-2.5 text-sm text-text bg-bg placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
        />
      </div>

      <input
        type="text"
        value={instruction}
        onChange={(e) => onInstructionChange(e.target.value)}
        placeholder="Focus on... (optional, e.g. 'industry-specific challenges' or 'governance requirements')"
        className="w-full rounded-md border border-border px-3 py-2 text-xs text-text placeholder-text-placeholder outline-none focus:border-accent transition-colors"
      />

      <p className="text-xs text-text-tertiary">
        Claude will search the web and extract relevant criteria
      </p>

      <button
        onClick={() => onSearch(query, instruction || undefined)}
        disabled={!canSearch}
        className="self-end inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium rounded-md hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {isSearching ? (<>Searching<LoadingDots className="ml-1" /></>) : 'Search & Analyze'}
      </button>
    </div>
  )
}
