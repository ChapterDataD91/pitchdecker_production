'use client'

import { useCallback } from 'react'
import { v4 } from 'uuid'
import { useAIStore } from '@/lib/store/ai-store'
import type {
  AISuggestion,
  AIInputMode,
  AISectionContext,
  AIAnalysisResponse,
  AIPersonalityProfile,
} from '../ai-types'

interface UseAIPanelReturn {
  // State
  suggestions: AISuggestion[]
  isAnalyzing: boolean
  isAnalyzingDocument: boolean
  isAnalyzingText: boolean
  isSearchingWeb: boolean
  isTranscribing: boolean
  activeMode: AIInputMode
  error: string | null
  transcript: string | null
  personalityProfile: AIPersonalityProfile | null

  // Actions
  setActiveMode: (mode: AIInputMode) => void
  analyzeText: (text: string, instruction?: string) => Promise<void>
  analyzeDocument: (file: File, instruction?: string) => Promise<void>
  transcribeAudio: (audioBlob: Blob) => Promise<void>
  webSearch: (query: string, instruction?: string) => Promise<void>
  analyzeTranscript: () => Promise<void>
  setTranscript: (text: string) => void
  acceptSuggestion: (id: string) => void
  dismissSuggestion: (id: string) => void
  acceptAll: () => void
  dismissAll: () => void
  clearSuggestions: () => void
  clearError: () => void
}

function mapResponseToSuggestions(
  response: AIAnalysisResponse,
): AISuggestion[] {
  return response.suggestions.map((s) => ({
    id: v4(),
    text: s.text,
    weight: s.weight,
    category: s.category,
    reasoning: s.reasoning,
    status: 'pending' as const,
  }))
}

export function useAIPanel(context: AISectionContext): UseAIPanelReturn {
  const store = useAIStore()

  const analyzeText = useCallback(
    async (text: string, instruction?: string) => {
      store.setToolsAnalyzingText(true)
      store.setToolsError(null)
      try {
        const res = await fetch('/api/ai/analyze-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, context, instruction }),
        })
        if (!res.ok) {
          throw new Error(`Analysis failed: ${res.statusText}`)
        }
        const data: AIAnalysisResponse = await res.json()
        const newSuggestions = mapResponseToSuggestions(data)
        store.addToolsSuggestions(newSuggestions)
        if (data.personalityProfile) store.setToolsPersonalityProfile(data.personalityProfile)
      } catch (err) {
        store.setToolsError(err instanceof Error ? err.message : 'Text analysis failed')
      } finally {
        store.setToolsAnalyzingText(false)
      }
    },
    [context, store],
  )

  const analyzeDocument = useCallback(
    async (file: File, instruction?: string) => {
      store.setToolsAnalyzingDocument(true)
      store.setToolsError(null)
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('context', JSON.stringify(context))
        if (instruction) formData.append('instruction', instruction)

        const res = await fetch('/api/ai/analyze-document', {
          method: 'POST',
          body: formData,
        })
        if (!res.ok) {
          throw new Error(`Document analysis failed: ${res.statusText}`)
        }
        const data: AIAnalysisResponse = await res.json()
        const newSuggestions = mapResponseToSuggestions(data)
        store.addToolsSuggestions(newSuggestions)
        if (data.personalityProfile) store.setToolsPersonalityProfile(data.personalityProfile)
      } catch (err) {
        store.setToolsError(
          err instanceof Error ? err.message : 'Document analysis failed',
        )
      } finally {
        store.setToolsAnalyzingDocument(false)
      }
    },
    [context, store],
  )

  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    store.setToolsTranscribing(true)
    store.setToolsError(null)
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob)

      const res = await fetch('/api/ai/transcribe', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        throw new Error(`Transcription failed: ${res.statusText}`)
      }
      const data = await res.json()
      store.setToolsTranscript(data.transcript)
    } catch (err) {
      store.setToolsError(err instanceof Error ? err.message : 'Transcription failed')
    } finally {
      store.setToolsTranscribing(false)
    }
  }, [store])

  const webSearch = useCallback(
    async (query: string, instruction?: string) => {
      store.setToolsSearchingWeb(true)
      store.setToolsError(null)
      try {
        const res = await fetch('/api/ai/web-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, context, instruction }),
        })
        if (!res.ok) {
          throw new Error(`Web search failed: ${res.statusText}`)
        }
        const data: AIAnalysisResponse = await res.json()
        const newSuggestions = mapResponseToSuggestions(data)
        store.addToolsSuggestions(newSuggestions)
        if (data.personalityProfile) store.setToolsPersonalityProfile(data.personalityProfile)
      } catch (err) {
        store.setToolsError(err instanceof Error ? err.message : 'Web search failed')
      } finally {
        store.setToolsSearchingWeb(false)
      }
    },
    [context, store],
  )

  const analyzeTranscript = useCallback(async () => {
    if (!store.toolsTranscript) {
      store.setToolsError('No transcript available to analyze')
      return
    }
    await analyzeText(store.toolsTranscript)
  }, [store, analyzeText])

  return {
    // State (read from store)
    suggestions: store.toolsSuggestions,
    isAnalyzing: store.toolsIsAnalyzingDocument || store.toolsIsAnalyzingText || store.toolsIsSearchingWeb,
    isAnalyzingDocument: store.toolsIsAnalyzingDocument,
    isAnalyzingText: store.toolsIsAnalyzingText,
    isSearchingWeb: store.toolsIsSearchingWeb,
    isTranscribing: store.toolsIsTranscribing,
    activeMode: store.toolsActiveMode,
    error: store.toolsError,
    transcript: store.toolsTranscript,
    personalityProfile: store.toolsPersonalityProfile,

    // Actions
    setActiveMode: store.setToolsActiveMode,
    analyzeText,
    analyzeDocument,
    transcribeAudio,
    webSearch,
    analyzeTranscript,
    setTranscript: (text: string) => store.setToolsTranscript(text),
    acceptSuggestion: store.acceptToolsSuggestion,
    dismissSuggestion: store.dismissToolsSuggestion,
    acceptAll: store.acceptAllToolsSuggestions,
    dismissAll: store.dismissAllToolsSuggestions,
    clearSuggestions: store.clearToolsSuggestions,
    clearError: () => store.setToolsError(null),
  }
}
