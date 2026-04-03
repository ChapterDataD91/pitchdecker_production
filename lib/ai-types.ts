import type { Weight, DeckSections } from './types'
import type { SectionId } from './theme'

// ---------------------------------------------------------------------------
// Tools mode types (existing)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Panel mode
// ---------------------------------------------------------------------------

export type AIPanelMode = 'tools' | 'chat'

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export interface DeckDocument {
  id: string          // MongoDB _id as string
  deckId: string
  fileName: string
  fileType: string    // 'pdf' | 'docx' | 'txt' | 'image'
  fileSize: number
  extractedText: string
  uploadedAt: string
}

// ---------------------------------------------------------------------------
// Chat types
// ---------------------------------------------------------------------------

export type ChatRole = 'user' | 'assistant'

export interface ProposedChange {
  id: string
  sectionKey: keyof DeckSections
  description: string
  patch: Partial<DeckSections[keyof DeckSections]>
  status: 'pending' | 'accepted' | 'dismissed'
}

export interface ChatMessage {
  type: 'message'
  id: string
  role: ChatRole
  content: string
  sectionId: SectionId
  timestamp: string
  proposedChanges?: ProposedChange[]
  isStreaming?: boolean
}

export interface SectionDivider {
  type: 'section-divider'
  sectionId: SectionId
  sectionLabel: string
  timestamp: string
}

export type ChatEntry = ChatMessage | SectionDivider

// ---------------------------------------------------------------------------
// Chat API types
// ---------------------------------------------------------------------------

export interface ChatContext {
  sectionType: SectionId
  sectionData: unknown
  clientName: string
  roleTitle: string
  deckSummary: string
  uploadedDocuments: Array<{ fileName: string; extractedText: string }>
}

export interface ChatStreamEvent {
  type: 'text_delta' | 'tool_use' | 'done' | 'error'
  text?: string
  proposedChanges?: ProposedChange[]
  message?: string
}
