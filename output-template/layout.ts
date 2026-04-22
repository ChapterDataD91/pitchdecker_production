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
import type { OutputStrings } from './strings'

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
  title: (s: OutputStrings) => string
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
  render: (
    deck: Deck,
    brand: Brand,
    strings: OutputStrings,
    slugMap: Map<string, string>,
  ) => string
}

// Every non-cover section can be toggled off in the editor. When off, we skip
// it in both preview and publish — the consultant has made a deliberate choice
// to omit it from the deck.
const isDisabled = (deck: Deck, id: Exclude<SectionId, 'cover'>): boolean =>
  (deck.sections[id] as { enabled?: boolean }).enabled === false

export const ACCORDION_SECTIONS: AccordionSectionDef[] = [
  {
    id: 'team',
    title: (s) => s.sectionTitles.team,
    skipInPublish: (deck) => isDisabled(deck, 'team'),
    skipInPreview: (deck) => isDisabled(deck, 'team'),
    render: (deck, brand, strings) => renderTeam(deck.sections.team, brand, strings),
  },
  {
    id: 'searchProfile',
    title: (s) => s.sectionTitles.searchProfile,
    skipInPublish: (deck) => isDisabled(deck, 'searchProfile'),
    skipInPreview: (deck) => isDisabled(deck, 'searchProfile'),
    render: (deck, brand, strings) =>
      renderSearchProfile(deck.sections.searchProfile, brand, strings),
  },
  {
    id: 'salary',
    title: (s) => s.sectionTitles.salary,
    skipInPublish: (deck) => isDisabled(deck, 'salary'),
    skipInPreview: (deck) => isDisabled(deck, 'salary'),
    render: (deck, brand, strings) => renderSalary(deck.sections.salary, brand, strings),
  },
  {
    id: 'credentials',
    title: (s) => s.sectionTitles.credentials,
    skipInPublish: (deck) => isDisabled(deck, 'credentials'),
    skipInPreview: (deck) => isDisabled(deck, 'credentials'),
    render: (deck, brand, strings) =>
      renderCredentials(deck.sections.credentials, brand, strings),
  },
  {
    id: 'timeline',
    title: (s) => s.sectionTitles.timeline,
    skipInPublish: (deck) => isDisabled(deck, 'timeline'),
    skipInPreview: (deck) => isDisabled(deck, 'timeline'),
    render: (deck, brand, strings) =>
      renderTimeline(deck.sections.timeline, brand, strings),
  },
  {
    id: 'assessment',
    title: (s) => s.sectionTitles.assessment,
    anchorId: 'assessment',
    skipInPublish: (deck) => isDisabled(deck, 'assessment'),
    skipInPreview: (deck) => isDisabled(deck, 'assessment'),
    render: (deck, brand, strings) =>
      renderAssessment(deck.sections.assessment, brand, strings),
  },
  {
    id: 'personas',
    title: (s) => s.sectionTitles.personas,
    skipInPublish: (deck) => isDisabled(deck, 'personas'),
    skipInPreview: (deck) => isDisabled(deck, 'personas'),
    render: (deck, brand, strings) =>
      renderPersonas(deck.sections.personas, brand, strings),
  },
  {
    id: 'scorecard',
    title: (s) => s.sectionTitles.scorecard,
    skipInPublish: (deck) => isDisabled(deck, 'scorecard'),
    skipInPreview: (deck) => isDisabled(deck, 'scorecard'),
    render: (deck, brand, strings) =>
      renderScorecard(deck.sections.scorecard, brand, strings),
  },
  {
    id: 'candidates',
    title: (s) => s.sectionTitles.candidates,
    anchorId: 'candidates',
    skipInPublish: (deck) => isDisabled(deck, 'candidates'),
    skipInPreview: (deck) => isDisabled(deck, 'candidates'),
    render: (deck, brand, strings, slugMap) =>
      renderCandidates(deck.sections.candidates, brand, strings, slugMap),
  },
  {
    id: 'fee',
    title: (s) => s.sectionTitles.fee,
    bodyClassExtra: 'sb--centered',
    skipInPublish: (deck) => isDisabled(deck, 'fee'),
    skipInPreview: (deck) => isDisabled(deck, 'fee'),
    render: (deck, brand, strings) => renderFee(deck.sections.fee, brand, strings),
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
  strings: OutputStrings,
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
      body = section.render(deck, brand, strings, slugMap)
    } catch (err) {
      if (mode === 'publish') throw err
      const msg = err instanceof Error ? err.message : String(err)
      body = `<div class="ot-empty" style="background:#fef2f2;color:#c4694a;border-color:#fca5a1">Render error in ${section.id}: ${msg}</div>`
    }

    rendered.push(
      renderAccordionSection({
        number: visibleNumber,
        title: section.title(strings),
        anchorId: section.anchorId,
        bodyClassExtra: section.bodyClassExtra,
        open: visibleNumber === 1,
        body,
      }),
    )
  }

  return rendered.join('\n')
}
