'use client'

// ---------------------------------------------------------------------------
// Sidebar — Fixed left navigation panel (~240px)
// v8 prototype: "TOP OF MINDS" label, deck info with initial circle,
// numbered section list with status indicators, Preview button at bottom,
// "Quick nav Cmd+K" hint.
// ---------------------------------------------------------------------------

import { motion } from 'framer-motion'
import type { SectionStatus } from '@/lib/types'
import { editorBrand } from '@/config/brand'
import ProgressBar from './ProgressBar'

interface SidebarSection {
  id: string
  label: string
  status: SectionStatus
}

interface SidebarProps {
  deckName: string
  roleTitle: string
  sections: SidebarSection[]
  activeSection: string
  onSectionClick: (sectionId: string) => void
  onPreview?: () => void
}

function StatusIndicator({ status }: { status: SectionStatus }) {
  switch (status) {
    case 'complete':
      return (
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          className="shrink-0 text-success"
        >
          <path
            d="M5 8L7 10L11 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'in-progress':
      return (
        <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        </span>
      )
    case 'empty':
    default:
      return <span className="h-3.5 w-3.5 shrink-0" />
  }
}

export default function Sidebar({
  deckName,
  roleTitle,
  sections,
  activeSection,
  onSectionClick,
  onPreview,
}: SidebarProps) {
  const completedCount = sections.filter((s) => s.status === 'complete').length
  const totalCount = sections.length
  const initial = (deckName || 'U').charAt(0).toUpperCase()

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-bg">
      {/* Brand label */}
      <div className="px-5 pt-5 pb-3">
        <span className="text-[10px] font-bold uppercase tracking-[2.5px] text-text-secondary">
          {editorBrand.name}
        </span>
      </div>

      {/* Deck identity card */}
      <div className="border-b border-border px-5 pb-4">
        <div className="flex items-center gap-3">
          {/* Initial circle */}
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-semibold text-text">
              {deckName || 'Untitled Deck'}
            </h2>
            <p className="truncate text-xs text-text-secondary">
              {roleTitle || 'No role specified'}
            </p>
          </div>
        </div>
        {/* Progress */}
        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs text-text-secondary">Progress</span>
            <span className="text-xs font-medium text-text">
              {completedCount}/{totalCount}
            </span>
          </div>
          <ProgressBar completed={completedCount} total={totalCount} />
        </div>
      </div>

      {/* Section navigation */}
      <nav className="flex-1 overflow-y-auto py-2" aria-label="Deck sections">
        <ul className="flex flex-col gap-0.5 px-2">
          {sections.map((section, index) => {
            const isActive = section.id === activeSection

            return (
              <li key={section.id}>
                <button
                  onClick={() => onSectionClick(section.id)}
                  className={`group flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${
                    isActive
                      ? 'bg-bg-active font-semibold text-accent'
                      : 'text-text hover:bg-bg-hover'
                  }`}
                  aria-current={isActive ? 'true' : undefined}
                >
                  {/* Section number badge */}
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-medium ${
                      isActive
                        ? 'bg-accent text-white'
                        : 'bg-bg-muted text-text-secondary'
                    }`}
                  >
                    {index + 1}
                  </span>

                  {/* Section label */}
                  <span className="min-w-0 flex-1 truncate">{section.label}</span>

                  {/* Status indicator */}
                  <StatusIndicator status={section.status} />
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-border px-4 py-4">
        {onPreview && (
          <button
            onClick={onPreview}
            className="w-full rounded-lg bg-text py-2.5 text-sm font-medium text-white transition-colors hover:bg-text/90 active:bg-text/80"
          >
            Preview
          </button>
        )}
        <p className="mt-3 text-center text-[11px] text-text-tertiary">
          Quick nav{' '}
          <kbd className="rounded border border-border-subtle bg-bg-muted px-1 py-0.5 text-[10px] font-medium text-text-secondary">
            ⌘K
          </kbd>
        </p>
      </div>
    </aside>
  )
}
