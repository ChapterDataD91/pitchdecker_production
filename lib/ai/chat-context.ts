// ---------------------------------------------------------------------------
// Builds the context object sent with each chat API request.
// Summarizes the deck so Claude knows the full picture, not just one section.
// ---------------------------------------------------------------------------

import type { Deck, DeckSections } from '@/lib/types'
import type { SectionId } from '@/lib/theme'
import type { ChatContext, DeckDocument } from '@/lib/ai-types'
import { SECTIONS } from '@/lib/theme'

function summarizeSection(sectionId: SectionId, data: DeckSections[keyof DeckSections]): string {
  const section = data as unknown as Record<string, unknown>

  switch (sectionId) {
    case 'cover':
      return `Client: ${section.clientName ?? '—'}, Role: ${section.roleTitle ?? '—'}`
    case 'team': {
      const team = section.leadTeam as Array<Record<string, unknown>> | undefined
      return `${team?.length ?? 0} team members`
    }
    case 'searchProfile': {
      const mh = section.mustHaves as unknown[] | undefined
      const nth = section.niceToHaves as unknown[] | undefined
      return `${mh?.length ?? 0} must-haves, ${nth?.length ?? 0} nice-to-haves`
    }
    case 'salary':
      return section.baseLow ? `Base: ${section.baseLow}–${section.baseHigh}` : 'Not set'
    case 'credentials': {
      const axes = section.axes as unknown[] | undefined
      return `${axes?.length ?? 0} credential axes`
    }
    case 'timeline': {
      const phases = section.phases as unknown[] | undefined
      return `${phases?.length ?? 0} phases`
    }
    case 'assessment': {
      const pillars = section.pillars as unknown[] | undefined
      const assessor = section.assessor as { name?: string } | undefined
      const name = assessor?.name?.trim()
      return name
        ? `assessor: ${name}, ${pillars?.length ?? 0} pillars`
        : `${pillars?.length ?? 0} pillars, no assessor`
    }
    case 'personas': {
      const archetypes = section.archetypes as unknown[] | undefined
      return `${archetypes?.length ?? 0} archetypes`
    }
    case 'scorecard': {
      const mh = section.mustHaves as unknown[] | undefined
      const nth = section.niceToHaves as unknown[] | undefined
      const ld = section.leadership as unknown[] | undefined
      const sf = section.successFactors as unknown[] | undefined
      const total = (mh?.length ?? 0) + (nth?.length ?? 0) + (ld?.length ?? 0) + (sf?.length ?? 0)
      return `${total} scorecard criteria`
    }
    case 'candidates': {
      const candidates = section.candidates as unknown[] | undefined
      return `${candidates?.length ?? 0} candidates`
    }
    case 'fee':
      return section.feeStructure ? `Structure: ${section.feeStructure}` : 'Not set'
    default:
      return 'No data'
  }
}

export function buildChatContext(
  deck: Deck,
  activeSection: SectionId,
  documents: DeckDocument[],
): ChatContext {
  const deckSummary = SECTIONS.map((s) => {
    const data = deck.sections[s.id as keyof DeckSections]
    const summary = summarizeSection(s.id, data)
    const active = s.id === activeSection ? ' (active)' : ''
    return `- ${s.label}${active}: ${summary}`
  }).join('\n')

  const uploadedDocuments = documents.map((doc) => ({
    fileName: doc.fileName,
    extractedText: doc.extractedText,
  }))

  return {
    sectionType: activeSection,
    sectionData: deck.sections[activeSection as keyof DeckSections],
    clientName: deck.clientName ?? deck.sections.cover.clientName ?? '',
    roleTitle: deck.roleTitle ?? deck.sections.cover.roleTitle ?? '',
    deckSummary,
    uploadedDocuments,
  }
}
