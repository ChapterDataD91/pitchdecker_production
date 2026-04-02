// ---------------------------------------------------------------------------
// In-memory deck storage — shared across all API routes
// Ephemeral: data is lost on server restart. Will be replaced with
// persistent storage (Azure SQL / MongoDB) when databases are connected.
// ---------------------------------------------------------------------------

import type { Deck, DeckSummary, DeckSections } from '@/lib/types'
import { createEmptyDeck } from '@/lib/types'
import { SECTIONS } from '@/lib/theme'
import type { SectionId } from '@/lib/theme'

const storage = new Map<string, Deck>()

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeCompletedSections(deck: Deck): number {
  let count = 0
  for (const section of SECTIONS) {
    if (isSectionComplete(deck, section.id)) {
      count++
    }
  }
  return count
}

function isSectionComplete(deck: Deck, sectionId: SectionId): boolean {
  const s = deck.sections

  switch (sectionId) {
    case 'cover':
      return s.cover.clientName.trim() !== '' && s.cover.roleTitle.trim() !== ''
    case 'team':
      return s.team.leadTeam.length > 0
    case 'searchProfile':
      return s.searchProfile.mustHaves.length > 0
    case 'salary':
      return s.salary.baseLow !== 0
    case 'credentials':
      return s.credentials.axes.length > 0 && s.credentials.axes.some(a => a.placements.length > 0)
    case 'timeline':
      return s.timeline.phases.length > 0
    case 'assessment':
      return s.assessment.methods.some(m => m.enabled)
    case 'personas':
      return s.personas.archetypes.length > 0
    case 'scorecard':
      return (
        s.scorecard.mustHaves.length > 0 ||
        s.scorecard.niceToHaves.length > 0 ||
        s.scorecard.leadership.length > 0 ||
        s.scorecard.successFactors.length > 0
      )
    case 'candidates':
      return s.candidates.candidates.length > 0
    case 'fee':
      return s.fee.feePercentage > 0
    default:
      return false
  }
}

function toSummary(deck: Deck): DeckSummary {
  return {
    id: deck.id,
    clientName: deck.clientName,
    roleTitle: deck.roleTitle,
    status: deck.status,
    completedSections: computeCompletedSections(deck),
    updatedAt: deck.updatedAt,
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const deckStorage = {
  /** Get all decks as lightweight summaries */
  getAll(): DeckSummary[] {
    return Array.from(storage.values()).map(toSummary)
  },

  /** Get a full deck by ID, or undefined if not found */
  get(id: string): Deck | undefined {
    return storage.get(id)
  },

  /** Create a new empty deck and store it */
  create(id: string, clientName: string, roleTitle: string): Deck {
    const deck = createEmptyDeck(id, clientName, roleTitle)
    storage.set(id, deck)
    return deck
  },

  /** Merge partial deck data (top-level fields, not sections) */
  update(id: string, partial: Partial<Omit<Deck, 'id' | 'sections'>>): Deck | undefined {
    const deck = storage.get(id)
    if (!deck) return undefined

    const updated: Deck = {
      ...deck,
      ...partial,
      updatedAt: new Date().toISOString(),
    }
    storage.set(id, updated)
    return updated
  },

  /** Update a specific section within a deck */
  updateSection<K extends keyof DeckSections>(
    deckId: string,
    sectionKey: K,
    data: Partial<DeckSections[K]>,
  ): Deck | undefined {
    const deck = storage.get(deckId)
    if (!deck) return undefined

    const updatedSection = {
      ...deck.sections[sectionKey],
      ...data,
    } as DeckSections[K]

    const updated: Deck = {
      ...deck,
      updatedAt: new Date().toISOString(),
      sections: {
        ...deck.sections,
        [sectionKey]: updatedSection,
      },
    }
    storage.set(deckId, updated)
    return updated
  },

  /** Get a specific section from a deck */
  getSection<K extends keyof DeckSections>(
    deckId: string,
    sectionKey: K,
  ): DeckSections[K] | undefined {
    const deck = storage.get(deckId)
    if (!deck) return undefined
    return deck.sections[sectionKey]
  },

  /** Delete a deck by ID */
  delete(id: string): boolean {
    return storage.delete(id)
  },

  /** Check if a section is complete */
  isSectionComplete,

  /** Count completed sections for a deck */
  computeCompletedSections,
}
