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
  DeckDocument,
} from '@/lib/ai-types'
import type { SectionId } from '@/lib/theme'
import { SECTIONS } from '@/lib/theme'
import { useEditorStore } from './editor-store'
import type { DeckSections, SearchProfileSection, Weight } from '@/lib/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const PANEL_WIDTH_KEY = 'pitchdecker:ai-panel-width'
const DEFAULT_PANEL_WIDTH = 384

function loadPanelWidth(): number {
  try {
    const raw = localStorage.getItem(PANEL_WIDTH_KEY)
    if (!raw) return DEFAULT_PANEL_WIDTH
    const n = parseInt(raw, 10)
    return Number.isFinite(n) && n >= 320 ? n : DEFAULT_PANEL_WIDTH
  } catch {
    return DEFAULT_PANEL_WIDTH
  }
}

function savePanelWidth(width: number): void {
  try {
    localStorage.setItem(PANEL_WIDTH_KEY, String(width))
  } catch {
    // silently fail
  }
}

// ---------------------------------------------------------------------------
// Background tasks
//
// Long-running AI work (Suggest Search Profile, CV scoring, etc.) is tracked
// here rather than inside a section component's local state, so the task
// survives the user navigating between sections. Keyed by a stable string
// like `suggest-search-profile:${deckId}` — duplicate starts are rejected
// while `status === 'running'`.
//
// Each task kind owns the shape of `undoData`; the section that consumes
// the task is responsible for casting it correctly.
// ---------------------------------------------------------------------------

export type BackgroundTaskKind = 'suggest-search-profile'

export interface BackgroundTask {
  kind: BackgroundTaskKind
  status: 'running' | 'done' | 'error'
  error?: string
  startedAt: number
  finishedAt?: number
  undoData?: unknown
}

interface AIState {
  // Panel
  panelOpen: boolean
  panelMode: AIPanelMode
  panelWidth: number

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

  // Documents
  deckDocuments: DeckDocument[]
  isLoadingDocuments: boolean
  isUploadingDocument: boolean

  // Background tasks — see header comment above
  backgroundTasks: Record<string, BackgroundTask>
}

interface AIActions {
  // Panel
  togglePanel: () => void
  openPanel: () => void
  closePanel: () => void
  setPanelMode: (mode: AIPanelMode) => void
  setPanelWidth: (width: number) => void
  resetPanelWidth: () => void

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

  // Documents
  loadDocuments: (deckId: string) => Promise<void>
  uploadDocument: (deckId: string, file: File) => Promise<DeckDocument | null>
  removeDocument: (deckId: string, docId: string) => Promise<void>
  addDocumentToStore: (doc: DeckDocument) => void

  // ---- Background tasks --------------------------------------------------
  // Generic: lifecycle wrapper. Dedupes on `running`; catches errors; records
  // optional undoData returned by the work function. Use for any async AI
  // task that should survive the user navigating between sections.
  runBackgroundTask: (
    key: string,
    kind: BackgroundTaskKind,
    fn: () => Promise<{ undoData?: unknown } | void>,
  ) => Promise<void>
  clearBackgroundTask: (key: string) => void

  // Specific: starter search-profile draft. Writes directly to editor-store.
  suggestSearchProfile: (deckId: string) => Promise<void>
  undoSuggestSearchProfile: (deckId: string) => void
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
  panelWidth: typeof window !== 'undefined' ? loadPanelWidth() : DEFAULT_PANEL_WIDTH,

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

  // -- Documents state --
  deckDocuments: [],
  isLoadingDocuments: false,
  isUploadingDocument: false,

  // -- Background tasks state --
  backgroundTasks: {},

  // -- Panel actions --
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  openPanel: () => set({ panelOpen: true }),
  closePanel: () => set({ panelOpen: false }),
  setPanelMode: (mode) => set({ panelMode: mode }),
  setPanelWidth: (width) => {
    const clamped = Math.max(320, Math.min(width, window.innerWidth * 0.7))
    set({ panelWidth: clamped })
    savePanelWidth(clamped)
  },
  resetPanelWidth: () => {
    set({ panelWidth: DEFAULT_PANEL_WIDTH })
    savePanelWidth(DEFAULT_PANEL_WIDTH)
  },

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
    // Don't add divider if chat is empty
    if (chatMessages.length === 0) return
    const last = chatMessages[chatMessages.length - 1]
    // Don't add if last entry is already any divider (no messages between dividers)
    if (last.type === 'section-divider') return

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

    // Sanitize patch data — coerce known fields to correct types
    const patch = { ...change.patch } as Record<string, unknown>
    if ('personalityProfile' in patch) {
      const pp = patch.personalityProfile as Record<string, unknown>
      if (pp && Array.isArray(pp.traits)) {
        pp.traits = pp.traits.map((t: unknown) =>
          typeof t === 'string' ? t : typeof t === 'object' && t !== null
            ? (t as Record<string, unknown>).text ??
              (t as Record<string, unknown>).trait ??
              (t as Record<string, unknown>).description ??
              JSON.stringify(t)
            : String(t),
        )
      }
    }

    // Deep-merge nested objects the AI might only partially return, so a
    // patch like { assessor: { bio: "..." } } doesn't wipe the other fields.
    // (Shallow merge in updateSection would overwrite the whole object.)
    const editorStore = useEditorStore.getState()
    if (change.sectionKey === 'assessment' && patch.assessor && typeof patch.assessor === 'object') {
      const currentAssessor = editorStore.deck?.sections.assessment.assessor
      if (currentAssessor) {
        patch.assessor = { ...currentAssessor, ...(patch.assessor as Record<string, unknown>) }
      }
    }

    // Apply the change to the editor store
    editorStore.updateSection(
      change.sectionKey,
      patch as Partial<DeckSections[keyof DeckSections]>,
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

  // -- Document actions --
  loadDocuments: async (deckId) => {
    set({ isLoadingDocuments: true })
    try {
      const res = await fetch(`/api/deck/${deckId}/documents`)
      if (!res.ok) throw new Error('Failed to load documents')
      const data = await res.json()
      set({ deckDocuments: data.documents ?? [] })
    } catch (err) {
      console.error('Failed to load documents:', err)
      set({ deckDocuments: [] })
    } finally {
      set({ isLoadingDocuments: false })
    }
  },

  uploadDocument: async (deckId, file) => {
    set({ isUploadingDocument: true })
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`/api/deck/${deckId}/documents`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Upload failed')
      }
      const doc: DeckDocument = await res.json()
      set((s) => ({ deckDocuments: [doc, ...s.deckDocuments] }))
      return doc
    } catch (err) {
      console.error('Failed to upload document:', err)
      return null
    } finally {
      set({ isUploadingDocument: false })
    }
  },

  removeDocument: async (deckId, docId) => {
    // Optimistic removal
    set((s) => ({
      deckDocuments: s.deckDocuments.filter((d) => d.id !== docId),
    }))
    try {
      const res = await fetch(`/api/deck/${deckId}/documents/${docId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Delete failed')
    } catch (err) {
      console.error('Failed to delete document:', err)
      // Reload to restore state
      get().loadDocuments(deckId)
    }
  },

  addDocumentToStore: (doc) =>
    set((s) => ({ deckDocuments: [doc, ...s.deckDocuments] })),

  // -- Background tasks --------------------------------------------------
  // Generic lifecycle wrapper. Records running → done/error, captures
  // errors, stores optional undoData. Rejects duplicate starts while
  // the same key is still running.
  runBackgroundTask: async (key, kind, fn) => {
    const existing = get().backgroundTasks[key]
    if (existing?.status === 'running') return

    set((s) => ({
      backgroundTasks: {
        ...s.backgroundTasks,
        [key]: { kind, status: 'running', startedAt: Date.now() },
      },
    }))

    try {
      const result = (await fn()) ?? {}
      set((s) => ({
        backgroundTasks: {
          ...s.backgroundTasks,
          [key]: {
            ...s.backgroundTasks[key],
            status: 'done',
            finishedAt: Date.now(),
            undoData: result.undoData,
          },
        },
      }))
    } catch (err) {
      set((s) => ({
        backgroundTasks: {
          ...s.backgroundTasks,
          [key]: {
            ...s.backgroundTasks[key],
            status: 'error',
            error: err instanceof Error ? err.message : 'Unknown error',
            finishedAt: Date.now(),
          },
        },
      }))
    }
  },

  clearBackgroundTask: (key) =>
    set((s) => {
      if (!(key in s.backgroundTasks)) return s
      const next = { ...s.backgroundTasks }
      delete next[key]
      return { backgroundTasks: next }
    }),

  // Starter search-profile draft. Fetches the suggestion, writes it into
  // editor-store so it lands regardless of which section is currently
  // mounted, and stashes the previous section shape for Undo.
  suggestSearchProfile: async (deckId) => {
    const key = `suggest-search-profile:${deckId}`
    await get().runBackgroundTask(key, 'suggest-search-profile', async () => {
      const deck = useEditorStore.getState().deck
      if (!deck) throw new Error('No deck loaded')

      const cover = deck.sections.cover
      const previousSection = deck.sections.searchProfile
      const deckDocuments = get().deckDocuments

      const res = await fetch('/api/ai/search-profile/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deckContext: {
            clientName: cover.clientName || deck.clientName,
            roleTitle: cover.roleTitle || deck.roleTitle,
            coverIntro: cover.introParagraph || undefined,
            uploadedDocuments: deckDocuments.map((d) => ({
              fileName: d.fileName,
              extractedText: d.extractedText,
            })),
          },
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to generate starter profile')
      }

      interface DraftResponse {
        mustHaves: { text: string; weight: Weight }[]
        niceToHaves: { text: string; weight: Weight }[]
        personalityProfile: { intro: string; traits: string[] }
      }
      const draft = (await res.json()) as DraftResponse

      useEditorStore.getState().updateSection('searchProfile', {
        mustHaves: draft.mustHaves.map((c) => ({
          id: v4(),
          text: c.text,
          weight: c.weight,
        })),
        niceToHaves: draft.niceToHaves.map((c) => ({
          id: v4(),
          text: c.text,
          weight: c.weight,
        })),
        personalityProfile: {
          intro: draft.personalityProfile.intro,
          traits: draft.personalityProfile.traits,
        },
      })

      return { undoData: previousSection }
    })
  },

  undoSuggestSearchProfile: (deckId) => {
    const key = `suggest-search-profile:${deckId}`
    const task = get().backgroundTasks[key]
    if (!task || task.status !== 'done' || !task.undoData) return

    useEditorStore
      .getState()
      .updateSection('searchProfile', task.undoData as SearchProfileSection)
    get().clearBackgroundTask(key)
  },
}))
