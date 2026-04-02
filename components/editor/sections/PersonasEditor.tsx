'use client'

import type { PersonasSection } from '@/lib/types'

interface PersonasEditorProps {
  data: PersonasSection
  onChange: (data: PersonasSection) => void
}

export default function PersonasEditor({
  data,
  onChange,
}: PersonasEditorProps) {
  void data
  void onChange

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">
        Define 2-3 candidate archetypes that represent different ideal profiles for this role.
      </p>

      <div className="grid grid-cols-3 gap-4">
        {/* Empty persona cards */}
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="border border-dashed border-border-dashed rounded-lg p-5 flex flex-col items-center justify-center min-h-[180px] cursor-pointer hover:border-accent hover:bg-accent-light transition-colors group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bg-muted group-hover:bg-accent-muted transition-colors mb-3">
              <svg className="h-5 w-5 text-text-tertiary group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-text-tertiary group-hover:text-accent transition-colors">
              + Add persona
            </p>
            <p className="mt-1 text-xs text-text-tertiary text-center">
              Archetype {n}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
