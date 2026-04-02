import type { Weight } from './types'

export type AISuggestionStatus = 'pending' | 'accepted' | 'dismissed'

export interface AISuggestion {
  id: string
  text: string
  weight: Weight
  category: 'mustHave' | 'niceToHave'
  reasoning?: string
  status: AISuggestionStatus
}

export type AIInputMode = 'document' | 'voice' | 'text' | 'web-search'

export interface AISectionContext {
  sectionType: string
  clientName: string
  roleTitle: string
  existingData?: unknown
}

export interface AIPersonalityProfile {
  intro: string
  traits: string[]
}

export interface AIAnalysisResponse {
  suggestions: Array<{
    text: string
    weight: Weight
    category: 'mustHave' | 'niceToHave'
    reasoning?: string
  }>
  personalityProfile?: AIPersonalityProfile
  summary?: string
}
