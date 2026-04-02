'use client'

import type { CandidatesSection } from '@/lib/types'

interface CandidatesEditorProps {
  data: CandidatesSection
  onChange: (data: CandidatesSection) => void
}

export default function CandidatesEditor({
  data,
  onChange,
}: CandidatesEditorProps) {
  void data
  void onChange

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <div className="border-2 border-dashed border-border-dashed rounded-xl p-10 text-center cursor-pointer hover:border-accent hover:bg-accent-light transition-colors">
        <div className="flex justify-center mb-3">
          <svg className="h-8 w-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>
        <p className="text-base font-semibold text-text">Upload CVs</p>
        <p className="mt-1 text-sm text-text-secondary">
          Drag PDFs or Word documents here, or click to browse
        </p>
      </div>

      {/* LinkedIn URL input */}
      <div className="border border-border rounded-lg p-5">
        <p className="text-xs font-semibold text-text-tertiary tracking-wide uppercase mb-3">
          Or paste a LinkedIn profile URL
        </p>
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="https://linkedin.com/in/..."
            className="flex-1 rounded-md border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
          <button
            type="button"
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Query database card */}
      <div className="border border-border rounded-lg p-5 flex items-center justify-between cursor-pointer hover:bg-bg-subtle transition-colors group">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-light">
            <svg className="h-4.5 w-4.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-text">Query candidate database</p>
            <p className="text-sm text-text-secondary">Search your existing candidate pool by skills and experience</p>
          </div>
        </div>
        <svg className="h-5 w-5 text-text-tertiary group-hover:text-text-secondary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>
    </div>
  )
}
