'use client'

import { useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { v4 } from 'uuid'
import { AnimatePresence, motion } from 'framer-motion'
import { useEditorStore } from '@/lib/store/editor-store'
import { useAIStore } from '@/lib/store/ai-store'
import { SECTIONS } from '@/lib/theme'
import type { SectionId } from '@/lib/theme'
import type { DeckSections, Criterion, SearchProfileSection } from '@/lib/types'
import TopBar from '@/components/layout/TopBar'
import Sidebar from '@/components/layout/Sidebar'
import SectionHeader from '@/components/editor/SectionHeader'
import LoadingDots from '@/components/ui/LoadingDots'
import AIPanel from '@/components/ai/AIPanel'
import AIChatTrigger from '@/components/ai/AIChatTrigger'
import CommandPalette from '@/components/ui/CommandPalette'
import { useGlobalShortcuts } from '@/lib/hooks/useGlobalShortcuts'

// Section editors
import CoverEditor from '@/components/editor/sections/CoverEditor'
import TeamEditor from '@/components/editor/sections/TeamEditor'
import SearchProfileEditor from '@/components/editor/sections/SearchProfileEditor'
import SalaryEditor from '@/components/editor/sections/SalaryEditor'
import CredentialsEditor from '@/components/editor/sections/CredentialsEditor'
import TimelineEditor from '@/components/editor/sections/TimelineEditor'
import AssessmentEditor from '@/components/editor/sections/AssessmentEditor'
import PersonasEditor from '@/components/editor/sections/PersonasEditor'
import ScorecardEditor from '@/components/editor/sections/ScorecardEditor'
import CandidatesEditor from '@/components/editor/sections/CandidatesEditor'
import FeeEditor from '@/components/editor/sections/FeeEditor'

// Map section IDs to their editor components
const SECTION_EDITORS: Record<SectionId, React.ComponentType<{ data: DeckSections[keyof DeckSections]; onChange: (data: DeckSections[keyof DeckSections]) => void }>> = {
  cover: CoverEditor as React.ComponentType<{ data: DeckSections[keyof DeckSections]; onChange: (data: DeckSections[keyof DeckSections]) => void }>,
  team: TeamEditor as React.ComponentType<{ data: DeckSections[keyof DeckSections]; onChange: (data: DeckSections[keyof DeckSections]) => void }>,
  searchProfile: SearchProfileEditor as React.ComponentType<{ data: DeckSections[keyof DeckSections]; onChange: (data: DeckSections[keyof DeckSections]) => void }>,
  salary: SalaryEditor as React.ComponentType<{ data: DeckSections[keyof DeckSections]; onChange: (data: DeckSections[keyof DeckSections]) => void }>,
  credentials: CredentialsEditor as React.ComponentType<{ data: DeckSections[keyof DeckSections]; onChange: (data: DeckSections[keyof DeckSections]) => void }>,
  timeline: TimelineEditor as React.ComponentType<{ data: DeckSections[keyof DeckSections]; onChange: (data: DeckSections[keyof DeckSections]) => void }>,
  assessment: AssessmentEditor as React.ComponentType<{ data: DeckSections[keyof DeckSections]; onChange: (data: DeckSections[keyof DeckSections]) => void }>,
  personas: PersonasEditor as React.ComponentType<{ data: DeckSections[keyof DeckSections]; onChange: (data: DeckSections[keyof DeckSections]) => void }>,
  scorecard: ScorecardEditor as React.ComponentType<{ data: DeckSections[keyof DeckSections]; onChange: (data: DeckSections[keyof DeckSections]) => void }>,
  candidates: CandidatesEditor as React.ComponentType<{ data: DeckSections[keyof DeckSections]; onChange: (data: DeckSections[keyof DeckSections]) => void }>,
  fee: FeeEditor as React.ComponentType<{ data: DeckSections[keyof DeckSections]; onChange: (data: DeckSections[keyof DeckSections]) => void }>,
}

// Cover is always part of the deck — it becomes the hero/header. Every other
// section can be toggled off, in which case the editor body is hidden and the
// section is skipped in preview + publish.
const TOGGLEABLE_SECTIONS = new Set<SectionId>([
  'team',
  'searchProfile',
  'salary',
  'credentials',
  'timeline',
  'assessment',
  'personas',
  'scorecard',
  'candidates',
  'fee',
])

function isSectionEnabled(
  sectionId: SectionId,
  section: DeckSections[keyof DeckSections],
): boolean {
  if (!TOGGLEABLE_SECTIONS.has(sectionId)) return true
  return (section as { enabled?: boolean }).enabled !== false
}

export default function DeckEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()

  const {
    deck,
    isLoading,
    error,
    activeSection,
    saveStatus,
    setDeck,
    setActiveSection,
    updateSection,
    setLoading,
    setError,
    setLocale,
    getSectionStatus,
    getCompletedCount,
  } = useEditorStore()

  const initChat = useAIStore((s) => s.initChat)
  const addSectionDivider = useAIStore((s) => s.addSectionDivider)
  const persistChat = useAIStore((s) => s.persistChat)
  const loadDocuments = useAIStore((s) => s.loadDocuments)

  // Fetch deck on mount
  useEffect(() => {
    async function loadDeck() {
      setLoading(true)
      try {
        const response = await fetch(`/api/deck/${id}`)
        if (!response.ok) throw new Error('Deck not found')
        const data = await response.json()
        setDeck(data.deck)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load deck')
      } finally {
        setLoading(false)
      }
    }

    loadDeck()
  }, [id, setDeck, setLoading, setError])

  // Initialize chat and load documents when deck loads
  useEffect(() => {
    if (deck) {
      initChat(id)
      loadDocuments(id)
    }
  }, [deck, id, initChat, loadDocuments])

  // Add section divider to chat when switching sections
  useEffect(() => {
    addSectionDivider(activeSection as SectionId)
  }, [activeSection, addSectionDivider])

  // Persist chat on unmount
  useEffect(() => {
    return () => {
      persistChat()
    }
  }, [persistChat])

  // Auto-apply AI personality profile to searchProfile section
  const toolsPersonalityProfile = useAIStore((s) => s.toolsPersonalityProfile)
  useEffect(() => {
    if (!deck || activeSection !== 'searchProfile' || !toolsPersonalityProfile) return
    const current = deck.sections.searchProfile.personalityProfile
    // Only auto-fill if the current profile is empty
    if (current.intro || current.traits.length > 0) return
    updateSection('searchProfile', {
      personalityProfile: toolsPersonalityProfile,
    })
  }, [toolsPersonalityProfile]) // eslint-disable-line react-hooks/exhaustive-deps

  // Global keyboard shortcuts: ⌘K palette, ⌘J AI panel
  const { paletteOpen, closePalette } = useGlobalShortcuts()

  // Resolve section labels in the deck's language
  const locale = deck?.locale ?? 'nl'

  // Build sidebar section data
  const sidebarSections = SECTIONS.map((section) => ({
    id: section.id,
    label: section.label[locale],
    status: getSectionStatus(section.id),
  }))

  // Get active section metadata
  const activeSectionMeta = SECTIONS.find((s) => s.id === activeSection)
  const ActiveEditor = SECTION_EDITORS[activeSection]
  const completedCount = getCompletedCount()

  // Title change handler
  function handleTitleChange(newTitle: string) {
    if (!deck) return
    const parts = newTitle.split(' — ')
    if (parts.length === 2) {
      updateSection('cover', { clientName: parts[0].trim(), roleTitle: parts[1].trim() })
    }
  }

  // Section data change handler
  function handleSectionChange(data: DeckSections[keyof DeckSections]) {
    updateSection(activeSection as keyof DeckSections, data as Partial<DeckSections[keyof DeckSections]>)
  }

  // AI Tools accept handler — adds accepted suggestion to current section data
  const handleToolsAccept = useCallback((id: string) => {
    if (!deck) return
    const suggestion = useAIStore.getState().toolsSuggestions.find((s) => s.id === id)
    if (!suggestion) return

    if (activeSection === 'searchProfile') {
      const section = deck.sections.searchProfile
      const criterion: Criterion = { id: v4(), text: suggestion.text, weight: suggestion.weight }
      const column = suggestion.category === 'mustHave' ? 'mustHaves' : 'niceToHaves'
      updateSection('searchProfile', { [column]: [...section[column], criterion] })
    }
  }, [deck, activeSection, updateSection])

  const handleToolsAcceptAll = useCallback(() => {
    if (!deck) return
    const pending = useAIStore.getState().toolsSuggestions.filter((s) => s.status === 'pending')
    if (pending.length === 0) return

    if (activeSection === 'searchProfile') {
      const section = deck.sections.searchProfile
      const newMustHaves = [...section.mustHaves]
      const newNiceToHaves = [...section.niceToHaves]

      for (const suggestion of pending) {
        const criterion: Criterion = { id: v4(), text: suggestion.text, weight: suggestion.weight }
        if (suggestion.category === 'mustHave') {
          newMustHaves.push(criterion)
        } else {
          newNiceToHaves.push(criterion)
        }
      }

      updateSection('searchProfile', { mustHaves: newMustHaves, niceToHaves: newNiceToHaves })
    }
  }, [deck, activeSection, updateSection])

  // AI context for tools mode
  const aiContext = {
    sectionType: activeSection,
    clientName: deck?.sections.cover.clientName ?? '',
    roleTitle: deck?.sections.cover.roleTitle ?? '',
    existingData: deck ? deck.sections[activeSection as keyof DeckSections] : undefined,
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="text-center">
          <LoadingDots />
          <p className="mt-4 text-sm text-text-secondary">Loading deck...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !deck) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="max-w-sm rounded-lg bg-bg p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-text">Could not load deck</p>
          <p className="mt-2 text-sm text-text-secondary">{error || 'Deck not found'}</p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="rounded-md px-4 py-2 text-sm text-text-secondary hover:bg-bg-hover hover:text-text"
            >
              Back to dashboard
            </button>
            <button
              onClick={() => window.location.reload()}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    )
  }

  const deckTitle = `${deck.clientName} — ${deck.roleTitle}`

  return (
    <div className="flex h-screen flex-col bg-bg">
      {/* Top bar */}
      <TopBar
        deckTitle={deckTitle}
        onTitleChange={handleTitleChange}
        completedSections={completedCount}
        totalSections={SECTIONS.length}
        saveStatus={saveStatus}
        locale={deck.locale}
        onLocaleChange={setLocale}
        onBack={() => router.push('/')}
      />

      {/* Main layout: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          deckName={deck.clientName}
          roleTitle={deck.roleTitle}
          sections={sidebarSections}
          activeSection={activeSection}
          onSectionClick={(sectionId) => setActiveSection(sectionId as SectionId)}
          onPreview={() => router.push(`/deck/${id}/preview`)}
        />

        {/* Content area */}
        <main className="flex-1 overflow-y-auto bg-bg-subtle">
          <div className="mx-auto max-w-5xl px-10 py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              >
                {/* Section header */}
                {activeSectionMeta && (
                  <SectionHeader
                    number={activeSectionMeta.order}
                    title={activeSectionMeta.label[locale]}
                    description={activeSectionMeta.description[locale]}
                    enabled={
                      TOGGLEABLE_SECTIONS.has(activeSection)
                        ? isSectionEnabled(
                            activeSection,
                            deck.sections[activeSection as keyof DeckSections],
                          )
                        : undefined
                    }
                    onToggleEnabled={
                      TOGGLEABLE_SECTIONS.has(activeSection)
                        ? (next) =>
                            updateSection(
                              activeSection as keyof DeckSections,
                              { enabled: next } as Partial<
                                DeckSections[keyof DeckSections]
                              >,
                            )
                        : undefined
                    }
                  />
                )}

                {/* Section editor — hidden when section is excluded */}
                {isSectionEnabled(
                  activeSection,
                  deck.sections[activeSection as keyof DeckSections],
                ) ? (
                  <ActiveEditor
                    data={deck.sections[activeSection as keyof DeckSections]}
                    onChange={handleSectionChange}
                  />
                ) : (
                  <ExcludedSectionNotice />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* AI Panel — outside AnimatePresence, persists across section switches */}
      <AIPanel
        context={aiContext}
        onToolsAccept={handleToolsAccept}
        onToolsAcceptAll={handleToolsAcceptAll}
      />

      {/* Floating trigger */}
      <AIChatTrigger />

      {/* Command palette — ⌘K */}
      <CommandPalette open={paletteOpen} onClose={closePalette} deckId={id} />
    </div>
  )
}

// Muted card shown in place of the editor body when a section is excluded.
// Keeps the toggle in the header as the single affordance to re-include.
function ExcludedSectionNotice() {
  return (
    <div className="rounded-lg border border-dashed border-border bg-bg-subtle px-5 py-4 text-sm text-text-tertiary">
      This section is excluded — it won&apos;t appear in the preview or the
      published deck. Flip the switch above to include it again.
    </div>
  )
}
