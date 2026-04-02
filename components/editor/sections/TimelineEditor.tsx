'use client'

import type { TimelineSection } from '@/lib/types'

interface TimelineEditorProps {
  data: TimelineSection
  onChange: (data: TimelineSection) => void
}

export default function TimelineEditor({
  data,
  onChange,
}: TimelineEditorProps) {
  void data
  void onChange

  return (
    <div className="space-y-4">
      {/* Template button */}
      <div className="border border-border rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-accent-light hover:border-accent transition-colors group">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-light">
            <svg className="h-4.5 w-4.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-text">Start from 12-week template</p>
            <p className="text-xs text-text-secondary">Pre-configured phases: sourcing, screening, shortlist, interviews, offer</p>
          </div>
        </div>
        <svg className="h-5 w-5 text-text-tertiary group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>

      {/* Empty timeline track */}
      <div className="border border-border rounded-lg p-6 bg-bg-subtle">
        <div className="flex items-center gap-2 mb-4">
          <svg className="h-4 w-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Timeline</span>
          <span className="text-xs text-text-tertiary ml-auto">0 weeks total</span>
        </div>

        {/* Empty phase track */}
        <div className="relative">
          <div className="h-1 w-full bg-border rounded-full mb-4" />
          <div className="flex items-center justify-center py-6">
            <p className="text-sm text-text-secondary">No phases added yet</p>
          </div>
        </div>

        <button
          type="button"
          className="w-full rounded-md border border-dashed border-border-dashed py-2.5 text-sm font-medium text-text-tertiary hover:text-accent hover:border-accent hover:bg-accent-light transition-colors"
        >
          + Add phase
        </button>
      </div>
    </div>
  )
}
