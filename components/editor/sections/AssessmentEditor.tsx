'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AssessmentSection, AssessmentPillar } from '@/lib/types'

interface AssessmentEditorProps {
  data: AssessmentSection
  onChange: (data: AssessmentSection) => void
}

// ---------------------------------------------------------------------------
// Hogan template — the current default (and only) assessment offering.
// ---------------------------------------------------------------------------

const HOGAN_TEMPLATE: AssessmentSection = {
  assessor: {
    name: 'Marlies Hoogvliet',
    title: 'Certified Hogan Leadership Assessor',
    photoUrl: '',
    bio: 'Marlies is our in-house assessment specialist and certified Hogan practitioner. Marlies uses the Hogan Assessment Suite, the gold standard for leadership assessment globally, trusted by over 75% of Fortune 500 companies. More information: hoganassessments.com.',
  },
  providerName: 'Hogan',
  sampleReport: null,
  mtAssessment: null,
  pillars: [
    {
      key: 'HPI',
      label: 'Hogan Personality Inventory (HPI)',
      description:
        'Measures day-to-day personality: how the candidate leads, communicates and makes decisions when performing at their best. Predicts reputation and leadership style.',
    },
    {
      key: 'HDS',
      label: 'Hogan Development Survey (HDS)',
      description:
        'Identifies performance risks and derailers: behavioural tendencies that emerge under stress, fatigue or pressure. Critical for understanding how a leader might fail, not just how they succeed.',
    },
    {
      key: 'MVPI',
      label: 'Motives, Values, Preferences Inventory (MVPI)',
      description:
        'Maps core values and motivational drivers. Predicts cultural fit, leadership climate and what type of organisation the candidate will thrive in.',
    },
  ],
  processDescription:
    'The assessment consists of a written part (approximately 1.5 hours) and a 1.5-hour psychological interview per candidate, combining the three Hogan instruments with a structured leadership interview. Marlies produces a comprehensive advisory report with scores, narrative interpretation, risk factors and development recommendations, verbally presented to the client alongside written documentation. We assess the final 2 candidates on the shortlist.',
  purposes: [
    'As a selection instrument for the final hiring decision',
    'As input for structured reference checks',
    'As a foundation for successful onboarding of the selected candidate',
  ],
  costsNote: 'Assessment costs are included in our search fee.',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isEmpty(data: AssessmentSection): boolean {
  return (
    data.assessor.name.trim() === '' &&
    data.pillars.length === 0 &&
    data.processDescription.trim() === '' &&
    data.purposes.length === 0 &&
    data.costsNote.trim() === ''
  )
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AssessmentEditor({ data, onChange }: AssessmentEditorProps) {
  const previousRef = useRef<AssessmentSection | null>(null)
  const [templateApplied, setTemplateApplied] = useState(false)

  const empty = isEmpty(data)

  function clearUndo() {
    previousRef.current = null
    setTemplateApplied(false)
  }

  function applyTemplate() {
    previousRef.current = data
    setTemplateApplied(true)
    onChange(HOGAN_TEMPLATE)
  }

  function undoApply() {
    if (!previousRef.current) return
    onChange(previousRef.current)
    clearUndo()
  }

  // -- Assessor ----------------------------------------------------------

  function updateAssessor(patch: Partial<AssessmentSection['assessor']>) {
    clearUndo()
    onChange({ ...data, assessor: { ...data.assessor, ...patch } })
  }

  // -- Pillars -----------------------------------------------------------

  function updatePillar(index: number, patch: Partial<AssessmentPillar>) {
    clearUndo()
    const pillars = data.pillars.map((p, i) => (i === index ? { ...p, ...patch } : p))
    onChange({ ...data, pillars })
  }

  // -- Process description ----------------------------------------------

  function updateProcess(value: string) {
    clearUndo()
    onChange({ ...data, processDescription: value })
  }

  // -- Purposes ----------------------------------------------------------

  function updatePurpose(index: number, value: string) {
    clearUndo()
    const purposes = [...data.purposes]
    purposes[index] = value
    onChange({ ...data, purposes })
  }

  function addPurpose() {
    clearUndo()
    onChange({ ...data, purposes: [...data.purposes, ''] })
  }

  function removePurpose(index: number) {
    clearUndo()
    onChange({ ...data, purposes: data.purposes.filter((_, i) => i !== index) })
  }

  // -- Costs note --------------------------------------------------------

  function updateCostsNote(value: string) {
    clearUndo()
    onChange({ ...data, costsNote: value })
  }

  // -- Render ------------------------------------------------------------

  if (empty) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={applyTemplate}
          className="w-full border border-border rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-accent-light hover:border-accent transition-colors group text-left"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-light">
              <svg className="h-4.5 w-4.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-text">Start from Hogan template</p>
              <p className="text-xs text-text-secondary">Pre-filled with assessor, HPI/HDS/MVPI pillars, process and cost note</p>
            </div>
          </div>
          <svg className="h-5 w-5 text-text-tertiary group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Undo banner */}
      <AnimatePresence>
        {templateApplied && previousRef.current && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-between rounded-lg border border-accent/20 bg-accent-light px-4 py-2.5"
          >
            <span className="text-xs text-text-secondary">Hogan template applied</span>
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

      {/* Assessor card */}
      <section className="border border-border rounded-lg bg-white p-4">
        <div className="flex items-center gap-2 mb-3">
          <svg className="h-4 w-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a7.5 7.5 0 1115 0" />
          </svg>
          <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Assessor</span>
        </div>

        <div className="flex gap-4">
          {/* Avatar */}
          <div className="shrink-0">
            {data.assessor.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.assessor.photoUrl}
                alt={data.assessor.name}
                className="h-20 w-20 rounded-md object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-md bg-bg-muted text-lg font-semibold text-text-tertiary">
                {getInitials(data.assessor.name)}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-1.5">
            <input
              type="text"
              value={data.assessor.name}
              onChange={(e) => updateAssessor({ name: e.target.value })}
              placeholder="Assessor name"
              className="w-full text-sm font-semibold text-text bg-transparent outline-none border-b border-transparent focus:border-accent transition-colors"
            />
            <input
              type="text"
              value={data.assessor.title}
              onChange={(e) => updateAssessor({ title: e.target.value })}
              placeholder="Title / certification"
              className="w-full text-xs text-accent uppercase tracking-wide bg-transparent outline-none border-b border-transparent focus:border-accent/30 transition-colors"
            />
            <textarea
              value={data.assessor.bio}
              onChange={(e) => updateAssessor({ bio: e.target.value })}
              rows={3}
              placeholder="Short bio..."
              className="w-full text-sm text-text-secondary bg-transparent outline-none resize-none border-b border-transparent focus:border-accent/30 transition-colors"
            />
            <input
              type="text"
              value={data.assessor.photoUrl}
              onChange={(e) => updateAssessor({ photoUrl: e.target.value })}
              placeholder="Photo URL (optional)"
              className="w-full text-xs text-text-tertiary bg-transparent outline-none border-b border-transparent focus:border-accent/30 transition-colors"
            />
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="border border-border rounded-lg bg-bg-subtle p-4">
        <div className="flex items-center gap-2 mb-3">
          <svg className="h-4 w-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
          </svg>
          <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Hogan instruments</span>
        </div>

        <div className="space-y-3">
          {data.pillars.map((pillar, i) => (
            <div key={pillar.key} className="border border-border rounded-md bg-white p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-semibold text-accent bg-accent-light rounded px-1.5 py-0.5 tracking-wide">
                  {pillar.key}
                </span>
                <input
                  type="text"
                  value={pillar.label}
                  onChange={(e) => updatePillar(i, { label: e.target.value })}
                  className="flex-1 text-sm font-semibold text-text bg-transparent outline-none border-b border-transparent focus:border-accent transition-colors"
                  placeholder="Label"
                />
              </div>
              <textarea
                value={pillar.description}
                onChange={(e) => updatePillar(i, { description: e.target.value })}
                rows={2}
                className="w-full text-sm text-text-secondary bg-transparent outline-none resize-none border-b border-transparent focus:border-accent/30 transition-colors"
                placeholder="Describe this instrument..."
              />
            </div>
          ))}
        </div>
      </section>

      {/* Process description */}
      <section className="border border-border rounded-lg bg-white p-4">
        <div className="flex items-center gap-2 mb-2">
          <svg className="h-4 w-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l2.25 2.25L15 12m-3-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Process</span>
        </div>
        <textarea
          value={data.processDescription}
          onChange={(e) => updateProcess(e.target.value)}
          rows={5}
          placeholder="Describe the assessment process, duration, deliverables..."
          className="w-full text-sm text-text-secondary bg-transparent outline-none resize-none leading-relaxed"
        />
      </section>

      {/* Purposes */}
      <section className="border border-border rounded-lg bg-white p-4">
        <div className="flex items-center gap-2 mb-3">
          <svg className="h-4 w-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Purposes</span>
        </div>

        <div className="space-y-1.5 group/list">
          {data.purposes.map((purpose, i) => (
            <div key={i} className="flex items-center gap-2 group/item">
              <div className="h-1.5 w-1.5 rounded-full bg-accent/40 shrink-0" />
              <input
                type="text"
                value={purpose}
                onChange={(e) => updatePurpose(i, e.target.value)}
                placeholder="Purpose..."
                className="flex-1 text-sm text-text-secondary bg-transparent outline-none border-b border-transparent focus:border-accent/30 transition-colors"
              />
              <button
                type="button"
                onClick={() => removePurpose(i)}
                className="h-5 w-5 rounded flex items-center justify-center text-text-tertiary hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-all"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addPurpose}
          className="mt-2 text-[11px] text-text-tertiary hover:text-accent transition-colors"
        >
          + Add purpose
        </button>
      </section>

      {/* Costs note */}
      <section className="border border-border rounded-lg bg-white p-4">
        <div className="flex items-center gap-2 mb-2">
          <svg className="h-4 w-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
          </svg>
          <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Cost note</span>
        </div>
        <input
          type="text"
          value={data.costsNote}
          onChange={(e) => updateCostsNote(e.target.value)}
          placeholder="e.g. Assessment costs are included in our search fee."
          className="w-full text-sm text-text-secondary bg-transparent outline-none"
        />
      </section>

      {/* Re-apply template (secondary) */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={applyTemplate}
          className="rounded-md border border-border px-3 py-2 text-xs font-medium text-text-secondary hover:text-accent hover:border-accent hover:bg-accent-light transition-colors"
        >
          Reset to Hogan template
        </button>
      </div>
    </div>
  )
}
