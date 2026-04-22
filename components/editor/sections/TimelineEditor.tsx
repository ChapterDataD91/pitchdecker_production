'use client'

import { useState, useRef } from 'react'
import { v4 as uuid } from 'uuid'
import { motion, AnimatePresence } from 'framer-motion'
import type { TimelineSection, TimelinePhase } from '@/lib/types'
import { useEditorStore } from '@/lib/store/editor-store'
import { useAIStore } from '@/lib/store/ai-store'
import LoadingDots from '@/components/ui/LoadingDots'

interface TimelineEditorProps {
  data: TimelineSection
  onChange: (data: TimelineSection) => void
}

// ---------------------------------------------------------------------------
// 12-week template
// ---------------------------------------------------------------------------

const DEFAULT_PHASES: Omit<TimelinePhase, 'id'>[] = [
  {
    name: 'Intake & Market Scan',
    description: 'In-depth intake with key stakeholders. Together with you, we interview a selection of stakeholders — this sharpens the search profile and deepens our understanding of the culture and leadership needs. Market mapping: 30-60 candidates across target sectors.',
    durationWeeks: 2,
    milestones: ['Stakeholder interviews completed', 'Search profile finalized', 'Market map delivered'],
    order: 0,
  },
  {
    name: 'Approach & First Interviews',
    description: 'Confidential candidate approach. First-round selection interviews by the search team. Progress update with market response data and initial candidate impressions.',
    durationWeeks: 4,
    milestones: ['Candidates approached', 'First-round interviews conducted', 'Progress update delivered'],
    order: 1,
  },
  {
    name: 'Longlist & Deep Dive',
    description: 'Longlist presentation (8-10 candidates). Shortlist selection (3-4) in consultation with the client.',
    durationWeeks: 2,
    milestones: ['Longlist presented', 'Shortlist selected'],
    order: 2,
  },
  {
    name: 'Shortlist Interviews',
    description: 'Shortlisted candidates meet the client and key stakeholders. Structured debriefing after each round.',
    durationWeeks: 2,
    milestones: ['Client interviews conducted', 'Debriefing sessions completed'],
    order: 3,
  },
  {
    name: 'Assessment & References',
    description: 'Leadership assessment (e.g., Hogan) for 2 finalists. Reference checks (3-4 per candidate). Advisory report.',
    durationWeeks: 1,
    milestones: ['Assessments completed', 'Reference checks done', 'Advisory report delivered'],
    order: 4,
  },
  {
    name: 'Appointment & Transition',
    description: 'Employment terms negotiation. Transition planning. Onboarding advisory.',
    durationWeeks: 1,
    milestones: ['Terms agreed', 'Transition plan in place'],
    order: 5,
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeTotalWeeks(phases: TimelinePhase[]): number {
  return phases.reduce((sum, p) => sum + p.durationWeeks, 0)
}

function getWeekRange(phases: TimelinePhase[], index: number): string {
  let start = 1
  for (let i = 0; i < index; i++) {
    start += phases[i].durationWeeks
  }
  const end = start + phases[index].durationWeeks - 1
  return start === end ? `Week ${start}` : `Weeks ${start}–${end}`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TimelineEditor({ data, onChange }: TimelineEditorProps) {
  const deck = useEditorStore((s) => s.deck)
  const deckDocuments = useAIStore((s) => s.deckDocuments)
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [suggestError, setSuggestError] = useState<string | null>(null)

  // Snapshot of phases before template/AI was applied — enables undo
  const previousPhasesRef = useRef<TimelinePhase[] | null>(null)
  // Tracks what action produced the current phases (for the undo label)
  const [appliedAction, setAppliedAction] = useState<'template' | 'ai' | null>(null)

  const phases = [...data.phases].sort((a, b) => a.order - b.order)
  const totalWeeks = computeTotalWeeks(phases)
  const hasPhases = phases.length > 0

  // -- Mutations ----------------------------------------------------------

  function updatePhases(newPhases: TimelinePhase[]) {
    onChange({ phases: newPhases, totalWeeks: computeTotalWeeks(newPhases) })
  }

  function clearUndo() {
    previousPhasesRef.current = null
    setAppliedAction(null)
  }

  function updatePhase(id: string, patch: Partial<TimelinePhase>) {
    clearUndo()
    updatePhases(phases.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  function deletePhase(id: string) {
    clearUndo()
    const filtered = phases.filter((p) => p.id !== id)
    updatePhases(filtered.map((p, i) => ({ ...p, order: i })))
  }

  function addPhase() {
    clearUndo()
    const newPhase: TimelinePhase = {
      id: uuid(),
      name: 'New Phase',
      description: '',
      durationWeeks: 1,
      milestones: [],
      order: phases.length,
    }
    updatePhases([...phases, newPhase])
  }

  function movePhase(index: number, direction: -1 | 1) {
    clearUndo()
    const target = index + direction
    if (target < 0 || target >= phases.length) return
    const reordered = [...phases]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(target, 0, moved)
    updatePhases(reordered.map((p, i) => ({ ...p, order: i })))
  }

  function applyTemplate() {
    previousPhasesRef.current = phases
    const templatePhases: TimelinePhase[] = DEFAULT_PHASES.map((p) => ({
      ...p,
      id: uuid(),
    }))
    setAppliedAction('template')
    updatePhases(templatePhases)
  }

  function undoApply() {
    if (!previousPhasesRef.current) return
    updatePhases(previousPhasesRef.current)
    previousPhasesRef.current = null
    setAppliedAction(null)
  }

  // -- Milestone mutations ------------------------------------------------

  function addMilestone(phaseId: string) {
    const phase = phases.find((p) => p.id === phaseId)
    if (!phase) return
    updatePhase(phaseId, { milestones: [...phase.milestones, ''] })
  }

  function updateMilestone(phaseId: string, mIndex: number, value: string) {
    const phase = phases.find((p) => p.id === phaseId)
    if (!phase) return
    const milestones = [...phase.milestones]
    milestones[mIndex] = value
    updatePhase(phaseId, { milestones })
  }

  function removeMilestone(phaseId: string, mIndex: number) {
    const phase = phases.find((p) => p.id === phaseId)
    if (!phase) return
    updatePhase(phaseId, { milestones: phase.milestones.filter((_, i) => i !== mIndex) })
  }

  // -- AI suggest ---------------------------------------------------------

  async function handleSuggestPhases() {
    if (!deck) return
    setSuggestLoading(true)
    setSuggestError(null)

    try {
      const cover = deck.sections.cover
      const res = await fetch('/api/ai/timeline/suggest-phases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deckContext: {
            clientName: cover.clientName || deck.clientName,
            roleTitle: cover.roleTitle || deck.roleTitle,
            coverIntro: cover.introParagraph || undefined,
            uploadedDocuments: deckDocuments.map((d) => ({
              fileName: d.fileName,
              extractedText: d.extractedText,
            })),
          },
          locale: deck.locale,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to suggest phases')
      }

      interface DraftPhase {
        name: string
        description: string
        durationWeeks: number
        milestones: string[]
      }

      const result = (await res.json()) as { phases: DraftPhase[] }
      previousPhasesRef.current = phases
      const newPhases: TimelinePhase[] = result.phases.map((draft, i) => ({
        id: uuid(),
        name: draft.name,
        description: draft.description,
        durationWeeks: draft.durationWeeks,
        milestones: draft.milestones || [],
        order: i,
      }))
      setAppliedAction('ai')
      updatePhases(newPhases)
    } catch (err) {
      setSuggestError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSuggestLoading(false)
    }
  }

  // -- Render -------------------------------------------------------------

  return (
    <div className="space-y-4">
      {/* Template + AI suggest buttons (shown when empty OR as secondary actions) */}
      {!hasPhases && (
        <div className="space-y-3">
          {/* 12-week template button */}
          <button
            type="button"
            onClick={applyTemplate}
            className="w-full border border-border rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-accent-light hover:border-accent transition-colors group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-light">
                <svg className="h-4.5 w-4.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-text">Start from 12-week template</p>
                <p className="text-xs text-text-secondary">Pre-configured phases: intake, sourcing, longlist, interviews, assessment, appointment</p>
              </div>
            </div>
            <svg className="h-5 w-5 text-text-tertiary group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          {/* AI suggest button */}
          <button
            type="button"
            onClick={handleSuggestPhases}
            disabled={suggestLoading}
            className="w-full border border-border rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-accent-light hover:border-accent transition-colors group text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-light">
                <svg className="h-4.5 w-4.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
              </div>
              <div>
                {suggestLoading ? (
                  <div className="flex items-center gap-2">
                    <LoadingDots />
                    <p className="text-sm font-semibold text-text">Generating timeline...</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-text">Suggest timeline with AI</p>
                    <p className="text-xs text-text-secondary">Generate a tailored timeline based on the role and client</p>
                  </>
                )}
              </div>
            </div>
            {!suggestLoading && (
              <svg className="h-5 w-5 text-text-tertiary group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Error message */}
      {suggestError && (
        <p className="text-xs text-red-600 px-1">{suggestError}</p>
      )}

      {/* Undo banner — shown after template or AI apply */}
      {hasPhases && appliedAction && previousPhasesRef.current && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-center justify-between rounded-lg border border-accent/20 bg-accent-light px-4 py-2.5"
        >
          <span className="text-xs text-text-secondary">
            {appliedAction === 'template' ? '12-week template applied' : 'AI-generated timeline applied'}
          </span>
          <button
            type="button"
            onClick={undoApply}
            className="text-xs font-medium text-accent hover:text-accent-hover transition-colors"
          >
            Undo
          </button>
        </motion.div>
      )}

      {/* Timeline track with phases */}
      {hasPhases && (
        <div className="border border-border rounded-lg p-6 bg-bg-subtle">
          {/* Header */}
          <div className="flex items-center gap-2 mb-6">
            <svg className="h-4 w-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Timeline</span>
            <span className="text-xs text-text-tertiary ml-auto">{totalWeeks} weeks total</span>
          </div>

          {/* Week progress bar */}
          <div className="relative h-2 w-full bg-border rounded-full mb-8 overflow-hidden">
            <div className="flex h-full">
              {phases.map((phase, i) => {
                const widthPercent = totalWeeks > 0 ? (phase.durationWeeks / totalWeeks) * 100 : 0
                return (
                  <div
                    key={phase.id}
                    className="h-full first:rounded-l-full last:rounded-r-full"
                    style={{
                      width: `${widthPercent}%`,
                      backgroundColor: `hsl(${220 + i * 30}, 60%, ${55 + i * 5}%)`,
                    }}
                  />
                )
              })}
            </div>
          </div>

          {/* Phase list */}
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-[17px] top-4 bottom-4 w-px bg-border" />

            <AnimatePresence initial={false}>
              {phases.map((phase, index) => (
                <motion.div
                  key={phase.id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="relative flex gap-4 mb-6 last:mb-0 group"
                >
                  {/* Phase number circle */}
                  <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-white text-sm font-semibold">
                    {index + 1}
                  </div>

                  {/* Phase content */}
                  <div className="flex-1 border border-border rounded-lg bg-white p-4 hover:border-accent/30 transition-colors">
                    {/* Phase header */}
                    <div className="flex items-start gap-3 mb-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={phase.name}
                          onChange={(e) => updatePhase(phase.id, { name: e.target.value })}
                          className="text-sm font-semibold text-text bg-transparent w-full outline-none border-b border-transparent focus:border-accent transition-colors"
                          placeholder="Phase name"
                        />
                        <span className="text-xs text-text-tertiary mt-0.5 block">
                          {getWeekRange(phases, index)}
                        </span>
                      </div>

                      {/* Duration control */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => updatePhase(phase.id, { durationWeeks: Math.max(1, phase.durationWeeks - 1) })}
                          className="h-6 w-6 rounded flex items-center justify-center text-text-tertiary hover:text-accent hover:bg-accent-light transition-colors"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                          </svg>
                        </button>
                        <span className="text-xs font-medium text-text-secondary tabular-nums min-w-[2.5rem] text-center">
                          {phase.durationWeeks}w
                        </span>
                        <button
                          type="button"
                          onClick={() => updatePhase(phase.id, { durationWeeks: Math.min(12, phase.durationWeeks + 1) })}
                          className="h-6 w-6 rounded flex items-center justify-center text-text-tertiary hover:text-accent hover:bg-accent-light transition-colors"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                        </button>
                      </div>

                      {/* Reorder + delete */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => movePhase(index, -1)}
                          disabled={index === 0}
                          className="h-6 w-6 rounded flex items-center justify-center text-text-tertiary hover:text-accent hover:bg-accent-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => movePhase(index, 1)}
                          disabled={index === phases.length - 1}
                          className="h-6 w-6 rounded flex items-center justify-center text-text-tertiary hover:text-accent hover:bg-accent-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => deletePhase(phase.id)}
                          className="h-6 w-6 rounded flex items-center justify-center text-text-tertiary hover:text-red-500 hover:bg-red-50 transition-colors ml-1"
                          title="Delete phase"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    <textarea
                      value={phase.description}
                      onChange={(e) => updatePhase(phase.id, { description: e.target.value })}
                      rows={2}
                      className="w-full text-sm text-text-secondary bg-transparent outline-none resize-none border-b border-transparent focus:border-accent/30 transition-colors"
                      placeholder="Describe what happens in this phase..."
                    />

                    {/* Milestones */}
                    {phase.milestones.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-wide">Milestones</span>
                        {phase.milestones.map((milestone, mIndex) => (
                          <div key={mIndex} className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-accent/40 shrink-0" />
                            <input
                              type="text"
                              value={milestone}
                              onChange={(e) => updateMilestone(phase.id, mIndex, e.target.value)}
                              className="flex-1 text-xs text-text-secondary bg-transparent outline-none border-b border-transparent focus:border-accent/30 transition-colors"
                              placeholder="Milestone..."
                            />
                            <button
                              type="button"
                              onClick={() => removeMilestone(phase.id, mIndex)}
                              className="h-5 w-5 rounded flex items-center justify-center text-text-tertiary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add milestone button */}
                    <button
                      type="button"
                      onClick={() => addMilestone(phase.id)}
                      className="mt-2 text-[11px] text-text-tertiary hover:text-accent transition-colors"
                    >
                      + Add milestone
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Add phase + secondary actions */}
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={addPhase}
              className="flex-1 rounded-md border border-dashed border-border-dashed py-2.5 text-sm font-medium text-text-tertiary hover:text-accent hover:border-accent hover:bg-accent-light transition-colors"
            >
              + Add phase
            </button>
            <button
              type="button"
              onClick={handleSuggestPhases}
              disabled={suggestLoading}
              className="rounded-md border border-border px-3 py-2 text-xs font-medium text-text-secondary hover:text-accent hover:border-accent hover:bg-accent-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
            >
              {suggestLoading ? (
                <>
                  <LoadingDots />
                  <span>Suggesting...</span>
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  <span>Re-suggest with AI</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={applyTemplate}
              className="rounded-md border border-border px-3 py-2 text-xs font-medium text-text-secondary hover:text-accent hover:border-accent hover:bg-accent-light transition-colors"
            >
              Apply template
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
