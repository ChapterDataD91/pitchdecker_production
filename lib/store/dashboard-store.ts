// ---------------------------------------------------------------------------
// Dashboard Store — Zustand store for the deck list / dashboard
// Manages deck summaries, loading, creation.
// ---------------------------------------------------------------------------

import { create } from 'zustand'
import type { DeckSummary } from '@/lib/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashboardState {
  decks: DeckSummary[]
  isLoading: boolean
  error: string | null
}

interface DashboardActions {
  fetchDecks: () => Promise<void>
  createDeck: (clientName: string, roleTitle: string) => Promise<string | null>
}

type DashboardStore = DashboardState & DashboardActions

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useDashboardStore = create<DashboardStore>((set) => ({
  // -- State --
  decks: [],
  isLoading: false,
  error: null,

  // -- Actions --
  fetchDecks: async () => {
    set({ isLoading: true, error: null })

    try {
      const response = await fetch('/api/deck')
      if (!response.ok) {
        throw new Error(`Failed to fetch decks: ${response.status}`)
      }

      const data: { decks: DeckSummary[] } = await response.json()
      set({ decks: data.decks, isLoading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch decks'
      set({ error: message, isLoading: false })
    }
  },

  createDeck: async (clientName, roleTitle) => {
    set({ error: null })

    try {
      const response = await fetch('/api/deck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName, roleTitle }),
      })

      if (!response.ok) {
        throw new Error(`Failed to create deck: ${response.status}`)
      }

      const data: { id: string } = await response.json()
      return data.id
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create deck'
      set({ error: message })
      return null
    }
  },
}))
