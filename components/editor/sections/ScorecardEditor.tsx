'use client'

import type { ScorecardSection } from '@/lib/types'

interface ScorecardEditorProps {
  data: ScorecardSection
  onChange: (data: ScorecardSection) => void
}

const categories = [
  {
    key: 'mustHaves' as const,
    title: 'Must-Haves',
    color: 'bg-error-light text-error',
  },
  {
    key: 'niceToHaves' as const,
    title: 'Nice-to-Haves',
    color: 'bg-accent-light text-accent',
  },
  {
    key: 'leadership' as const,
    title: 'Leadership',
    color: 'bg-warning-light text-warning',
  },
  {
    key: 'successFactors' as const,
    title: 'Success Factors',
    color: 'bg-success-light text-success',
  },
]

export default function ScorecardEditor({
  data,
  onChange,
}: ScorecardEditorProps) {
  void data
  void onChange

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          Define weighted criteria across categories to build a consistent evaluation framework.
        </p>
        <button
          type="button"
          className="text-sm font-medium text-accent hover:text-accent-hover transition-colors whitespace-nowrap ml-4"
        >
          Import from search profile
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {categories.map((cat) => (
          <div key={cat.key} className="border border-border rounded-lg">
            <div className="px-4 py-3 border-b border-border bg-bg-subtle rounded-t-lg flex items-center gap-2">
              <span className={`inline-flex h-5 w-5 items-center justify-center rounded text-xs font-bold ${cat.color}`}>
                {cat.title.charAt(0)}
              </span>
              <h3 className="text-sm font-semibold text-text">{cat.title}</h3>
              <span className="text-xs text-text-tertiary ml-auto">0 criteria</span>
            </div>
            <div className="p-4">
              <div className="space-y-2 mb-3">
                {/* Criteria would render here */}
              </div>
              <button
                type="button"
                className="w-full rounded-md border border-dashed border-border-dashed py-2 text-sm font-medium text-text-tertiary hover:text-accent hover:border-accent hover:bg-accent-light transition-colors"
              >
                + Add criterion
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
