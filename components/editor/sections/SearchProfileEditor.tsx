'use client'

import { useRef, useState } from 'react'
import { v4 } from 'uuid'
import { motion, AnimatePresence } from 'framer-motion'
import type { SearchProfileSection, Criterion, Weight } from '@/lib/types'
import { useEditorStore } from '@/lib/store/editor-store'
import { useAIStore } from '@/lib/store/ai-store'
import LoadingDots from '@/components/ui/LoadingDots'
import WeightSelector from '@/components/ui/WeightSelector'

interface SearchProfileEditorProps {
  data: SearchProfileSection
  onChange: (data: SearchProfileSection) => void
}

// Defaults for any nested field the incoming deck might be missing
// (e.g. older decks created before the shape existed).
function normalize(data: SearchProfileSection): SearchProfileSection {
  return {
    mustHaves: data.mustHaves ?? [],
    niceToHaves: data.niceToHaves ?? [],
    personalityProfile: {
      intro: data.personalityProfile?.intro ?? '',
      traits: data.personalityProfile?.traits ?? [],
    },
  }
}

function isSearchProfileEmpty(data: SearchProfileSection): boolean {
  return (
    data.mustHaves.length === 0 &&
    data.niceToHaves.length === 0 &&
    data.personalityProfile.intro.trim() === '' &&
    data.personalityProfile.traits.length === 0
  )
}

function CriterionRow({
  criterion,
  onUpdate,
  onRemove,
}: {
  criterion: Criterion
  onUpdate: (c: Criterion) => void
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
        <WeightSelector
          value={criterion.weight}
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

export default function SearchProfileEditor({
  data: rawData,
  onChange,
}: SearchProfileEditorProps) {
  const data = normalize(rawData)
  const deck = useEditorStore((s) => s.deck)
  const deckDocuments = useAIStore((s) => s.deckDocuments)
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [suggestError, setSuggestError] = useState<string | null>(null)
  const previousRef = useRef<SearchProfileSection | null>(null)
  const [applied, setApplied] = useState(false)

  const empty = isSearchProfileEmpty(data)

  function clearUndo() {
    previousRef.current = null
    setApplied(false)
  }

  async function handleSuggestStarter() {
    if (!deck) return
    setSuggestLoading(true)
    setSuggestError(null)
    try {
      const cover = deck.sections.cover
      const res = await fetch('/api/ai/search-profile/suggest', {
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
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to generate starter profile')
      }
      interface DraftResponse {
        mustHaves: { text: string; weight: Weight }[]
        niceToHaves: { text: string; weight: Weight }[]
        personalityProfile: { intro: string; traits: string[] }
      }
      const draft = (await res.json()) as DraftResponse

      previousRef.current = data
      setApplied(true)
      onChange({
        mustHaves: draft.mustHaves.map((c) => ({
          id: v4(),
          text: c.text,
          weight: c.weight,
        })),
        niceToHaves: draft.niceToHaves.map((c) => ({
          id: v4(),
          text: c.text,
          weight: c.weight,
        })),
        personalityProfile: {
          intro: draft.personalityProfile.intro,
          traits: draft.personalityProfile.traits,
        },
      })
    } catch (err) {
      setSuggestError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSuggestLoading(false)
    }
  }

  function undoApply() {
    if (!previousRef.current) return
    onChange(previousRef.current)
    clearUndo()
  }

  function addCriterion(column: 'mustHaves' | 'niceToHaves') {
    clearUndo()
    const newCriterion: Criterion = { id: v4(), text: '', weight: 3 }
    onChange({
      ...data,
      [column]: [...data[column], newCriterion],
    })
  }

  function updateCriterion(column: 'mustHaves' | 'niceToHaves', updated: Criterion) {
    clearUndo()
    onChange({
      ...data,
      [column]: data[column].map((c) => (c.id === updated.id ? updated : c)),
    })
  }

  function removeCriterion(column: 'mustHaves' | 'niceToHaves', id: string) {
    clearUndo()
    onChange({
      ...data,
      [column]: data[column].filter((c) => c.id !== id),
    })
  }

  function renderColumn(title: string, column: 'mustHaves' | 'niceToHaves', icon: React.ReactNode, iconBg: string) {
    const criteria = data[column]

    return (
      <div className="border border-border rounded-lg">
        <div className="px-4 py-3 border-b border-border bg-bg-subtle rounded-t-lg">
          <div className="flex items-center gap-2">
            <span className={`flex h-5 w-5 items-center justify-center rounded ${iconBg}`}>
              {icon}
            </span>
            <h3 className="text-sm font-semibold text-text">{title}</h3>
            {criteria.length > 0 && (
              <span className="text-xs text-text-tertiary">{criteria.length}</span>
            )}
          </div>
        </div>
        <div className="p-4">
          {criteria.length > 0 ? (
            <div className="space-y-2 mb-3">
              {criteria.map((criterion) => (
                <CriterionRow
                  key={criterion.id}
                  criterion={criterion}
                  onUpdate={(c) => updateCriterion(column, c)}
                  onRemove={() => removeCriterion(column, criterion.id)}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-tertiary mb-3">
              {column === 'mustHaves'
                ? 'Non-negotiable requirements for candidates'
                : 'Preferred but not required qualifications'}
            </p>
          )}
          <button
            type="button"
            onClick={() => addCriterion(column)}
            className="w-full rounded-md border border-dashed border-border-dashed py-2 text-sm font-medium text-text-tertiary hover:text-accent hover:border-accent hover:bg-accent-light transition-colors"
          >
            + Add criterion
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Quick-start — shown only when entirely empty */}
      {empty && (
        <button
          type="button"
          onClick={handleSuggestStarter}
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
                  <p className="text-sm font-semibold text-text">Drafting starter profile…</p>
                </div>
              ) : (
                <>
                  <p className="text-sm font-semibold text-text">Draft a starter profile with AI</p>
                  <p className="text-xs text-text-secondary">
                    Generate must-haves, nice-to-haves and a personality profile from the client and role — ready to refine
                  </p>
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
      )}

      {suggestError && <p className="text-xs text-red-600 px-1">{suggestError}</p>}

      <AnimatePresence>
        {!empty && applied && previousRef.current && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-between rounded-lg border border-accent/20 bg-accent-light px-4 py-2.5"
          >
            <span className="text-xs text-text-secondary">Starter profile applied</span>
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

      <div className="grid grid-cols-2 gap-4">
          {renderColumn(
            'Must-Haves',
            'mustHaves',
            <svg className="h-3 w-3 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>,
            'bg-error-light'
          )}
          {renderColumn(
            'Nice-to-Haves',
            'niceToHaves',
            <svg className="h-3 w-3 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>,
            'bg-accent-light'
          )}
        </div>

        {/* Personality Profile */}
        <div className="mt-6 border border-border rounded-lg">
          <div className="px-4 py-3 border-b border-border bg-bg-subtle rounded-t-lg">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-fn-lilac-bg">
                <svg className="h-3 w-3 text-fn-lilac-fg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </span>
              <h3 className="text-sm font-semibold text-text">Personality Profile</h3>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {/* Intro paragraph */}
            <textarea
              value={data.personalityProfile.intro}
              onChange={(e) =>
                onChange({
                  ...data,
                  personalityProfile: { ...data.personalityProfile, intro: e.target.value },
                })
              }
              placeholder="Describe the culture and what type of personality the role requires..."
              rows={2}
              className="w-full rounded-md border border-border px-3 py-2 text-sm text-text placeholder-text-placeholder outline-none resize-none focus:border-accent transition-colors field-sizing-content"
              style={{ fieldSizing: 'content' } as React.CSSProperties}
            />

            {/* Traits list */}
            <div className="space-y-2">
              {data.personalityProfile.traits.map((trait, index) => (
                <div key={index} className="group flex items-start gap-2">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-text-tertiary" />
                  <textarea
                    value={trait}
                    onChange={(e) => {
                      const newTraits = [...data.personalityProfile.traits]
                      newTraits[index] = e.target.value
                      onChange({
                        ...data,
                        personalityProfile: { ...data.personalityProfile, traits: newTraits },
                      })
                    }}
                    rows={1}
                    className="min-w-0 flex-1 border-b border-transparent bg-transparent py-1 text-sm text-text outline-none placeholder-text-placeholder focus:border-border-strong transition-colors resize-none"
                    style={{ fieldSizing: 'content' } as React.CSSProperties}
                    placeholder="Describe a personality trait..."
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newTraits = data.personalityProfile.traits.filter((_, i) => i !== index)
                      onChange({
                        ...data,
                        personalityProfile: { ...data.personalityProfile, traits: newTraits },
                      })
                    }}
                    className="shrink-0 mt-1 text-text-tertiary opacity-0 group-hover:opacity-100 hover:text-error transition-all"
                    aria-label="Remove trait"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                onChange({
                  ...data,
                  personalityProfile: {
                    ...data.personalityProfile,
                    traits: [...data.personalityProfile.traits, ''],
                  },
                })
              }
              className="w-full rounded-md border border-dashed border-border-dashed py-2 text-sm font-medium text-text-tertiary hover:text-accent hover:border-accent hover:bg-accent-light transition-colors"
            >
              + Add trait
            </button>
          </div>
        </div>
    </div>
  )
}
