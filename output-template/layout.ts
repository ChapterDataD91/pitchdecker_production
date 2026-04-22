// ---------------------------------------------------------------------------
// Layout orchestrator.
//
// SECTIONS is the single source of truth for section order in the output.
// A different brand would edit this list (reorder, omit, rename titles)
// without touching individual section renderers.
//
// Cover is not an accordion section — it becomes the hero/header above the
// accordion. Sections where sectionStatuses[key] === 'empty' are omitted.
// ---------------------------------------------------------------------------

import type { Deck, SectionStatuses } from '@/lib/types'
import type { Brand } from './brand'

type SectionId = keyof SectionStatuses

import { renderAccordionSection } from './primitives/accordion'

import { renderTeam } from './sections/team'
import { renderSearchProfile } from './sections/searchProfile'
import { renderSalary } from './sections/salary'
import { renderCredentials } from './sections/credentials'
import { renderTimeline } from './sections/timeline'
import { renderAssessment } from './sections/assessment'
import { renderPersonas } from './sections/personas'
import { renderScorecard } from './sections/scorecard'
import { renderCandidates } from './sections/candidates'
import { renderFee } from './sections/fee'

interface AccordionSectionDef {
  id: Exclude<SectionId, 'cover'>
  title: string
  anchorId?: string
  /** Optional class added to the .sb body wrapper, e.g. "sb--centered" for Fee. */
  bodyClassExtra?: string
  /**
   * Optional per-section opt-out check. When this returns true in publish
   * mode the section is omitted entirely from the output (no accordion item).
   * Preview mode ignores this hook — the renderer decides how to show the
   * excluded state so the consultant sees their decision reflected.
   */
  skipInPublish?: (deck: Deck) => boolean
  /**
   * Optional per-section opt-out check for preview mode. When true, the
   * section is omitted from the preview output entirely. Used for sections
   * the consultant explicitly toggles off (e.g. Sample Candidates when not
   * delivering any for this mandate).
   */
  skipInPreview?: (deck: Deck) => boolean
  render: (deck: Deck, brand: Brand, slugMap: Map<string, string>) => string
}

// Every non-cover section can be toggled off in the editor. When off, we skip
// it in both preview and publish — the consultant has made a deliberate choice
// to omit it from the deck.
const isDisabled = (deck: Deck, id: Exclude<SectionId, 'cover'>): boolean =>
  (deck.sections[id] as { enabled?: boolean }).enabled === false

export const ACCORDION_SECTIONS: AccordionSectionDef[] = [
  {
    id: 'team',
    title: 'Our Team for this search mandate',
    skipInPublish: (deck) => isDisabled(deck, 'team'),
    skipInPreview: (deck) => isDisabled(deck, 'team'),
    render: (deck, brand) => renderTeam(deck.sections.team, brand),
  },
  {
    id: 'searchProfile',
    title: 'Search Profile: Must-Haves & Nice-to-Haves',
    skipInPublish: (deck) => isDisabled(deck, 'searchProfile'),
    skipInPreview: (deck) => isDisabled(deck, 'searchProfile'),
    render: (deck, brand) => renderSearchProfile(deck.sections.searchProfile, brand),
  },
  {
    id: 'salary',
    title: 'Expected Salary Package',
    skipInPublish: (deck) => isDisabled(deck, 'salary'),
    skipInPreview: (deck) => isDisabled(deck, 'salary'),
    render: (deck, brand) => renderSalary(deck.sections.salary, brand),
  },
  {
    id: 'credentials',
    title: 'Credentials',
    skipInPublish: (deck) => isDisabled(deck, 'credentials'),
    skipInPreview: (deck) => isDisabled(deck, 'credentials'),
    render: (deck, brand) => renderCredentials(deck.sections.credentials, brand),
  },
  {
    id: 'timeline',
    title: 'Process & Timeline',
    skipInPublish: (deck) => isDisabled(deck, 'timeline'),
    skipInPreview: (deck) => isDisabled(deck, 'timeline'),
    render: (deck, brand) => renderTimeline(deck.sections.timeline, brand),
  },
  {
    id: 'assessment',
    title: 'Assessment',
    anchorId: 'assessment',
    skipInPublish: (deck) => isDisabled(deck, 'assessment'),
    skipInPreview: (deck) => isDisabled(deck, 'assessment'),
    render: (deck, brand) => renderAssessment(deck.sections.assessment, brand),
  },
  {
    id: 'personas',
    title: 'Three Candidate Personas',
    skipInPublish: (deck) => isDisabled(deck, 'personas'),
    skipInPreview: (deck) => isDisabled(deck, 'personas'),
    render: (deck, brand) => renderPersonas(deck.sections.personas, brand),
  },
  {
    id: 'scorecard',
    title: 'Selection Scorecard',
    skipInPublish: (deck) => isDisabled(deck, 'scorecard'),
    skipInPreview: (deck) => isDisabled(deck, 'scorecard'),
    render: (deck, brand) => renderScorecard(deck.sections.scorecard, brand),
  },
  {
    id: 'candidates',
    title: 'Sample Candidates',
    anchorId: 'candidates',
    skipInPublish: (deck) => isDisabled(deck, 'candidates'),
    skipInPreview: (deck) => isDisabled(deck, 'candidates'),
    render: (deck, brand, slugMap) =>
      renderCandidates(deck.sections.candidates, brand, slugMap),
  },
  {
    id: 'fee',
    title: 'Fee Proposal',
    bodyClassExtra: 'sb--centered',
    skipInPublish: (deck) => isDisabled(deck, 'fee'),
    skipInPreview: (deck) => isDisabled(deck, 'fee'),
    render: (deck, brand) => renderFee(deck.sections.fee, brand),
  },
]

/**
 * Pick a render mode:
 * - 'preview' renders every section (even empty), marking empty ones with a placeholder
 * - 'publish' omits empty sections entirely
 */
export type RenderMode = 'preview' | 'publish'

export function renderAccordion(
  deck: Deck,
  brand: Brand,
  slugMap: Map<string, string>,
  mode: RenderMode,
): string {
  const statuses: SectionStatuses = deck.sectionStatuses
  const rendered: string[] = []

  let visibleNumber = 0
  for (const section of ACCORDION_SECTIONS) {
    const status = statuses[section.id]
    if (mode === 'publish' && status === 'empty') continue
    if (mode === 'publish' && section.skipInPublish?.(deck)) continue
    if (mode === 'preview' && section.skipInPreview?.(deck)) continue

    visibleNumber++
    let body: string
    try {
      body = section.render(deck, brand, slugMap)
    } catch (err) {
      if (mode === 'publish') throw err
      const msg = err instanceof Error ? err.message : String(err)
      body = `<div class="ot-empty" style="background:#fef2f2;color:#c4694a;border-color:#fca5a1">Render error in ${section.id}: ${msg}</div>`
    }

    rendered.push(
      renderAccordionSection({
        number: visibleNumber,
        title: section.title,
        anchorId: section.anchorId,
        bodyClassExtra: section.bodyClassExtra,
        open: visibleNumber === 1,
        body,
      }),
    )
  }

  return rendered.join('\n')
}
