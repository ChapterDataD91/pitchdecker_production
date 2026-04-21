'use client'

import { useEffect, useMemo, useRef, type DragEvent } from 'react'
import { v4 as uuid } from 'uuid'
import SlideOutPanel from '@/components/ui/SlideOutPanel'
import LoadingDots from '@/components/ui/LoadingDots'
import { useEditorStore } from '@/lib/store/editor-store'
import { useCandidatePhotoUpload } from './useCandidatePhotoUpload'
import type {
  Candidate,
  CareerEntry,
  CandidateScore,
  ScorecardSection,
  ScorecardCriterion,
} from '@/lib/types'

interface Props {
  open: boolean
  candidate: Candidate | null
  scorecard: ScorecardSection
  scoring: boolean
  onClose: () => void
  onChange: (patch: Partial<Candidate>) => void
  onRescore: () => void
  onRemove: () => void
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function CandidateDetailPanel({
  open,
  candidate,
  scorecard,
  scoring,
  onClose,
  onChange,
  onRescore,
  onRemove,
}: Props) {
  const scoresById = useMemo(() => {
    const map = new Map<string, CandidateScore>()
    for (const s of candidate?.scores ?? []) map.set(s.criterionId, s)
    return map
  }, [candidate])

  if (!candidate) {
    return (
      <SlideOutPanel open={open} onClose={onClose} title="Candidate" width="680px">
        <div />
      </SlideOutPanel>
    )
  }

  function patchCareer(idx: number, patch: Partial<CareerEntry>) {
    const history = [...(candidate!.careerHistory ?? [])]
    history[idx] = { ...history[idx], ...patch }
    onChange({ careerHistory: history })
  }

  function addCareerEntry() {
    const history = [...(candidate!.careerHistory ?? [])]
    history.unshift({
      id: uuid(),
      period: '',
      role: '',
      company: '',
      highlights: [],
    })
    onChange({ careerHistory: history })
  }

  function removeCareerEntry(idx: number) {
    const history = [...(candidate!.careerHistory ?? [])]
    history.splice(idx, 1)
    onChange({ careerHistory: history })
  }

  // Mirrors the server-side formula in /api/ai/candidate/score/route.ts.
  // Weighted percentage across every criterion in the scorecard (missing
  // scores don't count toward the denominator so partial scoring doesn't
  // unfairly depress the total).
  function computeOverall(scores: CandidateScore[]): number {
    const allCriteria: ScorecardCriterion[] = [
      ...scorecard.mustHaves,
      ...scorecard.niceToHaves,
      ...scorecard.leadership,
      ...scorecard.successFactors,
    ]
    if (allCriteria.length === 0) return 0
    const byId = new Map(scores.map((s) => [s.criterionId, s.score]))
    let weightedSum = 0
    let weightTotal = 0
    for (const c of allCriteria) {
      const s = byId.get(c.id)
      if (typeof s !== 'number') continue
      weightedSum += s * c.weight
      weightTotal += 5 * c.weight
    }
    return weightTotal === 0 ? 0 : Math.round((weightedSum / weightTotal) * 100)
  }

  function setScore(criterion: ScorecardCriterion, score: number) {
    const existing = scoresById.get(criterion.id)
    const nextScores: CandidateScore[] = candidate!.scores.some(
      (s) => s.criterionId === criterion.id,
    )
      ? candidate!.scores.map((s) =>
          s.criterionId === criterion.id ? { ...s, score } : s,
        )
      : [
          ...candidate!.scores,
          { criterionId: criterion.id, score, rationale: existing?.rationale },
        ]
    onChange({ scores: nextScores, overallScore: computeOverall(nextScores) })
  }

  function setRationale(criterionId: string, rationale: string) {
    const nextScores: CandidateScore[] = candidate!.scores.some(
      (s) => s.criterionId === criterionId,
    )
      ? candidate!.scores.map((s) =>
          s.criterionId === criterionId ? { ...s, rationale } : s,
        )
      : [...candidate!.scores, { criterionId, score: 3, rationale }]
    onChange({ scores: nextScores })
  }

  const scored = candidate.overallScore > 0

  return (
    <SlideOutPanel
      open={open}
      onClose={onClose}
      title={candidate.name || 'Candidate'}
      width="680px"
    >
      <div className="space-y-8">
        {/* Header */}
        <section>
          <div className="flex items-start gap-4">
            <PhotoBlock
              candidate={candidate}
              open={open}
              onClear={() => onChange({ photoUrl: '' })}
            />

            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={candidate.name}
                onChange={(e) => onChange({ name: e.target.value })}
                placeholder="Candidate name"
                className="w-full bg-transparent text-lg font-semibold text-text focus:outline-none focus:ring-2 focus:ring-accent rounded px-1 -mx-1"
              />
              <div className="mt-1 flex items-center gap-2 text-sm text-text-secondary">
                <input
                  type="text"
                  value={candidate.currentRole}
                  onChange={(e) => onChange({ currentRole: e.target.value })}
                  placeholder="Role"
                  className="bg-transparent focus:outline-none focus:ring-2 focus:ring-accent rounded px-1 -mx-1 flex-1"
                />
                <span className="text-text-tertiary">at</span>
                <input
                  type="text"
                  value={candidate.currentCompany}
                  onChange={(e) =>
                    onChange({ currentCompany: e.target.value })
                  }
                  placeholder="Company"
                  className="bg-transparent focus:outline-none focus:ring-2 focus:ring-accent rounded px-1 -mx-1 flex-1"
                />
              </div>
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="url"
                  value={candidate.linkedinUrl ?? ''}
                  onChange={(e) => onChange({ linkedinUrl: e.target.value })}
                  placeholder="LinkedIn URL"
                  className="text-xs text-accent hover:text-accent-hover bg-transparent focus:outline-none focus:ring-2 focus:ring-accent rounded px-1 -mx-1 flex-1"
                />
                <input
                  type="number"
                  value={candidate.age || ''}
                  onChange={(e) =>
                    onChange({ age: parseInt(e.target.value, 10) || 0 })
                  }
                  placeholder="Age"
                  className="w-16 text-xs text-text-secondary bg-transparent focus:outline-none focus:ring-2 focus:ring-accent rounded px-1"
                />
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-2xl font-semibold tabular-nums text-text">
                {scored ? `${candidate.overallScore}%` : '—'}
              </div>
              <div className="text-[10px] uppercase tracking-wide text-text-tertiary mt-0.5">
                Directional fit
              </div>
            </div>
          </div>
        </section>

        {/* Summary */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary mb-2">
            Summary
          </h3>
          <textarea
            value={candidate.summary}
            onChange={(e) => onChange({ summary: e.target.value })}
            rows={4}
            placeholder="One-paragraph executive summary…"
            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
          />
        </section>

        {/* Career overview */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
              Career overview
            </h3>
            <button
              type="button"
              onClick={addCareerEntry}
              className="text-xs font-medium text-accent hover:text-accent-hover transition-colors"
            >
              + Add entry
            </button>
          </div>

          {(candidate.careerHistory ?? []).length === 0 ? (
            <p className="text-xs text-text-tertiary italic">
              No career history captured yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {candidate.careerHistory!.map((entry, idx) => (
                <li
                  key={entry.id}
                  className="group rounded-md border border-border bg-bg p-3"
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="text"
                      value={entry.period}
                      onChange={(e) =>
                        patchCareer(idx, { period: e.target.value })
                      }
                      placeholder="2020-2024"
                      className="w-24 shrink-0 text-xs font-medium text-text-secondary bg-transparent focus:outline-none focus:ring-2 focus:ring-accent rounded px-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={entry.role}
                          onChange={(e) =>
                            patchCareer(idx, { role: e.target.value })
                          }
                          placeholder="Role"
                          className="flex-1 text-sm font-semibold text-text bg-transparent focus:outline-none focus:ring-2 focus:ring-accent rounded px-1"
                        />
                        <span className="text-text-tertiary text-sm self-center">
                          at
                        </span>
                        <input
                          type="text"
                          value={entry.company}
                          onChange={(e) =>
                            patchCareer(idx, { company: e.target.value })
                          }
                          placeholder="Company"
                          className="flex-1 text-sm text-text bg-transparent focus:outline-none focus:ring-2 focus:ring-accent rounded px-1"
                        />
                      </div>
                      <textarea
                        value={entry.highlights.join('\n')}
                        onChange={(e) =>
                          patchCareer(idx, {
                            highlights: e.target.value
                              .split('\n')
                              .filter(Boolean),
                          })
                        }
                        rows={Math.max(2, entry.highlights.length)}
                        placeholder="One highlight per line"
                        className="mt-1 w-full text-xs text-text-secondary bg-transparent focus:outline-none focus:ring-2 focus:ring-accent rounded px-1 resize-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCareerEntry(idx)}
                      className="text-[11px] text-text-tertiary opacity-0 group-hover:opacity-100 hover:text-rose-600 transition-all"
                      aria-label="Remove career entry"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Scorecard */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
              Scorecard
            </h3>
            <button
              type="button"
              onClick={onRescore}
              disabled={scoring}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover transition-colors disabled:opacity-50"
            >
              {scoring ? (
                <>
                  <LoadingDots />
                  <span>Scoring…</span>
                </>
              ) : (
                <span>{scored ? 'Re-score with AI' : 'Score with AI'}</span>
              )}
            </button>
          </div>

          <ScorecardTable
            title="Must-haves"
            criteria={scorecard.mustHaves}
            scoresById={scoresById}
            onSetScore={setScore}
            onSetRationale={setRationale}
          />
          <ScorecardTable
            title="Nice-to-haves"
            criteria={scorecard.niceToHaves}
            scoresById={scoresById}
            onSetScore={setScore}
            onSetRationale={setRationale}
          />
          <ScorecardTable
            title="Leadership & personality"
            criteria={scorecard.leadership}
            scoresById={scoresById}
            onSetScore={setScore}
            onSetRationale={setRationale}
          />
          <ScorecardTable
            title="First-year success"
            criteria={scorecard.successFactors}
            scoresById={scoresById}
            onSetScore={setScore}
            onSetRationale={setRationale}
          />
        </section>

        {/* Footer */}
        <section className="pt-4 border-t border-border">
          <button
            type="button"
            onClick={onRemove}
            className="text-xs font-medium text-text-tertiary hover:text-rose-600 transition-colors"
          >
            Remove candidate
          </button>
        </section>
      </div>
    </SlideOutPanel>
  )
}

// ---------------------------------------------------------------------------
// ScorecardTable — per-category scoring rows
// ---------------------------------------------------------------------------

function ScorecardTable({
  title,
  criteria,
  scoresById,
  onSetScore,
  onSetRationale,
}: {
  title: string
  criteria: ScorecardCriterion[]
  scoresById: Map<string, CandidateScore>
  onSetScore: (criterion: ScorecardCriterion, score: number) => void
  onSetRationale: (criterionId: string, rationale: string) => void
}) {
  if (criteria.length === 0) return null

  return (
    <div className="mb-5">
      <h4 className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary mb-1.5">
        {title}
      </h4>
      <ul className="divide-y divide-border rounded-md border border-border overflow-hidden">
        {criteria.map((c) => {
          const current = scoresById.get(c.id)
          const score = current?.score ?? 0
          return (
            <li key={c.id} className="p-3 bg-bg">
              <div className="flex items-center gap-3">
                <p className="flex-1 text-xs text-text font-medium">{c.text}</p>
                <StepperBar value={score} onChange={(v) => onSetScore(c, v)} />
                <span className="w-8 text-right text-xs tabular-nums text-text-secondary">
                  {score > 0 ? `${score}/5` : '—'}
                </span>
              </div>
              {(current?.rationale || score > 0) && (
                <input
                  type="text"
                  value={current?.rationale ?? ''}
                  onChange={(e) => onSetRationale(c.id, e.target.value)}
                  placeholder="Add rationale…"
                  className="mt-1.5 w-full text-[11px] text-text-secondary bg-transparent focus:outline-none focus:ring-1 focus:ring-accent rounded px-1 placeholder:text-text-placeholder"
                />
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function StepperBar({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n === value ? 0 : n)}
          className={`h-4 w-6 rounded-sm transition-colors ${
            n <= value
              ? 'bg-accent'
              : 'bg-bg-muted hover:bg-border'
          }`}
          aria-label={`Score ${n}`}
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// PhotoBlock — avatar + change/remove controls + drag-drop + paste
// ---------------------------------------------------------------------------

function PhotoBlock({
  candidate,
  open,
  onClear,
}: {
  candidate: Candidate
  open: boolean
  onClear: () => void
}) {
  const deckId = useEditorStore((s) => s.deck?.id ?? '')
  const patchCandidate = useEditorStore((s) => s.patchCandidate)

  const { inputRef, uploading, previewUrl, error, upload, openPicker } =
    useCandidatePhotoUpload({
      deckId,
      candidateId: candidate.id,
      onUploaded: (photoUrl) => patchCandidate(candidate.id, { photoUrl }),
    })

  // Keep a ref to `upload` so the paste effect below doesn't re-subscribe
  // on every render (the hook memoises it, but we still want tight coupling).
  const uploadRef = useRef(upload)
  useEffect(() => {
    uploadRef.current = upload
  }, [upload])

  // Global paste listener — active only while the panel is open. Skips paste
  // events that originate inside a text field so pasting into the name/role
  // inputs behaves normally.
  useEffect(() => {
    if (!open) return
    function handlePaste(e: ClipboardEvent) {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName
      if (
        target?.isContentEditable ||
        tag === 'INPUT' ||
        tag === 'TEXTAREA'
      ) {
        return
      }
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            e.preventDefault()
            uploadRef.current(file)
            return
          }
        }
      }
    }
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [open])

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer?.files?.[0]
    if (file?.type.startsWith('image/')) upload(file)
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault()
  }

  const displayUrl = previewUrl ?? candidate.photoUrl
  const hasPhoto = displayUrl.trim() !== ''

  return (
    <div className="shrink-0">
      <button
        type="button"
        onClick={openPicker}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        disabled={uploading}
        className={`group relative h-16 w-16 overflow-hidden rounded-md transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          hasPhoto ? '' : 'bg-bg-muted'
        } ${uploading ? 'cursor-wait' : 'cursor-pointer'}`}
        aria-label={
          hasPhoto
            ? `Replace photo for ${candidate.name || 'candidate'}`
            : `Upload photo for ${candidate.name || 'candidate'}`
        }
      >
        {hasPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayUrl}
            alt={candidate.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-text-tertiary">
            {getInitials(candidate.name)}
          </span>
        )}

        <span
          className={`absolute inset-0 flex items-center justify-center transition-colors ${
            uploading
              ? 'bg-black/40'
              : 'bg-black/0 group-hover:bg-black/35 group-focus-visible:bg-black/35'
          }`}
          aria-hidden="true"
        >
          {uploading ? (
            <svg
              className="h-5 w-5 animate-spin text-white"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeOpacity="0.3"
                strokeWidth="3"
              />
              <path
                d="M22 12a10 10 0 0 1-10 10"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          )}
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) upload(file)
          e.target.value = ''
        }}
      />

      <div className="mt-2 flex items-center gap-2 text-[11px]">
        <button
          type="button"
          onClick={openPicker}
          disabled={uploading}
          className="font-medium text-accent hover:text-accent-hover transition-colors disabled:opacity-50"
        >
          {hasPhoto ? 'Change' : 'Upload'}
        </button>
        {candidate.photoUrl && (
          <>
            <span className="text-text-tertiary">·</span>
            <button
              type="button"
              onClick={onClear}
              disabled={uploading}
              className="font-medium text-text-tertiary hover:text-rose-600 transition-colors disabled:opacity-50"
            >
              Remove
            </button>
          </>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-1 text-[11px] font-medium text-error">
          {error}
        </p>
      )}
    </div>
  )
}
