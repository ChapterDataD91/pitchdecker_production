'use client'

import type { SearchProfileSection } from '@/lib/types'

interface SearchProfileEditorProps {
  data: SearchProfileSection
  onChange: (data: SearchProfileSection) => void
}

export default function SearchProfileEditor({
  data,
  onChange,
}: SearchProfileEditorProps) {
  void data
  void onChange

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Must-Haves column */}
      <div className="border border-border rounded-lg">
        <div className="px-4 py-3 border-b border-border bg-bg-subtle rounded-t-lg">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-error-light">
              <svg className="h-3 w-3 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </span>
            <h3 className="text-sm font-semibold text-text">Must-Haves</h3>
          </div>
        </div>
        <div className="p-4">
          <p className="text-sm text-text-secondary mb-4">
            Non-negotiable requirements for candidates
          </p>
          <div className="space-y-2 mb-4">
            {/* Empty state - criteria would render here */}
          </div>
          <button
            type="button"
            className="w-full rounded-md border border-dashed border-border-dashed py-2.5 text-sm font-medium text-text-tertiary hover:text-accent hover:border-accent hover:bg-accent-light transition-colors"
          >
            + Add criterion
          </button>
        </div>
      </div>

      {/* Nice-to-Haves column */}
      <div className="border border-border rounded-lg">
        <div className="px-4 py-3 border-b border-border bg-bg-subtle rounded-t-lg">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-accent-light">
              <svg className="h-3 w-3 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </span>
            <h3 className="text-sm font-semibold text-text">Nice-to-Haves</h3>
          </div>
        </div>
        <div className="p-4">
          <p className="text-sm text-text-secondary mb-4">
            Preferred but not required qualifications
          </p>
          <div className="space-y-2 mb-4">
            {/* Empty state - criteria would render here */}
          </div>
          <button
            type="button"
            className="w-full rounded-md border border-dashed border-border-dashed py-2.5 text-sm font-medium text-text-tertiary hover:text-accent hover:border-accent hover:bg-accent-light transition-colors"
          >
            + Add criterion
          </button>
        </div>
      </div>
    </div>
  )
}
