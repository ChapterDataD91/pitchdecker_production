// ---------------------------------------------------------------------------
// Editor Store — Zustand store for the deck editor
// Manages deck state, active section, auto-save with debouncing.
// ---------------------------------------------------------------------------

import { create } from 'zustand'
import type { Deck, DeckSections, SectionStatus } from '@/lib/types'
import type { SectionId } from '@/lib/theme'
import { SECTIONS } from '@/lib/theme'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SaveStatus = 'saved' | 'saving' | 'error' | 'idle'

interface EditorState {
  deck: Deck | null
  isLoading: boolean
  error: string | null
  activeSection: SectionId
  saveStatus: SaveStatus
}

interface EditorActions {
  setDeck: (deck: Deck) => void
  updateSection: <K extends keyof DeckSections>(
    sectionKey: K,
    data: Partial<DeckSections[K]>,
  ) => void
  setActiveSection: (sectionId: SectionId) => void
  setSaveStatus: (status: SaveStatus) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  getSectionStatus: (sectionId: SectionId) => SectionStatus
  getCompletedCount: () => number
}

type EditorStore = EditorState & EditorActions

// ---------------------------------------------------------------------------
// Debounce timer map (per section, so concurrent edits to different
// sections don't cancel each other)
// ---------------------------------------------------------------------------

const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>()

// ---------------------------------------------------------------------------
// Section status computation
// ---------------------------------------------------------------------------

function computeSectionStatus(deck: Deck, sectionId: SectionId): SectionStatus {
  const s = deck.sections

  switch (sectionId) {
    case 'cover': {
      const hasBoth = s.cover.clientName.trim() !== '' && s.cover.roleTitle.trim() !== ''
      if (hasBoth) return 'complete'
      const hasAny = s.cover.clientName.trim() !== '' || s.cover.roleTitle.trim() !== ''
      return hasAny ? 'in-progress' : 'empty'
    }
    case 'team':
      return s.team.leadTeam.length > 0 ? 'complete' : 'empty'
    case 'searchProfile':
      return s.searchProfile.mustHaves.length > 0 ? 'complete' : 'empty'
    case 'salary':
      return s.salary.baseLow !== 0 ? 'complete' : 'empty'
    case 'credentials': {
      if (s.credentials.axes.length === 0) return 'empty'
      const hasPlacement = s.credentials.axes.some((a) => a.placements.length > 0)
      return hasPlacement ? 'complete' : 'in-progress'
    }
    case 'timeline':
      return s.timeline.phases.length > 0 ? 'complete' : 'empty'
    case 'assessment': {
      const a = s.assessment
      const hasAny =
        a.assessor.name.trim() !== '' ||
        a.pillars.length > 0 ||
        a.processDescription.trim() !== '' ||
        a.purposes.length > 0 ||
        a.costsNote.trim() !== ''
      if (!hasAny) return 'empty'
      const hasCore = a.assessor.name.trim() !== '' && a.pillars.length > 0 && a.processDescription.trim() !== ''
      return hasCore ? 'complete' : 'in-progress'
    }
    case 'personas':
      return s.personas.archetypes.length > 0 ? 'complete' : 'empty'
    case 'scorecard': {
      const hasCriteria =
        s.scorecard.mustHaves.length > 0 ||
        s.scorecard.niceToHaves.length > 0 ||
        s.scorecard.leadership.length > 0 ||
        s.scorecard.successFactors.length > 0
      return hasCriteria ? 'complete' : 'empty'
    }
    case 'candidates':
      return s.candidates.candidates.length > 0 ? 'complete' : 'empty'
    case 'fee':
      return s.fee.amount > 0 ? 'complete' : 'empty'
    default:
      return 'empty'
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useEditorStore = create<EditorStore>((set, get) => ({
  // -- State --
  deck: null,
  isLoading: false,
  error: null,
  activeSection: 'cover',
  saveStatus: 'idle',

  // -- Actions --
  setDeck: (deck) => set({ deck, error: null }),

  updateSection: <K extends keyof DeckSections>(
    sectionKey: K,
    data: Partial<DeckSections[K]>,
  ) => {
    const { deck } = get()
    if (!deck) return

    const updatedSection = {
      ...deck.sections[sectionKey],
      ...data,
    } as DeckSections[K]

    const updatedDeck: Deck = {
      ...deck,
      updatedAt: new Date().toISOString(),
      sections: {
        ...deck.sections,
        [sectionKey]: updatedSection,
      },
    }

    set({ deck: updatedDeck })

    // Debounced auto-save
    const timerKey = `${deck.id}:${sectionKey}`
    const existing = debounceTimers.get(timerKey)
    if (existing) clearTimeout(existing)

    const timer = setTimeout(async () => {
      debounceTimers.delete(timerKey)
      set({ saveStatus: 'saving' })

      try {
        const response = await fetch(
          `/api/deck/${deck.id}/sections/${sectionKey}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          },
        )

        if (!response.ok) {
          throw new Error(`Save failed: ${response.status}`)
        }

        set({ saveStatus: 'saved' })
      } catch (err) {
        console.error('Auto-save failed:', err)
        set({ saveStatus: 'error' })
      }
    }, 500)

    debounceTimers.set(timerKey, timer)
  },

  setActiveSection: (sectionId) => set({ activeSection: sectionId }),

  setSaveStatus: (status) => set({ saveStatus: status }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  getSectionStatus: (sectionId) => {
    const { deck } = get()
    if (!deck) return 'empty'
    return computeSectionStatus(deck, sectionId)
  },

  getCompletedCount: () => {
    const { deck } = get()
    if (!deck) return 0
    return SECTIONS.reduce((count, section) => {
      return count + (computeSectionStatus(deck, section.id) === 'complete' ? 1 : 0)
    }, 0)
  },
}))
