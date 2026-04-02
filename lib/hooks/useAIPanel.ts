'use client'

import { useState, useCallback } from 'react'
import { v4 } from 'uuid'
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
  analyzeText: (text: string) => Promise<void>
  analyzeDocument: (file: File) => Promise<void>
  transcribeAudio: (audioBlob: Blob) => Promise<void>
  webSearch: (query: string) => Promise<void>
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
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [isAnalyzingDocument, setIsAnalyzingDocument] = useState(false)
  const [isAnalyzingText, setIsAnalyzingText] = useState(false)
  const [isSearchingWeb, setIsSearchingWeb] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [activeMode, setActiveMode] = useState<AIInputMode>('text')
  const [error, setError] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<string | null>(null)
  const [personalityProfile, setPersonalityProfile] = useState<AIPersonalityProfile | null>(null)

  const clearError = useCallback(() => setError(null), [])

  const analyzeText = useCallback(
    async (text: string) => {
      setIsAnalyzingText(true)
      setError(null)
      try {
        const res = await fetch('/api/ai/analyze-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, context }),
        })
        if (!res.ok) {
          throw new Error(`Analysis failed: ${res.statusText}`)
        }
        const data: AIAnalysisResponse = await res.json()
        const newSuggestions = mapResponseToSuggestions(data)
        setSuggestions((prev) => [...prev, ...newSuggestions])
        if (data.personalityProfile) setPersonalityProfile(data.personalityProfile)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Text analysis failed')
      } finally {
        setIsAnalyzingText(false)
      }
    },
    [context],
  )

  const analyzeDocument = useCallback(
    async (file: File) => {
      setIsAnalyzingDocument(true)
      setError(null)
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('context', JSON.stringify(context))

        const res = await fetch('/api/ai/analyze-document', {
          method: 'POST',
          body: formData,
        })
        if (!res.ok) {
          throw new Error(`Document analysis failed: ${res.statusText}`)
        }
        const data: AIAnalysisResponse = await res.json()
        const newSuggestions = mapResponseToSuggestions(data)
        setSuggestions((prev) => [...prev, ...newSuggestions])
        if (data.personalityProfile) setPersonalityProfile(data.personalityProfile)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Document analysis failed',
        )
      } finally {
        setIsAnalyzingDocument(false)
      }
    },
    [context],
  )

  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    setIsTranscribing(true)
    setError(null)
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
      setTranscript(data.transcript)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transcription failed')
    } finally {
      setIsTranscribing(false)
    }
  }, [])

  const webSearch = useCallback(
    async (query: string) => {
      setIsSearchingWeb(true)
      setError(null)
      try {
        const res = await fetch('/api/ai/web-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, context }),
        })
        if (!res.ok) {
          throw new Error(`Web search failed: ${res.statusText}`)
        }
        const data: AIAnalysisResponse = await res.json()
        const newSuggestions = mapResponseToSuggestions(data)
        setSuggestions((prev) => [...prev, ...newSuggestions])
        if (data.personalityProfile) setPersonalityProfile(data.personalityProfile)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Web search failed')
      } finally {
        setIsSearchingWeb(false)
      }
    },
    [context],
  )

  const analyzeTranscript = useCallback(async () => {
    if (!transcript) {
      setError('No transcript available to analyze')
      return
    }
    await analyzeText(transcript)
  }, [transcript, analyzeText])

  const acceptSuggestion = useCallback((id: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'accepted' as const } : s)),
    )
  }, [])

  const dismissSuggestion = useCallback((id: string) => {
    setSuggestions((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: 'dismissed' as const } : s,
      ),
    )
  }, [])

  const acceptAll = useCallback(() => {
    setSuggestions((prev) =>
      prev.map((s) =>
        s.status === 'pending' ? { ...s, status: 'accepted' as const } : s,
      ),
    )
  }, [])

  const dismissAll = useCallback(() => {
    setSuggestions((prev) =>
      prev.map((s) =>
        s.status === 'pending' ? { ...s, status: 'dismissed' as const } : s,
      ),
    )
  }, [])

  const clearSuggestions = useCallback(() => {
    setSuggestions([])
  }, [])

  return {
    // State
    suggestions,
    isAnalyzing: isAnalyzingDocument || isAnalyzingText || isSearchingWeb,
    isAnalyzingDocument,
    isAnalyzingText,
    isSearchingWeb,
    isTranscribing,
    activeMode,
    error,
    transcript,
    personalityProfile,

    // Actions
    setActiveMode,
    analyzeText,
    analyzeDocument,
    transcribeAudio,
    webSearch,
    analyzeTranscript,
    setTranscript,
    acceptSuggestion,
    dismissSuggestion,
    acceptAll,
    dismissAll,
    clearSuggestions,
    clearError,
  }
}
