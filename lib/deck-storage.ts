// ---------------------------------------------------------------------------
// Deck storage — MongoDB-backed.
//
// Decks live in TextDocs.pitchdecker, one document per deck.
// The document mirrors the Deck interface verbatim, with `_id` duplicating
// `Deck.id` (UUID). All I/O methods are async; the two pure helpers
// (isSectionComplete, computeCompletedSections) stay synchronous.
// ---------------------------------------------------------------------------

import type { Collection } from 'mongodb'
import type { Deck, DeckSummary, DeckSections } from '@/lib/types'
import { createEmptyDeck } from '@/lib/types'
import { SECTIONS } from '@/lib/theme'
import type { SectionId } from '@/lib/theme'
import { getDb } from '@/lib/db/mongodb'

const COLLECTION_NAME = 'pitchdecker'

type DeckDoc = Deck & { _id: string }

async function decks(): Promise<Collection<DeckDoc>> {
  const db = await getDb()
  return db.collection<DeckDoc>(COLLECTION_NAME)
}

function stripId(doc: DeckDoc): Deck {
  const { _id, ...rest } = doc
  void _id
  return { ...rest, locale: rest.locale ?? 'nl' }
}

// ---------------------------------------------------------------------------
// Pure helpers (sync)
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

  // Any section explicitly excluded counts as complete — the consultant made a
  // deliberate decision to skip it and publish shouldn't block on it.
  const section = s[sectionId] as { enabled?: boolean }
  if (section.enabled === false) return true

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
      return (
        s.assessment.assessor.name.trim() !== '' &&
        s.assessment.pillars.length > 0 &&
        s.assessment.processDescription.trim() !== ''
      )
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
      return s.fee.feeMode === 'percentage' ? s.fee.percentage > 0 : s.fee.amount > 0
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
    publishedDeployment: deck.publishedDeployment
      ? {
          status: deck.publishedDeployment.status,
          version: deck.publishedDeployment.version,
        }
      : undefined,
  }
}

// ---------------------------------------------------------------------------
// Public API (async)
// ---------------------------------------------------------------------------

export const deckStorage = {
  async getAll(): Promise<DeckSummary[]> {
    const col = await decks()
    const docs = await col.find({}).sort({ updatedAt: -1 }).toArray()
    return docs.map((doc) => toSummary(stripId(doc)))
  },

  async get(id: string): Promise<Deck | undefined> {
    const col = await decks()
    const doc = await col.findOne({ _id: id })
    return doc ? stripId(doc) : undefined
  },

  async create(id: string, clientName: string, roleTitle: string): Promise<Deck> {
    const deck = createEmptyDeck(id, clientName, roleTitle)
    const col = await decks()
    await col.insertOne({ _id: id, ...deck })
    return deck
  },

  async update(
    id: string,
    partial: Partial<Omit<Deck, 'id' | 'sections'>>,
  ): Promise<Deck | undefined> {
    const col = await decks()
    const result = await col.findOneAndUpdate(
      { _id: id },
      { $set: { ...partial, updatedAt: new Date().toISOString() } },
      { returnDocument: 'after' },
    )
    return result ? stripId(result) : undefined
  },

  async updateSection<K extends keyof DeckSections>(
    deckId: string,
    sectionKey: K,
    data: Partial<DeckSections[K]>,
  ): Promise<Deck | undefined> {
    const col = await decks()
    const existing = await col.findOne({ _id: deckId })
    if (!existing) return undefined

    const mergedSection = {
      ...existing.sections[sectionKey],
      ...data,
    } as DeckSections[K]

    const result = await col.findOneAndUpdate(
      { _id: deckId },
      {
        $set: {
          [`sections.${sectionKey}`]: mergedSection,
          updatedAt: new Date().toISOString(),
        },
      },
      { returnDocument: 'after' },
    )
    return result ? stripId(result) : undefined
  },

  async getSection<K extends keyof DeckSections>(
    deckId: string,
    sectionKey: K,
  ): Promise<DeckSections[K] | undefined> {
    const col = await decks()
    const doc = await col.findOne(
      { _id: deckId },
      { projection: { [`sections.${sectionKey}`]: 1 } },
    )
    return doc?.sections?.[sectionKey]
  },

  async delete(id: string): Promise<boolean> {
    const col = await decks()
    const result = await col.deleteOne({ _id: id })
    return result.deletedCount === 1
  },

  isSectionComplete,
  computeCompletedSections,
}
