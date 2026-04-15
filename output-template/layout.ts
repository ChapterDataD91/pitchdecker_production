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
  render: (deck: Deck, brand: Brand, slugMap: Map<string, string>) => string
}

export const ACCORDION_SECTIONS: AccordionSectionDef[] = [
  {
    id: 'team',
    title: 'Our Team for this search mandate',
    render: (deck, brand) => renderTeam(deck.sections.team, brand),
  },
  {
    id: 'searchProfile',
    title: 'Search Profile: Must-Haves & Nice-to-Haves',
    render: (deck, brand) => renderSearchProfile(deck.sections.searchProfile, brand),
  },
  {
    id: 'salary',
    title: 'Expected Salary Package',
    render: (deck, brand) => renderSalary(deck.sections.salary, brand),
  },
  {
    id: 'credentials',
    title: 'Credentials',
    render: (deck, brand) => renderCredentials(deck.sections.credentials, brand),
  },
  {
    id: 'timeline',
    title: 'Process & Timeline',
    render: (deck, brand) => renderTimeline(deck.sections.timeline, brand),
  },
  {
    id: 'assessment',
    title: 'Assessment',
    anchorId: 'assessment',
    render: (deck, brand) => renderAssessment(deck.sections.assessment, brand),
  },
  {
    id: 'personas',
    title: 'Three Candidate Personas',
    render: (deck, brand) => renderPersonas(deck.sections.personas, brand),
  },
  {
    id: 'scorecard',
    title: 'Selection Scorecard',
    render: (deck, brand) => renderScorecard(deck.sections.scorecard, brand),
  },
  {
    id: 'candidates',
    title: 'Sample Candidates',
    anchorId: 'candidates',
    render: (deck, brand, slugMap) =>
      renderCandidates(deck.sections.candidates, brand, slugMap),
  },
  {
    id: 'fee',
    title: 'Fee Proposal',
    bodyClassExtra: 'sb--centered',
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
