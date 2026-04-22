'use client'

import { useRef, useState } from 'react'
import { v4 as uuid } from 'uuid'
import { motion, AnimatePresence } from 'framer-motion'
import type { Persona, PersonaPoolSize, PersonasSection } from '@/lib/types'
import { useEditorStore } from '@/lib/store/editor-store'
import { useAIStore } from '@/lib/store/ai-store'
import LoadingDots from '@/components/ui/LoadingDots'
import SectionIntroField from '@/components/editor/SectionIntroField'

interface PersonasEditorProps {
  data: PersonasSection
  onChange: (data: PersonasSection) => void
}

// ---------------------------------------------------------------------------
// Pool size presentation
// ---------------------------------------------------------------------------

const POOL_SIZES: { key: PersonaPoolSize; label: string; chipClass: string; defaultRange: string }[] = [
  {
    key: 'narrow',
    label: 'Narrow',
    chipClass: 'bg-fn-rose-bg text-fn-rose-fg border-fn-rose-bg',
    defaultRange: '3–5 candidates',
  },
  {
    key: 'moderate',
    label: 'Moderate',
    chipClass: 'bg-fn-sand-bg text-fn-sand-fg border-fn-sand-bg',
    defaultRange: '6–8 candidates',
  },
  {
    key: 'strong',
    label: 'Strong',
    chipClass: 'bg-fn-sage-bg text-fn-sage-fg border-fn-sage-bg',
    defaultRange: '10–15 candidates',
  },
]

function poolStyles(size: PersonaPoolSize): string {
  return POOL_SIZES.find((p) => p.key === size)?.chipClass ?? POOL_SIZES[1].chipClass
}

function poolLabel(size: PersonaPoolSize): string {
  return POOL_SIZES.find((p) => p.key === size)?.label ?? 'Moderate'
}

function defaultRangeFor(size: PersonaPoolSize): string {
  return POOL_SIZES.find((p) => p.key === size)?.defaultRange ?? '6–8 candidates'
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function indexToLabel(index: number): string {
  // A, B, C ... AA, AB if ever exceeded (unlikely for personas)
  if (index < 26) return String.fromCharCode(65 + index)
  return `A${String.fromCharCode(65 + (index - 26))}`
}

function poolRank(size: PersonaPoolSize): number {
  return size === 'narrow' ? 0 : size === 'moderate' ? 1 : 2
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PersonasEditor({ data, onChange }: PersonasEditorProps) {
  const deck = useEditorStore((s) => s.deck)
  const locale = deck?.locale ?? 'nl'
  const deckDocuments = useAIStore((s) => s.deckDocuments)
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [suggestError, setSuggestError] = useState<string | null>(null)

  const previousRef = useRef<Persona[] | null>(null)
  const [appliedAction, setAppliedAction] = useState<'ai' | null>(null)
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null)

  const personas = [...data.archetypes].sort((a, b) => a.order - b.order)
  const hasPersonas = personas.length > 0

  // -- Mutations -------------------------------------------------------------

  function updatePersonas(next: Persona[]) {
    onChange({ archetypes: next.map((p, i) => ({ ...p, order: i })) })
  }

  function clearUndo() {
    previousRef.current = null
    setAppliedAction(null)
  }

  function updatePersona(id: string, patch: Partial<Persona>) {
    clearUndo()
    updatePersonas(personas.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  function deletePersona(id: string) {
    clearUndo()
    updatePersonas(personas.filter((p) => p.id !== id))
  }

  function addPersona() {
    clearUndo()
    const newPersona: Persona = {
      id: uuid(),
      title: '',
      description: '',
      poolSize: 'moderate',
      poolRangeLabel: defaultRangeFor('moderate'),
      poolRationale: '',
      order: personas.length,
    }
    updatePersonas([...personas, newPersona])
  }

  function movePersona(index: number, direction: -1 | 1) {
    clearUndo()
    const target = index + direction
    if (target < 0 || target >= personas.length) return
    const reordered = [...personas]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(target, 0, moved)
    updatePersonas(reordered)
  }

  function setPoolSize(id: string, size: PersonaPoolSize) {
    const persona = personas.find((p) => p.id === id)
    if (!persona) return
    // If the range label is blank or still the default for the old size, refresh it
    const isDefaultOrEmpty =
      !persona.poolRangeLabel.trim() || persona.poolRangeLabel === defaultRangeFor(persona.poolSize)
    updatePersona(id, {
      poolSize: size,
      poolRangeLabel: isDefaultOrEmpty ? defaultRangeFor(size) : persona.poolRangeLabel,
    })
  }

  // -- AI suggest ------------------------------------------------------------

  async function handleSuggestPersonas() {
    if (!deck) return
    setSuggestLoading(true)
    setSuggestError(null)

    try {
      const { cover, searchProfile, credentials } = deck.sections
      const res = await fetch('/api/ai/personas/suggest', {
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
            credentialAxes: credentials.axes.map((a) => ({
              name: a.name,
              description: a.description,
            })),
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
        throw new Error(err.error || 'Failed to suggest personas')
      }

      interface DraftPersona {
        title: string
        description: string
        poolSize: PersonaPoolSize
        poolRangeLabel: string
        poolRationale: string
      }

      const result = (await res.json()) as { personas: DraftPersona[] }

      // Sort narrowest → broadest to match the prompt's convention
      const sorted = [...result.personas].sort(
        (a, b) => poolRank(a.poolSize) - poolRank(b.poolSize),
      )

      previousRef.current = personas
      setAppliedAction('ai')
      const newPersonas: Persona[] = sorted.map((draft, i) => ({
        id: uuid(),
        title: draft.title,
        description: draft.description,
        poolSize: draft.poolSize,
        poolRangeLabel: draft.poolRangeLabel,
        poolRationale: draft.poolRationale,
        order: i,
      }))
      onChange({ archetypes: newPersonas })
    } catch (err) {
      setSuggestError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSuggestLoading(false)
    }
  }

  function undoApply() {
    if (!previousRef.current) return
    onChange({ archetypes: previousRef.current })
    clearUndo()
  }

  async function regenerateOne(persona: Persona) {
    if (!deck) return
    setRegeneratingId(persona.id)
    setSuggestError(null)

    try {
      const { cover, searchProfile, credentials } = deck.sections
      const keep = personas
        .filter((p) => p.id !== persona.id)
        .map((p) => ({ title: p.title, description: p.description }))

      const res = await fetch('/api/ai/personas/suggest', {
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
            credentialAxes: credentials.axes.map((a) => ({
              name: a.name,
              description: a.description,
            })),
            keep,
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
        throw new Error(err.error || 'Failed to regenerate persona')
      }

      interface DraftPersona {
        title: string
        description: string
        poolSize: PersonaPoolSize
        poolRangeLabel: string
        poolRationale: string
      }
      const result = (await res.json()) as { personas: DraftPersona[] }
      const draft = result.personas[0]
      if (!draft) throw new Error('No persona returned')

      previousRef.current = personas
      setAppliedAction('ai')
      updatePersona(persona.id, {
        title: draft.title,
        description: draft.description,
        poolSize: draft.poolSize,
        poolRangeLabel: draft.poolRangeLabel,
        poolRationale: draft.poolRationale,
      })
    } catch (err) {
      setSuggestError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setRegeneratingId(null)
    }
  }

  // -- Render ----------------------------------------------------------------

  return (
    <div className="space-y-4">
      {/* Empty state — AI suggest + manual add */}
      {!hasPersonas && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleSuggestPersonas}
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
                    <p className="text-sm font-semibold text-text">Suggesting personas…</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-text">Suggest 3 personas with AI</p>
                    <p className="text-xs text-text-secondary">
                      Uses the search profile, credentials and cover to propose distinct sourcing pools
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

          <button
            type="button"
            onClick={addPersona}
            className="w-full border border-dashed border-border-dashed rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-accent-light hover:border-accent transition-colors group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-bg-muted group-hover:bg-accent-muted transition-colors">
                <svg className="h-4.5 w-4.5 text-text-tertiary group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-text">Add persona manually</p>
                <p className="text-xs text-text-secondary">Start with a blank card and fill it in yourself</p>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Error */}
      {suggestError && <p className="text-xs text-red-600 px-1">{suggestError}</p>}

      {hasPersonas && (
        <SectionIntroField
          value={data.intro}
          onChange={(intro) => {
            clearUndo()
            onChange({ ...data, intro })
          }}
          locale={locale}
        />
      )}

      {/* Undo banner */}
      <AnimatePresence>
        {hasPersonas && appliedAction && previousRef.current && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-between rounded-lg border border-accent/20 bg-accent-light px-4 py-2.5"
          >
            <span className="text-xs text-text-secondary">AI-generated personas applied</span>
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

      {/* Persona list */}
      {hasPersonas && (
        <>
          <AnimatePresence initial={false}>
            {personas.map((persona, index) => (
              <motion.section
                key={persona.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="border border-border rounded-lg bg-white p-5 group"
              >
                {/* Header: label + title + reorder/delete */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-light text-xs font-semibold text-accent">
                    {indexToLabel(index)}
                  </div>
                  <input
                    type="text"
                    value={persona.title}
                    onChange={(e) => updatePersona(persona.id, { title: e.target.value })}
                    placeholder="The [archetype name]"
                    className="flex-1 text-base font-semibold text-text bg-transparent outline-none border-b border-transparent focus:border-accent transition-colors"
                  />
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => regenerateOne(persona)}
                      disabled={regeneratingId === persona.id || suggestLoading}
                      className="h-6 w-6 rounded flex items-center justify-center text-text-tertiary hover:text-accent hover:bg-accent-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Regenerate this persona (keep the others)"
                    >
                      {regeneratingId === persona.id ? (
                        <LoadingDots />
                      ) : (
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => movePersona(index, -1)}
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
                      onClick={() => movePersona(index, 1)}
                      disabled={index === personas.length - 1}
                      className="h-6 w-6 rounded flex items-center justify-center text-text-tertiary hover:text-accent hover:bg-accent-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePersona(persona.id)}
                      className="h-6 w-6 rounded flex items-center justify-center text-text-tertiary hover:text-red-500 hover:bg-red-50 transition-colors ml-1"
                      title="Delete persona"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Description */}
                <textarea
                  value={persona.description}
                  onChange={(e) => updatePersona(persona.id, { description: e.target.value })}
                  rows={3}
                  placeholder="Current role, scale of organisation, experience, relevant capabilities…"
                  className="w-full text-sm text-text-secondary bg-transparent outline-none resize-none leading-relaxed border-b border-transparent focus:border-accent/30 transition-colors"
                />

                {/* Pool size block */}
                <div className="mt-4 border-t border-border-subtle pt-3 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Segmented pool size control */}
                    <div className="inline-flex items-center rounded-md border border-border p-0.5 bg-bg-subtle">
                      {POOL_SIZES.map((opt) => {
                        const active = persona.poolSize === opt.key
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => setPoolSize(persona.id, opt.key)}
                            className={`text-[11px] font-medium px-2.5 py-1 rounded transition-colors ${
                              active
                                ? 'bg-white text-text shadow-sm'
                                : 'text-text-tertiary hover:text-text'
                            }`}
                          >
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>

                    {/* Range label chip */}
                    <div
                      className={`inline-flex items-center rounded-md border px-2 py-1 ${poolStyles(persona.poolSize)}`}
                    >
                      <input
                        type="text"
                        value={persona.poolRangeLabel}
                        onChange={(e) => updatePersona(persona.id, { poolRangeLabel: e.target.value })}
                        placeholder={defaultRangeFor(persona.poolSize)}
                        className="bg-transparent outline-none text-[11px] font-semibold uppercase tracking-wide w-[11rem]"
                        aria-label="Pool range label"
                      />
                    </div>

                    <span className="text-[11px] text-text-tertiary ml-auto">
                      {poolLabel(persona.poolSize)} sourcing pool
                    </span>
                  </div>

                  <textarea
                    value={persona.poolRationale}
                    onChange={(e) => updatePersona(persona.id, { poolRationale: e.target.value })}
                    rows={2}
                    placeholder="Why is the pool this size? (market dynamics, availability, PE saturation…)"
                    className="w-full text-sm text-text-secondary bg-transparent outline-none resize-none leading-relaxed border-b border-transparent focus:border-accent/30 transition-colors"
                  />
                </div>
              </motion.section>
            ))}
          </AnimatePresence>

          {/* Footer actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={addPersona}
              className="flex-1 rounded-md border border-dashed border-border-dashed py-2.5 text-sm font-medium text-text-tertiary hover:text-accent hover:border-accent hover:bg-accent-light transition-colors"
            >
              + Add persona
            </button>
            <button
              type="button"
              onClick={handleSuggestPersonas}
              disabled={suggestLoading}
              className="rounded-md border border-border px-3 py-2 text-xs font-medium text-text-secondary hover:text-accent hover:border-accent hover:bg-accent-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
            >
              {suggestLoading ? (
                <>
                  <LoadingDots />
                  <span>Suggesting…</span>
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
          </div>
        </>
      )}
    </div>
  )
}
