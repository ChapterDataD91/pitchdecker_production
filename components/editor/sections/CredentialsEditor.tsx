'use client'

import type { CredentialsSection } from '@/lib/types'

interface CredentialsEditorProps {
  data: CredentialsSection
  onChange: (data: CredentialsSection) => void
}

export default function CredentialsEditor({
  data,
  onChange,
}: CredentialsEditorProps) {
  void data
  void onChange

  return (
    <div className="space-y-4">
      {/* Existing axes would render here */}

      {/* Empty state / add zone */}
      <div className="border-2 border-dashed border-border-dashed rounded-xl p-8 text-center">
        <div className="flex justify-center mb-3">
          <svg className="h-7 w-7 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-text">No credential axes yet</p>
        <p className="mt-1 text-sm text-text-secondary">
          Group your track record by industry, function, or seniority
        </p>
        <button
          type="button"
          className="mt-4 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
        >
          + Add credential axis
        </button>
      </div>

      {/* Import from database */}
      <div className="border border-border rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-bg-subtle transition-colors group">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-bg-muted">
            <svg className="h-4 w-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-text">Import from credential database</p>
            <p className="text-xs text-text-secondary">Pull in placements from your CRM</p>
          </div>
        </div>
        <svg className="h-4 w-4 text-text-tertiary group-hover:text-text-secondary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>
    </div>
  )
}
