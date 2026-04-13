'use client'

import { useRef, useState } from 'react'
import { v4 as uuid } from 'uuid'
import { motion, AnimatePresence } from 'framer-motion'
import type { ScorecardSection, ScorecardCriterion, Weight } from '@/lib/types'
import { useEditorStore } from '@/lib/store/editor-store'
import LoadingDots from '@/components/ui/LoadingDots'

interface ScorecardEditorProps {
  data: ScorecardSection
  onChange: (data: ScorecardSection) => void
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

type CategoryKey = 'mustHaves' | 'niceToHaves' | 'leadership' | 'successFactors'

const CATEGORIES: { key: CategoryKey; title: string; color: string }[] = [
  { key: 'mustHaves', title: 'Must-Haves', color: 'bg-error-light text-error' },
  { key: 'niceToHaves', title: 'Nice-to-Haves', color: 'bg-accent-light text-accent' },
  { key: 'leadership', title: 'Leadership & Personality', color: 'bg-warning-light text-warning' },
  { key: 'successFactors', title: 'First-Year Success Factors', color: 'bg-success-light text-success' },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalize(data: ScorecardSection): ScorecardSection {
  return {
    mustHaves: data.mustHaves ?? [],
    niceToHaves: data.niceToHaves ?? [],
    leadership: data.leadership ?? [],
    successFactors: data.successFactors ?? [],
  }
}

function isScorecardEmpty(data: ScorecardSection): boolean {
  return (
    data.mustHaves.length === 0 &&
    data.niceToHaves.length === 0 &&
    data.leadership.length === 0 &&
    data.successFactors.length === 0
  )
}

// ---------------------------------------------------------------------------
// Weight dots
// ---------------------------------------------------------------------------

function WeightDots({
  weight,
  onChange,
}: {
  weight: Weight
  onChange: (w: Weight) => void
}) {
  return (
    <div className="flex items-center gap-1">
      {([1, 2, 3, 4, 5] as Weight[]).map((w) => (
        <button
          key={w}
          type="button"
          onClick={() => onChange(w)}
          className={`h-2 w-2 rounded-full transition-colors ${
            w <= weight ? 'bg-accent' : 'bg-bg-muted hover:bg-border-strong'
          }`}
          aria-label={`Weight ${w}`}
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Criterion row
// ---------------------------------------------------------------------------

function CriterionRow({
  criterion,
  onUpdate,
  onRemove,
}: {
  criterion: ScorecardCriterion
  onUpdate: (c: ScorecardCriterion) => void
  onRemove: () => void
}) {
  return (
    <div className="group flex items-start gap-3 rounded-md border border-border px-3 py-2.5 transition-colors hover:border-border-strong">
      <textarea
        value={criterion.text}
        onChange={(e) => onUpdate({ ...criterion, text: e.target.value })}
        rows={1}
        className="min-w-0 flex-1 resize-none bg-transparent text-sm text-text outline-none placeholder-text-placeholder leading-relaxed"
        style={{ fieldSizing: 'content' } as React.CSSProperties}
        placeholder="Describe criterion..."
      />
      <div className="mt-1.5 shrink-0">
        <WeightDots
          weight={criterion.weight}
          onChange={(w) => onUpdate({ ...criterion, weight: w })}
        />
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="mt-0.5 shrink-0 text-text-tertiary opacity-0 transition-opacity hover:text-error group-hover:opacity-100"
        aria-label="Remove criterion"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------

export default function ScorecardEditor({
  data: rawData,
  onChange,
}: ScorecardEditorProps) {
  const data = normalize(rawData)
  const deck = useEditorStore((s) => s.deck)

  const previousRef = useRef<ScorecardSection | null>(null)
  const [appliedAction, setAppliedAction] = useState<'imported' | 'ai' | null>(null)

  const [aiLoading, setAiLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // Total criteria (for the intro line)
  const totalCount =
    data.mustHaves.length +
    data.niceToHaves.length +
    data.leadership.length +
    data.successFactors.length

  // -- Undo ---------------------------------------------------------------

  function snapshot() {
    previousRef.current = data
  }

  function clearUndo() {
    previousRef.current = null
    setAppliedAction(null)
  }

  function undoApply() {
    if (!previousRef.current) return
    onChange(previousRef.current)
    clearUndo()
  }

  // -- CRUD ---------------------------------------------------------------

  function addCriterion(key: CategoryKey) {
    clearUndo()
    const newCriterion: ScorecardCriterion = { id: uuid(), text: '', weight: 3 }
    onChange({ ...data, [key]: [...data[key], newCriterion] })
  }

  function updateCriterion(key: CategoryKey, updated: ScorecardCriterion) {
    clearUndo()
    onChange({
      ...data,
      [key]: data[key].map((c) => (c.id === updated.id ? updated : c)),
    })
  }

  function removeCriterion(key: CategoryKey, id: string) {
    clearUndo()
    onChange({ ...data, [key]: data[key].filter((c) => c.id !== id) })
  }

  // -- Import from search profile ----------------------------------------

  function handleImportFromSearchProfile() {
    if (!deck) return
    const sp = deck.sections.searchProfile
    if (!sp) return

    setActionError(null)
    snapshot()
    onChange({
      ...data,
      mustHaves: sp.mustHaves.map((c) => ({
        id: uuid(),
        text: c.text,
        weight: c.weight,
      })),
      niceToHaves: sp.niceToHaves.map((c) => ({
        id: uuid(),
        text: c.text,
        weight: c.weight,
      })),
    })
    setAppliedAction('imported')
  }

  const canImport =
    (deck?.sections.searchProfile?.mustHaves?.length ?? 0) > 0 ||
    (deck?.sections.searchProfile?.niceToHaves?.length ?? 0) > 0

  // -- AI suggest (leadership + success factors) -------------------------

  async function handleSuggestAI() {
    if (!deck) return
    setAiLoading(true)
    setActionError(null)
    try {
      const { cover, searchProfile } = deck.sections
      const res = await fetch('/api/ai/scorecard/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deckContext: {
            clientName: cover.clientName || deck.clientName,
            roleTitle: cover.roleTitle || deck.roleTitle,
            coverIntro: cover.introParagraph || undefined,
            mustHaves: searchProfile.mustHaves.map((c) => c.text),
            niceToHaves: searchProfile.niceToHaves.map((c) => c.text),
            personalityIntro: searchProfile.personalityProfile.intro || undefined,
            personalityTraits: searchProfile.personalityProfile.traits,
          },
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to generate scorecard')
      }
      interface DraftResp {
        leadership: { text: string; weight: Weight }[]
        successFactors: { text: string; weight: Weight }[]
      }
      const draft = (await res.json()) as DraftResp

      snapshot()
      onChange({
        ...data,
        leadership: draft.leadership.map((c) => ({
          id: uuid(),
          text: c.text,
          weight: c.weight,
        })),
        successFactors: draft.successFactors.map((c) => ({
          id: uuid(),
          text: c.text,
          weight: c.weight,
        })),
      })
      setAppliedAction('ai')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setAiLoading(false)
    }
  }

  // -- Render ------------------------------------------------------------

  return (
    <div className="space-y-4">
      {/* Header: intro + actions */}
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-text-secondary">
          {totalCount === 0
            ? 'Define weighted criteria across four categories to build a consistent evaluation framework.'
            : `Evaluating against ${totalCount} weighted criteria across four dimensions. Weight reflects relative importance.`}
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleImportFromSearchProfile}
            disabled={!canImport}
            className="text-sm font-medium text-accent hover:text-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            title={canImport ? undefined : 'Fill in the search profile first'}
          >
            Import from search profile
          </button>
          <span className="text-text-tertiary">·</span>
          <button
            type="button"
            onClick={handleSuggestAI}
            disabled={aiLoading}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {aiLoading ? (
              <>
                <LoadingDots />
                <span>Drafting…</span>
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                <span>Suggest leadership &amp; success factors</span>
              </>
            )}
          </button>
        </div>
      </div>

      {actionError && <p className="text-xs text-red-600">{actionError}</p>}

      {/* Undo banner */}
      <AnimatePresence>
        {appliedAction && previousRef.current && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-between rounded-lg border border-accent/20 bg-accent-light px-4 py-2.5"
          >
            <span className="text-xs text-text-secondary">
              {appliedAction === 'imported'
                ? 'Must-haves & nice-to-haves imported from search profile'
                : 'Leadership & success factors drafted by AI'}
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
      </AnimatePresence>

      {/* Empty state — quick-start when fully empty and no data to import */}
      {isScorecardEmpty(data) && !canImport && (
        <div className="rounded-lg border border-dashed border-border-dashed p-5 text-center">
          <p className="text-sm text-text-secondary">
            Start by filling the search profile — you&rsquo;ll be able to import must-haves and nice-to-haves from there.
          </p>
          <p className="mt-1 text-xs text-text-tertiary">
            Leadership and success factors can be drafted with AI at any time.
          </p>
        </div>
      )}

      {/* Category grid */}
      <div className="grid grid-cols-2 gap-4">
        {CATEGORIES.map((cat) => {
          const criteria = data[cat.key]
          return (
            <section key={cat.key} className="border border-border rounded-lg">
              <div className="px-4 py-3 border-b border-border bg-bg-subtle rounded-t-lg flex items-center gap-2">
                <span className={`inline-flex h-5 w-5 items-center justify-center rounded text-xs font-bold ${cat.color}`}>
                  {cat.title.charAt(0)}
                </span>
                <h3 className="text-sm font-semibold text-text">{cat.title}</h3>
                <span className="text-xs text-text-tertiary ml-auto">
                  {criteria.length} {criteria.length === 1 ? 'criterion' : 'criteria'}
                </span>
              </div>
              <div className="p-4">
                {criteria.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {criteria.map((c) => (
                      <CriterionRow
                        key={c.id}
                        criterion={c}
                        onUpdate={(updated) => updateCriterion(cat.key, updated)}
                        onRemove={() => removeCriterion(cat.key, c.id)}
                      />
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => addCriterion(cat.key)}
                  className="w-full rounded-md border border-dashed border-border-dashed py-2 text-sm font-medium text-text-tertiary hover:text-accent hover:border-accent hover:bg-accent-light transition-colors"
                >
                  + Add criterion
                </button>
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
