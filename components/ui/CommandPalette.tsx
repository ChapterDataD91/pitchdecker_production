'use client'

// ---------------------------------------------------------------------------
// Command palette — Cmd/Ctrl+K. Modal overlay, search + keyboard nav.
// v1 scope: section navigation + a small set of deterministic deck actions.
// AI actions are intentionally NOT here — the AI panel (Cmd+J) is the single
// AI surface until usage data shows which prompts deserve palette shortcuts.
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { SECTIONS, type SectionId } from '@/lib/theme'
import { useEditorStore } from '@/lib/store/editor-store'
import { useAIStore } from '@/lib/store/ai-store'

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  deckId: string
}

type CommandGroup = 'Sections' | 'Deck' | 'AI'

interface Command {
  id: string
  label: string
  hint?: string
  group: CommandGroup
  icon: React.ReactNode
  run: () => void
}

export default function CommandPalette({
  open,
  onClose,
  deckId,
}: CommandPaletteProps) {
  // Inner content mounts only while open, so query/highlight state resets
  // naturally between summons (no setState-in-effect needed for resetting).
  return (
    <AnimatePresence>
      {open && <PaletteContent onClose={onClose} deckId={deckId} />}
    </AnimatePresence>
  )
}

function PaletteContent({
  onClose,
  deckId,
}: {
  onClose: () => void
  deckId: string
}) {
  const router = useRouter()
  const setActiveSection = useEditorStore((s) => s.setActiveSection)
  const activeSection = useEditorStore((s) => s.activeSection)
  const locale = useEditorStore((s) => s.deck?.locale ?? 'nl')

  const [query, setQuery] = useState('')
  const [highlightIndex, setHighlightIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const listRef = useRef<HTMLUListElement | null>(null)

  const commands: Command[] = useMemo(() => {
    const goToPrefix = locale === 'nl' ? 'Naar' : 'Go to'
    const sectionCommands: Command[] = SECTIONS.map((section) => ({
      id: `section:${section.id}`,
      label: `${goToPrefix} ${section.label[locale]}`,
      hint: section.description[locale],
      group: 'Sections',
      icon: <SectionGlyph order={section.order} />,
      run: () => {
        setActiveSection(section.id as SectionId)
        onClose()
      },
    }))

    const deckCommands: Command[] = [
      {
        id: 'deck:preview',
        label: 'Open preview',
        hint: 'See the published-style deck',
        group: 'Deck',
        icon: <PreviewIcon />,
        run: () => {
          router.push(`/deck/${deckId}/preview`)
          onClose()
        },
      },
      {
        id: 'deck:dashboard',
        label: 'Back to dashboard',
        hint: 'All decks',
        group: 'Deck',
        icon: <DashboardIcon />,
        run: () => {
          router.push('/')
          onClose()
        },
      },
    ]

    const aiCommands: Command[] = [
      {
        id: 'ai:open',
        label: 'Open AI assistant',
        hint: '⌘J',
        group: 'AI',
        icon: <SparkIcon />,
        run: () => {
          useAIStore.getState().openPanel()
          onClose()
        },
      },
    ]

    return [...sectionCommands, ...deckCommands, ...aiCommands]
  }, [deckId, router, setActiveSection, onClose, locale])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      // No query: keep all, but float current section to the bottom (no-op nav)
      return commands.filter((c) => c.id !== `section:${activeSection}`)
    }
    return commands.filter((c) => {
      const haystack = `${c.label} ${c.hint ?? ''}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [commands, query, activeSection])

  // Group commands in render order, preserving filtered order within each
  const grouped = useMemo(() => {
    const groups: { group: CommandGroup; items: Command[] }[] = []
    for (const cmd of filtered) {
      const last = groups[groups.length - 1]
      if (last && last.group === cmd.group) last.items.push(cmd)
      else groups.push({ group: cmd.group, items: [cmd] })
    }
    return groups
  }, [filtered])

  // Derive a clamped index during render — avoids setState-in-effect when the
  // filter shrinks below the current highlight.
  const safeIndex =
    filtered.length === 0 ? 0 : Math.min(highlightIndex, filtered.length - 1)

  // Autofocus the input once on mount (component only mounts while open)
  useEffect(() => {
    const t = window.setTimeout(() => inputRef.current?.focus(), 60)
    return () => window.clearTimeout(t)
  }, [])

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightIndex(Math.min(filtered.length - 1, safeIndex + 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightIndex(Math.max(0, safeIndex - 1))
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        const cmd = filtered[safeIndex]
        if (cmd) cmd.run()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [filtered, safeIndex, onClose])

  // Keep highlighted item visible when navigating — skip the initial mount so
  // the autofocus/scroll on the input doesn't fight us for scroll position.
  const didMountRef = useRef(false)
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true
      return
    }
    const node = listRef.current?.querySelector<HTMLElement>(
      `[data-cmd-index="${safeIndex}"]`,
    )
    node?.scrollIntoView({ block: 'nearest' })
  }, [safeIndex])

  return (
    <motion.div
      key="cmdk-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/20 px-4 pt-[18vh]"
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        initial={{ opacity: 0, scale: 0.97, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: -4 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-[0_20px_25px_-5px_rgba(0,0,0,0.15),0_8px_10px_-6px_rgba(0,0,0,0.08)] ring-1 ring-border-subtle"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search */}
        <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3">
          <SearchIcon />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setHighlightIndex(0)
            }}
            placeholder="Jump to a section, open preview…"
            className="flex-1 bg-transparent text-sm text-text placeholder:text-text-tertiary outline-none focus:outline-none focus-visible:outline-none"
            aria-label="Search commands"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="rounded border border-border-subtle bg-bg-muted px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">
            Esc
          </kbd>
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-text-tertiary">
            No commands match &ldquo;{query}&rdquo;
          </div>
        ) : (
          <ul
            ref={listRef}
            className="max-h-[55vh] overflow-y-auto py-1.5"
            role="listbox"
          >
            {grouped.map(({ group, items }, gi) => (
              <li key={group}>
                <div
                  className={`px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary ${
                    gi === 0 ? 'pt-2' : 'pt-3'
                  }`}
                >
                  {group}
                </div>
                <ul className="px-1.5">
                  {items.map((cmd) => {
                    const flatIndex = filtered.indexOf(cmd)
                    const isActive = flatIndex === safeIndex
                    return (
                      <li key={cmd.id}>
                        <button
                          type="button"
                          data-cmd-index={flatIndex}
                          onClick={cmd.run}
                          onMouseEnter={() => setHighlightIndex(flatIndex)}
                          role="option"
                          aria-selected={isActive}
                          className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors ${
                            isActive ? 'bg-bg-hover' : 'bg-transparent'
                          }`}
                        >
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                              isActive
                                ? 'bg-white text-text shadow-xs'
                                : 'bg-bg-muted text-text-secondary'
                            }`}
                          >
                            {cmd.icon}
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-sm text-text">
                              {cmd.label}
                            </span>
                            {cmd.hint && (
                              <span className="truncate text-[11px] text-text-tertiary">
                                {cmd.hint}
                              </span>
                            )}
                          </span>
                          {isActive && (
                            <kbd className="rounded border border-border-subtle bg-white px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">
                              ↵
                            </kbd>
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </li>
            ))}
          </ul>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border-subtle bg-bg-subtle px-4 py-2 text-[11px] text-text-tertiary">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border-subtle bg-white px-1.5 py-0.5 font-medium text-text-secondary">
                ↑↓
              </kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border-subtle bg-white px-1.5 py-0.5 font-medium text-text-secondary">
                ↵
              </kbd>
              select
            </span>
          </div>
          <span className="flex items-center gap-1">
            AI assistant
            <kbd className="rounded border border-border-subtle bg-white px-1.5 py-0.5 font-medium text-text-secondary">
              ⌘J
            </kbd>
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Icons — inline SVG, stroke-only to match the rest of the app
// ---------------------------------------------------------------------------

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-text-tertiary"
    >
      <circle cx="7" cy="7" r="5" />
      <path d="m14 14-3.5-3.5" />
    </svg>
  )
}

function SectionGlyph({ order }: { order: number }) {
  return (
    <span className="text-[11px] font-semibold tabular-nums">
      {order.toString().padStart(2, '0')}
    </span>
  )
}

function PreviewIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1.5 8s2.5-4.5 6.5-4.5 6.5 4.5 6.5 4.5-2.5 4.5-6.5 4.5S1.5 8 1.5 8Z" />
      <circle cx="8" cy="8" r="1.75" />
    </svg>
  )
}

function DashboardIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="9" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="9" width="5" height="5" rx="1" />
      <rect x="9" y="9" width="5" height="5" rx="1" />
    </svg>
  )
}

function SparkIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 1.5 9.25 5l3.5 1.25L9.25 7.5 8 11l-1.25-3.5L3.25 6.25 6.75 5 8 1.5Z" />
      <path d="M12.5 11l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5.5-1.5Z" />
    </svg>
  )
}
