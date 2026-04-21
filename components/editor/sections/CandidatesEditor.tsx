'use client'

import { useMemo, useState } from 'react'
import type {
  Candidate,
  CandidatesSection,
  Persona,
  CandidateScore,
} from '@/lib/types'
import { useEditorStore } from '@/lib/store/editor-store'
import { fetchWithRetry, mapLimit } from '@/lib/async/concurrency'
import UploadZone from './candidates/UploadZone'
import CandidateDetailPanel from './candidates/CandidateDetailPanel'
import CandidatePhotoAvatar from './candidates/CandidatePhotoAvatar'
import LoadingDots from '@/components/ui/LoadingDots'

// Bound for parallel AI calls (CV parse, scoring). Sized to stay under
// Anthropic's output-TPM ceiling on common tiers; fetchWithRetry backs off
// if a burst still clips 429.
const MAX_CONCURRENT_AI = 10

// `onChange` is kept for interface parity with the section-editor router
// but writes flow through editor-store actions so parallel fan-out does
// not race on a stale render closure of `data.candidates`. The `enabled`
// flag is a single scalar with no race surface, so it goes via onChange.
interface CandidatesEditorProps {
  data: CandidatesSection
  onChange: (data: CandidatesSection) => void
}

interface PendingUpload {
  tempId: string
  fileName: string
  error?: string
}

// ---------------------------------------------------------------------------
// Persona colour mapping — stable across the deck based on persona index.
// ---------------------------------------------------------------------------

const PERSONA_COLORS = [
  'bg-fn-teal-bg text-fn-teal-fg border-fn-teal-bg',
  'bg-fn-sage-bg text-fn-sage-fg border-fn-sage-bg',
  'bg-fn-sand-bg text-fn-sand-fg border-fn-sand-bg',
  'bg-fn-lilac-bg text-fn-lilac-fg border-fn-lilac-bg',
  'bg-fn-copper-bg text-fn-copper-fg border-fn-copper-bg',
]

function personaColorFor(index: number): string {
  return PERSONA_COLORS[index % PERSONA_COLORS.length]
}

function shortPersonaLabel(title: string): string {
  // "The Healthcare-Tech Leader" → "HEALTHCARE-TECH LEADER"
  return title.replace(/^The\s+/i, '').toUpperCase()
}

// ---------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------

export default function CandidatesEditor({
  data,
  onChange,
}: CandidatesEditorProps) {
  const deck = useEditorStore((s) => s.deck)
  const appendCandidate = useEditorStore((s) => s.appendCandidate)
  const patchCandidate = useEditorStore((s) => s.patchCandidate)
  const removeCandidate = useEditorStore((s) => s.removeCandidate)
  const [pending, setPending] = useState<PendingUpload[]>([])
  const [scoringIds, setScoringIds] = useState<Set<string>>(new Set())
  const [scoreError, setScoreError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const personas: Persona[] = useMemo(
    () => deck?.sections.personas?.archetypes ?? [],
    [deck],
  )
  const personaIndexById = useMemo(() => {
    const sorted = [...personas].sort((a, b) => a.order - b.order)
    return new Map(sorted.map((p, i) => [p.id, i]))
  }, [personas])

  // -- Upload --------------------------------------------------------------
  // Files are parsed in parallel up to MAX_CONCURRENT_AI. Each worker writes
  // its result via `appendCandidate`, which reads the candidates array from
  // store state at write time — no stale-closure race between workers.

  async function handleFiles(files: File[]) {
    // Show all pending skeletons up-front so the UI reflects intent.
    const tempIds = files.map(() => `pending-${crypto.randomUUID()}`)
    setPending((p) => [
      ...p,
      ...files.map((f, i) => ({ tempId: tempIds[i], fileName: f.name })),
    ])

    await mapLimit(files, MAX_CONCURRENT_AI, async (file, i) => {
      const tempId = tempIds[i]
      try {
        const fd = new FormData()
        fd.append('file', file)
        if (personas.length > 0) {
          fd.append('personas', JSON.stringify(personas))
        }

        const res = await fetchWithRetry('/api/upload/candidate', {
          method: 'POST',
          body: fd,
        })

        if (!res.ok) {
          const payload = (await res.json().catch(() => ({}))) as {
            error?: string
          }
          throw new Error(payload.error ?? 'Parse failed')
        }

        const { candidate } = (await res.json()) as { candidate: Candidate }
        appendCandidate(candidate)
        setPending((p) => p.filter((x) => x.tempId !== tempId))
      } catch (err) {
        setPending((p) =>
          p.map((x) =>
            x.tempId === tempId
              ? { ...x, error: err instanceof Error ? err.message : 'Failed' }
              : x,
          ),
        )
      }
    })
  }

  function dismissPending(tempId: string) {
    setPending((p) => p.filter((x) => x.tempId !== tempId))
  }

  // -- Scoring -------------------------------------------------------------
  // Each `scoreOne` call writes atomically via `patchCandidate` (store state
  // read at write time). `scoreAll` fans out unscored candidates through
  // `mapLimit(MAX_CONCURRENT_AI)` — workers update their own entry in the
  // scoringIds set and the candidate array without racing each other.

  async function scoreOne(candidate: Candidate) {
    if (!deck) return
    const scorecard = deck.sections.scorecard
    const totalCriteria =
      scorecard.mustHaves.length +
      scorecard.niceToHaves.length +
      scorecard.leadership.length +
      scorecard.successFactors.length
    if (totalCriteria === 0) {
      setScoreError('Scorecard is empty — define criteria first.')
      return
    }

    setScoreError(null)
    setScoringIds((s) => new Set(s).add(candidate.id))
    try {
      const res = await fetchWithRetry('/api/ai/candidate/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate: {
            name: candidate.name,
            summary: candidate.summary,
            currentRole: candidate.currentRole,
            currentCompany: candidate.currentCompany,
            careerHistory: candidate.careerHistory,
            education: candidate.education,
            languages: candidate.languages,
            rawCvText: candidate.rawCvText,
          },
          scorecard,
          deckContext: {
            clientName: deck.sections.cover.clientName || deck.clientName,
            roleTitle: deck.sections.cover.roleTitle || deck.roleTitle,
            coverIntro: deck.sections.cover.introParagraph || undefined,
          },
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Scoring failed')
      }
      const { scores, overallScore } = (await res.json()) as {
        scores: CandidateScore[]
        overallScore: number
      }
      patchCandidate(candidate.id, {
        scores,
        overallScore,
        status: 'scored',
      })
    } catch (err) {
      setScoreError(err instanceof Error ? err.message : 'Scoring failed')
    } finally {
      setScoringIds((s) => {
        const next = new Set(s)
        next.delete(candidate.id)
        return next
      })
    }
  }

  async function scoreAll() {
    if (!deck) return
    const scorecard = deck.sections.scorecard
    const totalCriteria =
      scorecard.mustHaves.length +
      scorecard.niceToHaves.length +
      scorecard.leadership.length +
      scorecard.successFactors.length
    if (totalCriteria === 0) {
      setScoreError('Scorecard is empty — define criteria first.')
      return
    }
    setScoreError(null)

    const unscored = data.candidates.filter((c) => c.overallScore === 0)
    await mapLimit(unscored, MAX_CONCURRENT_AI, (target) => scoreOne(target))
  }

  // -- Render --------------------------------------------------------------

  const hasCandidates = data.candidates.length > 0
  const hasPending = pending.length > 0
  const unscoredCount = data.candidates.filter(
    (c) => c.overallScore === 0,
  ).length
  const isEnabled = data.enabled !== false

  const includeToggle = (
    <div className="flex items-center justify-between rounded-lg border border-border bg-bg-subtle px-4 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-text">
          Include Sample Candidates in this deck
        </p>
        <p className="mt-0.5 text-xs text-text-tertiary">
          {isEnabled
            ? 'This section will appear in the preview and published deck.'
            : 'This section is excluded — it will NOT appear in the preview or published deck.'}
        </p>
      </div>
      <label className="relative inline-flex shrink-0 cursor-pointer items-center">
        <input
          type="checkbox"
          checked={isEnabled}
          onChange={(e) => onChange({ ...data, enabled: e.target.checked })}
          className="peer sr-only"
        />
        <div
          className="
            h-6 w-11 rounded-full bg-border-strong
            peer-checked:bg-accent
            transition-colors
            after:content-[''] after:absolute after:top-0.5 after:left-0.5
            after:h-5 after:w-5 after:rounded-full after:bg-white
            after:shadow-sm after:transition-transform
            peer-checked:after:translate-x-5
          "
        />
      </label>
    </div>
  )

  if (!hasCandidates && !hasPending) {
    return (
      <div className="space-y-4">
        {includeToggle}
        {isEnabled && (
          <>
            <UploadZone variant="hero" onFilesSelected={handleFiles} />
            <QueryDatabaseStub />
          </>
        )}
      </div>
    )
  }

  const sorted = [...data.candidates].sort((a, b) => {
    if (a.ranking > 0 && b.ranking > 0) return a.ranking - b.ranking
    if (a.ranking > 0) return -1
    if (b.ranking > 0) return 1
    return 0
  })

  return (
    <div className="space-y-4">
      {includeToggle}
      <UploadZone variant="compact" onFilesSelected={handleFiles} />

      {/* Toolbar — score all */}
      {unscoredCount > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-bg-subtle px-4 py-2.5">
          <span className="text-xs text-text-secondary">
            {unscoredCount} candidate{unscoredCount === 1 ? '' : 's'} not yet scored against the scorecard
          </span>
          <button
            type="button"
            onClick={scoreAll}
            disabled={scoringIds.size > 0}
            className="text-xs font-medium text-accent hover:text-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
          >
            {scoringIds.size > 0 ? (
              <>
                <LoadingDots />
                <span>Scoring…</span>
              </>
            ) : (
              <span>Score all with AI</span>
            )}
          </button>
        </div>
      )}

      {scoreError && <p className="text-xs text-red-600 px-1">{scoreError}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sorted.map((c) => (
          <CandidateCard
            key={c.id}
            candidate={c}
            personas={personas}
            personaIndex={c.personaId ? personaIndexById.get(c.personaId) ?? null : null}
            scoring={scoringIds.has(c.id)}
            onOpen={() => setSelectedId(c.id)}
            onChangePersona={(personaId) => patchCandidate(c.id, { personaId })}
            onScore={() => scoreOne(c)}
            onRemove={() => removeCandidate(c.id)}
          />
        ))}
        {pending.map((p) => (
          <PendingRow key={p.tempId} pending={p} onDismiss={dismissPending} />
        ))}
      </div>

      <QueryDatabaseStub />

      {/* Detail panel */}
      {deck && (
        <CandidateDetailPanel
          open={selectedId !== null}
          candidate={
            data.candidates.find((c) => c.id === selectedId) ?? null
          }
          scorecard={deck.sections.scorecard}
          scoring={selectedId !== null && scoringIds.has(selectedId)}
          onClose={() => setSelectedId(null)}
          onChange={(patch) => {
            if (selectedId) patchCandidate(selectedId, patch)
          }}
          onRescore={() => {
            const c = data.candidates.find((x) => x.id === selectedId)
            if (c) scoreOne(c)
          }}
          onRemove={() => {
            if (selectedId) {
              removeCandidate(selectedId)
              setSelectedId(null)
            }
          }}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// CandidateCard
// ---------------------------------------------------------------------------

function CandidateCard({
  candidate,
  personas,
  personaIndex,
  scoring,
  onOpen,
  onChangePersona,
  onScore,
  onRemove,
}: {
  candidate: Candidate
  personas: Persona[]
  personaIndex: number | null
  scoring: boolean
  onOpen: () => void
  onChangePersona: (personaId: string | null) => void
  onScore: () => void
  onRemove: () => void
}) {
  const persona = candidate.personaId
    ? personas.find((p) => p.id === candidate.personaId)
    : null
  const personaColor =
    personaIndex !== null ? personaColorFor(personaIndex) : null

  const scored = candidate.overallScore > 0

  // Colour the ranking badge with the persona accent when one is matched.
  const rankingBadgeClass = personaColor
    ? `${personaColor} border`
    : 'bg-bg-subtle text-text-secondary'

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
      className="group relative rounded-lg border border-border bg-white p-4 transition-colors hover:border-border-strong hover:bg-bg-subtle cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      {/* Top row: ranking badge + persona chip + remove */}
      <div className="flex items-start gap-3 mb-3">
        {/* Ranking badge (colour-coded to persona) */}
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${rankingBadgeClass}`}
        >
          {candidate.ranking > 0 ? candidate.ranking : '—'}
        </div>

        {/* Avatar */}
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          <CandidatePhotoAvatar candidate={candidate} size="sm" />
        </div>

        {/* Name, role */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text truncate">
            {candidate.name || 'Unnamed candidate'}
            {candidate.age > 0 && (
              <span className="font-normal text-text-secondary"> ({candidate.age})</span>
            )}
          </p>
          <p className="mt-0.5 text-xs text-text-secondary truncate">
            {candidate.currentRole}
            {candidate.currentCompany ? ` at ${candidate.currentCompany}` : ''}
          </p>
        </div>

        {/* Persona chip + picker */}
        <div onClick={(e) => e.stopPropagation()}>
          <PersonaChip
            persona={persona}
            personaColor={personaColor}
            fallbackTag={candidate.archetypeTag}
            personas={personas}
            onChange={onChangePersona}
          />
        </div>
      </div>

      {/* Summary */}
      {candidate.summary && (
        <p className="text-xs text-text-secondary leading-relaxed line-clamp-3 mb-3">
          {candidate.summary}
        </p>
      )}

      {/* Score row */}
      <div className="flex items-center gap-3">
        {scored ? (
          <>
            <span className="text-xl font-semibold text-text tabular-nums">
              {candidate.overallScore}%
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-bg-muted overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all"
                style={{ width: `${candidate.overallScore}%` }}
              />
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onScore() }}
              disabled={scoring}
              className="text-[11px] font-medium text-text-tertiary hover:text-accent transition-colors disabled:opacity-50"
              title="Re-score with the current scorecard"
            >
              {scoring ? 'Scoring…' : 'Re-score'}
            </button>
          </>
        ) : (
          <>
            <span className="text-xs text-text-tertiary">Not yet scored</span>
            <div className="flex-1" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onScore() }}
              disabled={scoring}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover transition-colors disabled:opacity-50"
            >
              {scoring ? (
                <>
                  <LoadingDots />
                  <span>Scoring…</span>
                </>
              ) : (
                <span>Score against criteria</span>
              )}
            </button>
          </>
        )}
      </div>

      {/* Footer: file + remove */}
      <div className="mt-3 flex items-center justify-between">
        {candidate.cvFileName && (
          <span className="text-[11px] text-text-tertiary truncate">
            {candidate.cvFileName}
          </span>
        )}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          className="text-[11px] text-text-tertiary opacity-0 group-hover:opacity-100 hover:text-error transition-all ml-auto"
          aria-label="Remove candidate"
        >
          Remove
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// PersonaChip — a chip that opens a dropdown picker on click
// ---------------------------------------------------------------------------

function PersonaChip({
  persona,
  personaColor,
  fallbackTag,
  personas,
  onChange,
}: {
  persona: Persona | null | undefined
  personaColor: string | null
  fallbackTag: string
  personas: Persona[]
  onChange: (personaId: string | null) => void
}) {
  const [open, setOpen] = useState(false)

  const sorted = [...personas].sort((a, b) => a.order - b.order)

  const label = persona
    ? shortPersonaLabel(persona.title)
    : fallbackTag || 'Match persona'

  const chipClasses = persona && personaColor
    ? `border ${personaColor}`
    : 'border border-border bg-bg-subtle text-text-tertiary'

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition-colors ${chipClasses} ${
          personas.length === 0 ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
        }`}
        disabled={personas.length === 0}
        title={
          personas.length === 0
            ? 'Define personas in the Personas section to tag candidates'
            : 'Change persona'
        }
      >
        <span className="truncate max-w-[12rem]">{label}</span>
        {personas.length > 0 && (
          <svg className="h-2.5 w-2.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        )}
      </button>

      {open && personas.length > 0 && (
        <>
          {/* Click-outside backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-64 rounded-md border border-border bg-white shadow-lg z-20 overflow-hidden">
            <div className="p-1">
              {sorted.map((p) => {
                const active = p.id === persona?.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onChange(p.id)
                      setOpen(false)
                    }}
                    className={`w-full text-left rounded px-2 py-1.5 text-xs transition-colors ${
                      active
                        ? 'bg-accent-light text-accent'
                        : 'text-text-secondary hover:bg-bg-subtle'
                    }`}
                  >
                    <span className="block font-semibold">{p.title}</span>
                    <span className="block text-[10px] text-text-tertiary line-clamp-2 mt-0.5">
                      {p.description}
                    </span>
                  </button>
                )
              })}
              {persona && (
                <button
                  type="button"
                  onClick={() => {
                    onChange(null)
                    setOpen(false)
                  }}
                  className="w-full text-left rounded px-2 py-1.5 text-xs text-text-tertiary hover:bg-bg-subtle transition-colors border-t border-border-subtle mt-1"
                >
                  Clear persona
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Pending row (upload in-progress or failed)
// ---------------------------------------------------------------------------

function PendingRow({
  pending,
  onDismiss,
}: {
  pending: PendingUpload
  onDismiss: (id: string) => void
}) {
  if (pending.error) {
    return (
      <div className="rounded-lg border border-border bg-bg p-4">
        <p className="text-sm font-semibold text-text truncate">
          {pending.fileName}
        </p>
        <p className="mt-1 text-xs text-rose-600">
          Couldn&apos;t parse this CV: {pending.error}
        </p>
        <button
          type="button"
          onClick={() => onDismiss(pending.tempId)}
          className="mt-2 text-xs font-medium text-accent hover:text-accent-hover transition-colors"
        >
          Dismiss
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-bg p-4 animate-pulse">
      <div className="h-3 w-1/2 rounded bg-bg-subtle" />
      <div className="mt-2 h-3 w-2/3 rounded bg-bg-subtle" />
      <div className="mt-4 h-2 w-1/3 rounded bg-bg-subtle" />
      <p className="mt-3 text-xs text-text-tertiary truncate">
        Parsing {pending.fileName}…
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Query database stub (Soon)
// ---------------------------------------------------------------------------

function QueryDatabaseStub() {
  return (
    <div
      className="border border-border rounded-lg p-5 flex items-center justify-between opacity-80"
      aria-disabled="true"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-bg-subtle">
          <svg
            className="h-4 w-4 text-text-tertiary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-text">
            Query candidate database
          </p>
          <p className="text-sm text-text-secondary">
            Coming soon — match your candidate pool against the search profile
            and scorecard
          </p>
        </div>
      </div>
      <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
        Soon
      </span>
    </div>
  )
}
