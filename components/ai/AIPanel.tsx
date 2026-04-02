'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { AIInputMode, AISectionContext, AISuggestion } from '@/lib/ai-types'

import AIInputTabs from './AIInputTabs'
import DocumentUpload from './DocumentUpload'
import VoiceInput from './VoiceInput'
import TextInput from './TextInput'
import WebSearchInput from './WebSearchInput'
import SuggestionList from './SuggestionList'

interface AIPanelProps {
  open: boolean
  onClose: () => void
  context: AISectionContext
  suggestions: AISuggestion[]
  isAnalyzing: boolean
  isAnalyzingDocument: boolean
  isAnalyzingText: boolean
  isSearchingWeb: boolean
  isTranscribing: boolean
  activeMode: AIInputMode
  transcript: string | null
  error: string | null
  onModeChange: (mode: AIInputMode) => void
  onAnalyzeText: (text: string) => void
  onAnalyzeDocument: (file: File) => void
  onTranscribeAudio: (blob: Blob) => void
  onAnalyzeTranscript: () => void
  onTranscriptChange: (text: string) => void
  onWebSearch: (query: string) => void
  onAccept: (id: string) => void
  onDismiss: (id: string) => void
  onAcceptAll: () => void
  onDismissAll: () => void
}

export default function AIPanel({
  open,
  onClose,
  context,
  suggestions,
  isAnalyzing,
  isAnalyzingDocument,
  isAnalyzingText,
  isSearchingWeb,
  isTranscribing,
  activeMode,
  transcript,
  error,
  onModeChange,
  onAnalyzeText,
  onAnalyzeDocument,
  onTranscribeAudio,
  onAnalyzeTranscript,
  onTranscriptChange,
  onWebSearch,
  onAccept,
  onDismiss,
  onAcceptAll,
  onDismissAll,
}: AIPanelProps) {
  const [errorDismissed, setErrorDismissed] = useState(false)

  // Reset error dismissed state when error changes
  const showError = error && !errorDismissed

  const defaultQuery =
    context.clientName && context.roleTitle
      ? `${context.roleTitle} requirements at ${context.clientName}`
      : ''

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed top-0 right-0 bottom-0 w-96 bg-bg border-l border-border flex flex-col z-50 shadow-lg"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <h2 className="text-sm font-semibold text-text">AI Assist</h2>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-bg-muted text-text-tertiary hover:text-text transition-colors"
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

          {/* Error banner */}
          {showError && (
            <div className="mx-4 mt-3 bg-error-light text-error text-xs rounded-md p-3 flex items-start gap-2 shrink-0">
              <span className="flex-1">{error}</span>
              <button
                onClick={() => setErrorDismissed(true)}
                className="shrink-0 p-0.5 hover:opacity-70 transition-opacity"
                aria-label="Dismiss error"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="2" y1="2" x2="10" y2="10" />
                  <line x1="10" y1="2" x2="2" y2="10" />
                </svg>
              </button>
            </div>
          )}

          {/* Input tabs */}
          <AIInputTabs activeMode={activeMode} onChange={onModeChange} />

          {/* Active input */}
          <div className="shrink-0">
            {activeMode === 'document' && (
              <DocumentUpload
                onAnalyze={onAnalyzeDocument}
                isAnalyzing={isAnalyzingDocument}
              />
            )}
            {activeMode === 'voice' && (
              <VoiceInput
                onTranscribe={onTranscribeAudio}
                onAnalyze={onAnalyzeTranscript}
                isTranscribing={isTranscribing}
                isAnalyzing={isAnalyzingText}
                transcript={transcript}
                onTranscriptChange={onTranscriptChange}
              />
            )}
            {activeMode === 'text' && (
              <TextInput
                onAnalyze={onAnalyzeText}
                isAnalyzing={isAnalyzingText}
              />
            )}
            {activeMode === 'web-search' && (
              <WebSearchInput
                onSearch={onWebSearch}
                isSearching={isSearchingWeb}
                defaultQuery={defaultQuery}
              />
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-border shrink-0" />

          {/* Suggestions */}
          <SuggestionList
            suggestions={suggestions}
            onAccept={onAccept}
            onDismiss={onDismiss}
            onAcceptAll={onAcceptAll}
            onDismissAll={onDismissAll}
          />
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
