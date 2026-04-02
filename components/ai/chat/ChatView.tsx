'use client'

import { useAIStore } from '@/lib/store/ai-store'
import { useChatStream } from '@/lib/hooks/useChatStream'
import ChatMessageList from './ChatMessageList'
import ChatInput from './ChatInput'

const STARTER_CHIPS = [
  'Review my must-haves',
  'Suggest improvements',
  "What's missing?",
] as const

export default function ChatView() {
  const chatMessages = useAIStore((s) => s.chatMessages)
  const chatIsStreaming = useAIStore((s) => s.chatIsStreaming)
  const chatError = useAIStore((s) => s.chatError)
  const acceptProposedChange = useAIStore((s) => s.acceptProposedChange)
  const dismissProposedChange = useAIStore((s) => s.dismissProposedChange)
  const setChatError = useAIStore((s) => s.setChatError)

  const { sendMessage, cancelStream } = useChatStream()

  const isEmpty = chatMessages.length === 0

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {isEmpty ? (
        // Empty state
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-accent-light">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-accent"
            >
              <path d="M10 2a8 8 0 0 1 8 8 8 8 0 0 1-8 8 8 8 0 0 1-8-8 8 8 0 0 1 8-8Z" />
              <path d="M10 7v3l2 2" />
            </svg>
          </div>
          <p className="text-sm font-medium text-text">Chat with AI</p>
          <p className="mt-1 text-xs text-text-secondary">
            Ask anything about the current section. I have full context.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {STARTER_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => sendMessage(chip)}
                disabled={chatIsStreaming}
                className="rounded-full border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-border-strong hover:bg-bg-hover hover:text-text active:scale-[0.98]"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      ) : (
        // Message list
        <ChatMessageList
          messages={chatMessages}
          onAcceptChange={acceptProposedChange}
          onDismissChange={dismissProposedChange}
        />
      )}

      {/* Error banner */}
      {chatError && (
        <div className="mx-3 mb-2 flex items-start gap-2 rounded-md bg-error-light p-2.5 text-xs text-error">
          <span className="flex-1">{chatError}</span>
          <button
            onClick={() => setChatError(null)}
            className="shrink-0 p-0.5 hover:opacity-70 transition-opacity"
            aria-label="Dismiss error"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="2" y1="2" x2="10" y2="10" />
              <line x1="10" y1="2" x2="2" y2="10" />
            </svg>
          </button>
        </div>
      )}

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        isStreaming={chatIsStreaming}
        onCancel={cancelStream}
      />
    </div>
  )
}
