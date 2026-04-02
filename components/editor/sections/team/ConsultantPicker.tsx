'use client'

import { useState, useEffect, useMemo } from 'react'
import type { ConsultantSummary } from '@/lib/types'

interface ConsultantPickerProps {
  selectedIds: string[]
  onSelect: (consultant: ConsultantSummary) => void
}

export default function ConsultantPicker({ selectedIds, onSelect }: ConsultantPickerProps) {
  const [consultants, setConsultants] = useState<ConsultantSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    async function fetchConsultants() {
      try {
        setLoading(true)
        const res = await fetch('/api/consultants')
        if (!res.ok) throw new Error('Failed to load consultants')
        const data: ConsultantSummary[] = await res.json()
        if (!cancelled) {
          setConsultants(data)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchConsultants()
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return consultants
    const q = search.toLowerCase()
    return consultants.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        c.sectors.some((s) => s.toLowerCase().includes(q)) ||
        c.functionalAreas.some((a) => a.toLowerCase().includes(q)),
    )
  }, [consultants, search])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading consultants...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-error">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm text-accent hover:text-accent-hover transition-colors"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, role, or sector..."
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-border bg-bg placeholder:text-text-placeholder focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
        />
      </div>

      {/* Results count */}
      <p className="text-xs text-text-tertiary">
        {filtered.length} consultant{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Consultant grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-text-secondary">No consultants match your search</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((consultant) => {
            const isSelected = selectedIds.includes(consultant.id)
            return (
              <button
                key={consultant.id}
                onClick={() => { if (!isSelected) onSelect(consultant) }}
                disabled={isSelected}
                className={`relative text-left rounded-lg border p-3 transition-all ${
                  isSelected
                    ? 'border-border bg-bg-muted opacity-50 cursor-default'
                    : 'border-border hover:border-accent hover:shadow-sm cursor-pointer'
                }`}
              >
                {/* Selected checkmark */}
                {isSelected && (
                  <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-accent flex items-center justify-center">
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}

                {/* Photo */}
                <div className="w-12 h-12 rounded-full bg-bg-muted overflow-hidden mb-2 shrink-0">
                  {consultant.photoUrl ? (
                    <img
                      src={consultant.photoUrl}
                      alt={consultant.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-tertiary">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <p className="text-sm font-medium text-text leading-tight truncate">{consultant.name}</p>
                <p className="text-xs text-text-secondary truncate">{consultant.role}</p>
                {consultant.sectors.length > 0 && (
                  <p className="text-xs text-text-tertiary truncate mt-1">
                    {consultant.sectors.slice(0, 2).join(', ')}
                  </p>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
