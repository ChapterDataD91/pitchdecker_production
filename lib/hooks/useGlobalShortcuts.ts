'use client'

// ---------------------------------------------------------------------------
// Global keyboard shortcuts for the deck editor.
//   ⌘K / Ctrl+K  →  toggle command palette (caller owns the modal mount)
//   ⌘J / Ctrl+J  →  cycle the AI assistant panel: closed → tools → chat → closed
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useState } from 'react'
import { useAIStore } from '@/lib/store/ai-store'

interface UseGlobalShortcutsReturn {
  paletteOpen: boolean
  openPalette: () => void
  closePalette: () => void
}

function cycleAIPanel() {
  const { panelOpen, panelMode, openPanel, closePanel, setPanelMode } = useAIStore.getState()
  if (!panelOpen) {
    setPanelMode('tools')
    openPanel()
    return
  }
  if (panelMode === 'tools') {
    setPanelMode('chat')
    return
  }
  closePanel()
}

export function useGlobalShortcuts(): UseGlobalShortcutsReturn {
  const [paletteOpen, setPaletteOpen] = useState(false)

  const openPalette = useCallback(() => setPaletteOpen(true), [])
  const closePalette = useCallback(() => setPaletteOpen(false), [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return

      if (e.key === 'k' || e.key === 'K') {
        e.preventDefault()
        setPaletteOpen((open) => !open)
        return
      }

      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault()
        cycleAIPanel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return { paletteOpen, openPalette, closePalette }
}
