'use client'

import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAIStore } from '@/lib/store/ai-store'
import { useAIPanel } from '@/lib/hooks/useAIPanel'
import type { AIPanelMode, AISectionContext } from '@/lib/ai-types'

import AIInputTabs from './AIInputTabs'
import DocumentUpload from './DocumentUpload'
import VoiceInput from './VoiceInput'
import TextInput from './TextInput'
import WebSearchInput from './WebSearchInput'
import SuggestionList from './SuggestionList'
import ChatView from './chat/ChatView'

// ---------------------------------------------------------------------------
// Mode Toggle — Tools | Chat
// ---------------------------------------------------------------------------

function ModeToggle({
  mode,
  onChange,
}: {
  mode: AIPanelMode
  onChange: (mode: AIPanelMode) => void
}) {
  return (
    <div className="flex border-b border-border">
      {(['tools', 'chat'] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`relative flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${
            mode === m
              ? 'text-accent'
              : 'text-text-tertiary hover:text-text-secondary'
          }`}
        >
          {m === 'tools' ? 'Tools' : 'Chat'}
          {mode === m && (
            <motion.div
              layoutId="mode-indicator"
              className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-accent"
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            />
          )}
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tools View — extracted from old AIPanel body
// ---------------------------------------------------------------------------

interface ToolsViewProps {
  context: AISectionContext
  onAccept: (id: string) => void
  onAcceptAll: () => void
}

function ToolsView({ context, onAccept, onAcceptAll }: ToolsViewProps) {
  const [instruction, setInstruction] = useState('')
  const handleInstructionChange = useCallback((value: string) => setInstruction(value), [])

  const ai = useAIPanel(context)

  const defaultQuery =
    context.clientName && context.roleTitle
      ? `${context.roleTitle} requirements at ${context.clientName}`
      : ''

  return (
    <>
      {/* Error banner */}
      {ai.error && (
        <div className="mx-4 mt-3 flex items-start gap-2 rounded-md bg-error-light p-3 text-xs text-error shrink-0">
          <span className="flex-1">{ai.error}</span>
          <button
            onClick={ai.clearError}
            className="shrink-0 p-0.5 transition-opacity hover:opacity-70"
            aria-label="Dismiss error"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="2" y1="2" x2="10" y2="10" />
              <line x1="10" y1="2" x2="2" y2="10" />
            </svg>
          </button>
        </div>
      )}

      {/* Input tabs */}
      <AIInputTabs activeMode={ai.activeMode} onChange={ai.setActiveMode} />

      {/* Active input */}
      <div className="shrink-0">
        {ai.activeMode === 'document' && (
          <DocumentUpload
            onAnalyze={ai.analyzeDocument}
            isAnalyzing={ai.isAnalyzingDocument}
            instruction={instruction}
            onInstructionChange={handleInstructionChange}
          />
        )}
        {ai.activeMode === 'voice' && (
          <VoiceInput
            onTranscribe={ai.transcribeAudio}
            onAnalyze={ai.analyzeTranscript}
            isTranscribing={ai.isTranscribing}
            isAnalyzing={ai.isAnalyzingText}
            transcript={ai.transcript}
            onTranscriptChange={ai.setTranscript}
          />
        )}
        {ai.activeMode === 'text' && (
          <TextInput
            onAnalyze={ai.analyzeText}
            isAnalyzing={ai.isAnalyzingText}
            instruction={instruction}
            onInstructionChange={handleInstructionChange}
          />
        )}
        {ai.activeMode === 'web-search' && (
          <WebSearchInput
            onSearch={ai.webSearch}
            isSearching={ai.isSearchingWeb}
            defaultQuery={defaultQuery}
            instruction={instruction}
            onInstructionChange={handleInstructionChange}
          />
        )}
      </div>

      {/* Divider */}
      <div className="shrink-0 border-t border-border" />

      {/* Suggestions */}
      <SuggestionList
        suggestions={ai.suggestions}
        onAccept={(id) => {
          ai.acceptSuggestion(id)
          onAccept(id)
        }}
        onDismiss={ai.dismissSuggestion}
        onAcceptAll={() => {
          onAcceptAll()
          ai.acceptAll()
        }}
        onDismissAll={ai.dismissAll}
      />
    </>
  )
}

// ---------------------------------------------------------------------------
// AIPanel — main component
// ---------------------------------------------------------------------------

interface AIPanelProps {
  context: AISectionContext
  onToolsAccept: (id: string) => void
  onToolsAcceptAll: () => void
}

export default function AIPanel({ context, onToolsAccept, onToolsAcceptAll }: AIPanelProps) {
  const panelOpen = useAIStore((s) => s.panelOpen)
  const panelMode = useAIStore((s) => s.panelMode)
  const closePanel = useAIStore((s) => s.closePanel)
  const setPanelMode = useAIStore((s) => s.setPanelMode)

  return (
    <AnimatePresence>
      {panelOpen && (
        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed bottom-0 right-0 top-0 z-50 flex w-96 flex-col border-l border-border bg-bg shadow-lg"
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-text">AI Assist</h2>
            <button
              onClick={closePanel}
              className="rounded p-1 text-text-tertiary transition-colors hover:bg-bg-muted hover:text-text"
              aria-label="Close AI panel"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="4.5" y1="4.5" x2="13.5" y2="13.5" />
                <line x1="13.5" y1="4.5" x2="4.5" y2="13.5" />
              </svg>
            </button>
          </div>

          {/* Mode toggle */}
          <ModeToggle mode={panelMode} onChange={setPanelMode} />

          {/* Content */}
          {panelMode === 'tools' && (
            <ToolsView
              context={context}
              onAccept={onToolsAccept}
              onAcceptAll={onToolsAcceptAll}
            />
          )}
          {panelMode === 'chat' && <ChatView />}
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
