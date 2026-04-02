'use client'

import type { TeamSection } from '@/lib/types'

interface TeamEditorProps {
  data: TeamSection
  onChange: (data: TeamSection) => void
}

export default function TeamEditor({ data, onChange }: TeamEditorProps) {
  void data
  void onChange

  return (
    <div className="space-y-6">
      {/* Lead Team */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-text">Lead Team</h3>
          <span className="text-xs text-text-tertiary">0 members</span>
        </div>
        <div className="border border-border rounded-lg p-6 bg-bg-subtle">
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-dashed border-border-dashed rounded-lg p-4 flex flex-col items-center justify-center min-h-[120px] cursor-pointer hover:border-accent hover:bg-accent-light transition-colors group">
              <svg className="h-6 w-6 text-text-tertiary group-hover:text-accent mb-2 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <span className="text-sm font-medium text-text-tertiary group-hover:text-accent transition-colors">+ Add member</span>
            </div>
            <div className="border border-dashed border-border-dashed rounded-lg p-4 flex flex-col items-center justify-center min-h-[120px] cursor-pointer hover:border-accent hover:bg-accent-light transition-colors group">
              <svg className="h-6 w-6 text-text-tertiary group-hover:text-accent mb-2 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <span className="text-sm font-medium text-text-tertiary group-hover:text-accent transition-colors">+ Add member</span>
            </div>
          </div>
        </div>
      </div>

      {/* Network */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-text">Network</h3>
          <span className="text-xs text-text-tertiary">0 members</span>
        </div>
        <div className="border border-border rounded-lg p-6 bg-bg-subtle">
          <div className="grid grid-cols-3 gap-3">
            <div className="border border-dashed border-border-dashed rounded-lg p-4 flex flex-col items-center justify-center min-h-[100px] cursor-pointer hover:border-accent hover:bg-accent-light transition-colors group">
              <svg className="h-5 w-5 text-text-tertiary group-hover:text-accent mb-1.5 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="text-xs font-medium text-text-tertiary group-hover:text-accent transition-colors">+ Add member</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
