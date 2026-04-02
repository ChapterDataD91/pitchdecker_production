// ---------------------------------------------------------------------------
// AI Store — Zustand store for AI panel, tools, and chat state
// Persists across section switches. Chat persists to localStorage per deck.
// ---------------------------------------------------------------------------

import { create } from 'zustand'
import { v4 } from 'uuid'
import type {
  AISuggestion,
  AIInputMode,
  AIPanelMode,
  AIPersonalityProfile,
  ChatEntry,
  ChatMessage,
  ProposedChange,
} from '@/lib/ai-types'
import type { SectionId } from '@/lib/theme'
import { SECTIONS } from '@/lib/theme'
import { useEditorStore } from './editor-store'
import type { DeckSections } from '@/lib/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AIState {
  // Panel
  panelOpen: boolean
  panelMode: AIPanelMode

  // Tools mode
  toolsSuggestions: AISuggestion[]
  toolsActiveMode: AIInputMode
  toolsIsAnalyzingDocument: boolean
  toolsIsAnalyzingText: boolean
  toolsIsSearchingWeb: boolean
  toolsIsTranscribing: boolean
  toolsTranscript: string | null
  toolsError: string | null
  toolsPersonalityProfile: AIPersonalityProfile | null

  // Chat mode
  chatMessages: ChatEntry[]
  chatIsStreaming: boolean
  chatError: string | null
  chatDeckId: string | null
}

interface AIActions {
  // Panel
  togglePanel: () => void
  openPanel: () => void
  closePanel: () => void
  setPanelMode: (mode: AIPanelMode) => void

  // Tools
  setToolsActiveMode: (mode: AIInputMode) => void
  addToolsSuggestions: (suggestions: AISuggestion[]) => void
  acceptToolsSuggestion: (id: string) => void
  dismissToolsSuggestion: (id: string) => void
  acceptAllToolsSuggestions: () => void
  dismissAllToolsSuggestions: () => void
  clearToolsSuggestions: () => void
  setToolsAnalyzingDocument: (loading: boolean) => void
  setToolsAnalyzingText: (loading: boolean) => void
  setToolsSearchingWeb: (loading: boolean) => void
  setToolsTranscribing: (loading: boolean) => void
  setToolsTranscript: (text: string | null) => void
  setToolsError: (error: string | null) => void
  setToolsPersonalityProfile: (profile: AIPersonalityProfile | null) => void

  // Chat
  initChat: (deckId: string) => void
  addUserMessage: (content: string, sectionId: SectionId) => void
  startAssistantMessage: (sectionId: SectionId) => string
  appendToAssistantMessage: (id: string, chunk: string) => void
  finalizeAssistantMessage: (id: string, proposedChanges?: ProposedChange[]) => void
  addSectionDivider: (sectionId: SectionId) => void
  acceptProposedChange: (messageId: string, changeId: string) => void
  dismissProposedChange: (messageId: string, changeId: string) => void
  setChatError: (error: string | null) => void
  setChatStreaming: (streaming: boolean) => void
  clearChat: () => void
  persistChat: () => void
}

type AIStore = AIState & AIActions

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

function chatStorageKey(deckId: string): string {
  return `pitchdecker:chat:${deckId}`
}

function loadChatFromStorage(deckId: string): ChatEntry[] {
  try {
    const raw = localStorage.getItem(chatStorageKey(deckId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as ChatEntry[]
  } catch {
    return []
  }
}

function saveChatToStorage(deckId: string, messages: ChatEntry[]): void {
  try {
    localStorage.setItem(chatStorageKey(deckId), JSON.stringify(messages))
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAIStore = create<AIStore>((set, get) => ({
  // -- Panel state --
  panelOpen: false,
  panelMode: 'tools',

  // -- Tools state --
  toolsSuggestions: [],
  toolsActiveMode: 'text',
  toolsIsAnalyzingDocument: false,
  toolsIsAnalyzingText: false,
  toolsIsSearchingWeb: false,
  toolsIsTranscribing: false,
  toolsTranscript: null,
  toolsError: null,
  toolsPersonalityProfile: null,

  // -- Chat state --
  chatMessages: [],
  chatIsStreaming: false,
  chatError: null,
  chatDeckId: null,

  // -- Panel actions --
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  openPanel: () => set({ panelOpen: true }),
  closePanel: () => set({ panelOpen: false }),
  setPanelMode: (mode) => set({ panelMode: mode }),

  // -- Tools actions --
  setToolsActiveMode: (mode) => set({ toolsActiveMode: mode }),

  addToolsSuggestions: (suggestions) =>
    set((s) => ({ toolsSuggestions: [...s.toolsSuggestions, ...suggestions] })),

  acceptToolsSuggestion: (id) =>
    set((s) => ({
      toolsSuggestions: s.toolsSuggestions.map((sg) =>
        sg.id === id ? { ...sg, status: 'accepted' as const } : sg,
      ),
    })),

  dismissToolsSuggestion: (id) =>
    set((s) => ({
      toolsSuggestions: s.toolsSuggestions.map((sg) =>
        sg.id === id ? { ...sg, status: 'dismissed' as const } : sg,
      ),
    })),

  acceptAllToolsSuggestions: () =>
    set((s) => ({
      toolsSuggestions: s.toolsSuggestions.map((sg) =>
        sg.status === 'pending' ? { ...sg, status: 'accepted' as const } : sg,
      ),
    })),

  dismissAllToolsSuggestions: () =>
    set((s) => ({
      toolsSuggestions: s.toolsSuggestions.map((sg) =>
        sg.status === 'pending' ? { ...sg, status: 'dismissed' as const } : sg,
      ),
    })),

  clearToolsSuggestions: () => set({ toolsSuggestions: [] }),

  setToolsAnalyzingDocument: (loading) => set({ toolsIsAnalyzingDocument: loading }),
  setToolsAnalyzingText: (loading) => set({ toolsIsAnalyzingText: loading }),
  setToolsSearchingWeb: (loading) => set({ toolsIsSearchingWeb: loading }),
  setToolsTranscribing: (loading) => set({ toolsIsTranscribing: loading }),
  setToolsTranscript: (text) => set({ toolsTranscript: text }),
  setToolsError: (error) => set({ toolsError: error }),
  setToolsPersonalityProfile: (profile) => set({ toolsPersonalityProfile: profile }),

  // -- Chat actions --
  initChat: (deckId) => {
    const messages = loadChatFromStorage(deckId)
    set({ chatDeckId: deckId, chatMessages: messages, chatError: null })
  },

  addUserMessage: (content, sectionId) => {
    const message: ChatMessage = {
      type: 'message',
      id: v4(),
      role: 'user',
      content,
      sectionId,
      timestamp: new Date().toISOString(),
    }
    set((s) => ({ chatMessages: [...s.chatMessages, message] }))
  },

  startAssistantMessage: (sectionId) => {
    const id = v4()
    const message: ChatMessage = {
      type: 'message',
      id,
      role: 'assistant',
      content: '',
      sectionId,
      timestamp: new Date().toISOString(),
      isStreaming: true,
    }
    set((s) => ({
      chatMessages: [...s.chatMessages, message],
      chatIsStreaming: true,
    }))
    return id
  },

  appendToAssistantMessage: (id, chunk) =>
    set((s) => ({
      chatMessages: s.chatMessages.map((entry) =>
        entry.type === 'message' && entry.id === id
          ? { ...entry, content: entry.content + chunk }
          : entry,
      ),
    })),

  finalizeAssistantMessage: (id, proposedChanges) =>
    set((s) => ({
      chatIsStreaming: false,
      chatMessages: s.chatMessages.map((entry) =>
        entry.type === 'message' && entry.id === id
          ? { ...entry, isStreaming: false, proposedChanges }
          : entry,
      ),
    })),

  addSectionDivider: (sectionId) => {
    const { chatMessages } = get()
    // Don't add divider if chat is empty or last entry is already this section's divider
    if (chatMessages.length === 0) return
    const last = chatMessages[chatMessages.length - 1]
    if (last.type === 'section-divider' && last.sectionId === sectionId) return

    const label = SECTIONS.find((s) => s.id === sectionId)?.label ?? sectionId
    set((s) => ({
      chatMessages: [
        ...s.chatMessages,
        {
          type: 'section-divider' as const,
          sectionId,
          sectionLabel: label,
          timestamp: new Date().toISOString(),
        },
      ],
    }))
  },

  acceptProposedChange: (messageId, changeId) => {
    const { chatMessages } = get()
    const entry = chatMessages.find(
      (e) => e.type === 'message' && e.id === messageId,
    )
    if (!entry || entry.type !== 'message' || !entry.proposedChanges) return

    const change = entry.proposedChanges.find((c) => c.id === changeId)
    if (!change || change.status !== 'pending') return

    // Apply the change to the editor store
    const editorStore = useEditorStore.getState()
    editorStore.updateSection(
      change.sectionKey,
      change.patch as Partial<DeckSections[keyof DeckSections]>,
    )

    // Update the change status
    set((s) => ({
      chatMessages: s.chatMessages.map((e) =>
        e.type === 'message' && e.id === messageId
          ? {
              ...e,
              proposedChanges: e.proposedChanges?.map((c) =>
                c.id === changeId ? { ...c, status: 'accepted' as const } : c,
              ),
            }
          : e,
      ),
    }))

    get().persistChat()
  },

  dismissProposedChange: (messageId, changeId) =>
    set((s) => ({
      chatMessages: s.chatMessages.map((e) =>
        e.type === 'message' && e.id === messageId
          ? {
              ...e,
              proposedChanges: e.proposedChanges?.map((c) =>
                c.id === changeId ? { ...c, status: 'dismissed' as const } : c,
              ),
            }
          : e,
      ),
    })),

  setChatError: (error) => set({ chatError: error }),
  setChatStreaming: (streaming) => set({ chatIsStreaming: streaming }),

  clearChat: () => {
    const { chatDeckId } = get()
    if (chatDeckId) {
      try {
        localStorage.removeItem(chatStorageKey(chatDeckId))
      } catch {
        // ignore
      }
    }
    set({ chatMessages: [], chatError: null })
  },

  persistChat: () => {
    const { chatDeckId, chatMessages } = get()
    if (chatDeckId) {
      saveChatToStorage(chatDeckId, chatMessages)
    }
  },
}))
