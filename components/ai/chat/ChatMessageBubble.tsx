'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import type { ChatMessage } from '@/lib/ai-types'
import { SECTIONS } from '@/lib/theme'
import { useEditorStore } from '@/lib/store/editor-store'
import ProposedChangeCard from './ProposedChangeCard'
import LoadingDots from '@/components/ui/LoadingDots'

interface ChatMessageBubbleProps {
  message: ChatMessage
  onAcceptChange: (changeId: string) => void
  onDismissChange: (changeId: string) => void
  onRetry?: () => void
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// ---------------------------------------------------------------------------
// Markdown message content — renders assistant messages with proper formatting
// ---------------------------------------------------------------------------

function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
        ul: ({ children }) => (
          <ul className="mb-2 ml-4 list-disc space-y-1 last:mb-0">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-2 ml-4 list-decimal space-y-1 last:mb-0">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="pl-0.5">{children}</li>
        ),
        h1: ({ children }) => (
          <h3 className="mb-1.5 mt-3 text-sm font-semibold first:mt-0">{children}</h3>
        ),
        h2: ({ children }) => (
          <h3 className="mb-1.5 mt-3 text-sm font-semibold first:mt-0">{children}</h3>
        ),
        h3: ({ children }) => (
          <h4 className="mb-1 mt-2.5 text-[13px] font-semibold first:mt-0">{children}</h4>
        ),
        code: ({ children, className }) => {
          const isBlock = className?.includes('language-')
          if (isBlock) {
            return (
              <pre className="my-2 overflow-x-auto rounded-md bg-[#1e1e1e] p-3 text-xs text-gray-100 last:mb-0">
                <code>{children}</code>
              </pre>
            )
          }
          return (
            <code className="rounded bg-black/[0.06] px-1 py-0.5 text-[12px] font-mono">
              {children}
            </code>
          )
        },
        blockquote: ({ children }) => (
          <blockquote className="my-2 border-l-2 border-accent/30 pl-3 text-text-secondary last:mb-0">
            {children}
          </blockquote>
        ),
        hr: () => <hr className="my-3 border-border" />,
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline decoration-accent/30 underline-offset-2 hover:decoration-accent"
          >
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

// ---------------------------------------------------------------------------
// Action buttons — copy + retry, shown below assistant messages
// ---------------------------------------------------------------------------

function MessageActions({ content, onRetry }: { content: string; onRetry?: () => void }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [content])

  return (
    <div className="mt-1 flex items-center gap-0.5">
      <button
        onClick={handleCopy}
        className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-text-tertiary transition-colors hover:bg-bg-hover hover:text-text-secondary"
        aria-label="Copy message"
      >
        {copied ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3.5 7.5l2 2 5-5" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="5" width="7" height="7" rx="1.5" />
            <path d="M9 5V3.5A1.5 1.5 0 0 0 7.5 2h-4A1.5 1.5 0 0 0 2 3.5v4A1.5 1.5 0 0 0 3.5 9H5" />
          </svg>
        )}
        <span>{copied ? 'Copied' : 'Copy'}</span>
      </button>

      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-text-tertiary transition-colors hover:bg-bg-hover hover:text-text-secondary"
          aria-label="Retry message"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2.5 7a4.5 4.5 0 0 1 8.35-2.33" />
            <path d="M11.5 2.5v2.17h-2.17" />
            <path d="M11.5 7a4.5 4.5 0 0 1-8.35 2.33" />
            <path d="M2.5 11.5V9.33h2.17" />
          </svg>
          <span>Retry</span>
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// ChatMessageBubble
// ---------------------------------------------------------------------------

export default function ChatMessageBubble({
  message,
  onAcceptChange,
  onDismissChange,
  onRetry,
}: ChatMessageBubbleProps) {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'
  const showActions = isAssistant && !message.isStreaming && message.content
  const locale = useEditorStore((s) => s.deck?.locale ?? 'nl')
  const sectionLabel =
    SECTIONS.find((s) => s.id === message.sectionId)?.label[locale] ??
    message.sectionId

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={`group flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={isUser ? 'max-w-[85%]' : 'w-full'}>
        {/* Section pill + timestamp */}
        <div
          className={`mb-1 flex items-center gap-1.5 text-[10px] text-text-tertiary ${
            isUser ? 'justify-end' : 'justify-start'
          }`}
        >
          <span>{sectionLabel}</span>
          <span>&middot;</span>
          <span>{formatTime(message.timestamp)}</span>
        </div>

        {/* Message bubble */}
        {isUser ? (
          <div className="rounded-xl bg-accent px-3 py-2 text-sm leading-relaxed text-white">
            {message.content}
          </div>
        ) : (
          <div className="rounded-xl bg-bg-muted px-3.5 py-2.5 text-[13px] leading-relaxed text-text">
            {message.content ? (
              <MarkdownContent content={message.content} />
            ) : null}
            {message.isStreaming && message.content === '' && (
              <LoadingDots />
            )}
            {message.isStreaming && message.content !== '' && (
              <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse rounded-full bg-current opacity-60" />
            )}
          </div>
        )}

        {/* Copy + Retry actions */}
        {showActions && (
          <MessageActions content={message.content} onRetry={onRetry} />
        )}

        {/* Proposed changes */}
        {message.proposedChanges?.map((change) => (
          <ProposedChangeCard
            key={change.id}
            change={change}
            onAccept={() => onAcceptChange(change.id)}
            onDismiss={() => onDismissChange(change.id)}
          />
        ))}
      </div>
    </motion.div>
  )
}
