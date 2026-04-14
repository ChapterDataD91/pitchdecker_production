'use client'

import type { CoverSection } from '@/lib/types'

interface CoverEditorProps {
  data: CoverSection
  onChange: (data: CoverSection) => void
}

export default function CoverEditor({ data, onChange }: CoverEditorProps) {
  void onChange

  return (
    <div className="space-y-5">
      {/* Client name & Role title */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            Client Name
          </label>
          <input
            type="text"
            placeholder="e.g. Acme Corporation"
            defaultValue={data.clientName}
            className="w-full rounded-md border border-border bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            Role Title
          </label>
          <input
            type="text"
            placeholder="e.g. Chief Financial Officer"
            defaultValue={data.roleTitle}
            className="w-full rounded-md border border-border bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </div>
      </div>

      {/* Intro paragraph */}
      <div>
        <label className="block text-sm font-medium text-text mb-1.5">
          Introduction
        </label>
        <textarea
          placeholder="Write a compelling introduction paragraph for this pitch deck..."
          defaultValue={data.introParagraph}
          rows={3}
          style={{ fieldSizing: 'content' } as React.CSSProperties}
          className="w-full min-h-[5rem] rounded-md border border-border bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
        />
        <p className="mt-1.5 text-xs text-text-tertiary">
          This appears on the cover page below the title. Keep it concise and engaging.
        </p>
      </div>

      {/* Hero image */}
      <div>
        <label className="block text-sm font-medium text-text mb-1.5">
          Hero Image
        </label>
        <div className="border-2 border-dashed border-border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-accent hover:bg-accent-light transition-colors">
          <div className="flex justify-center mb-2">
            <svg className="h-8 w-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-text">Upload hero image</p>
          <p className="mt-1 text-xs text-text-secondary">
            PNG, JPG up to 5MB. Recommended 1600x900px.
          </p>
        </div>
      </div>
    </div>
  )
}
