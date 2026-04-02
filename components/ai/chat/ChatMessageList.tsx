'use client'

import { useRef, useEffect, useCallback } from 'react'
import type { ChatEntry } from '@/lib/ai-types'
import ChatMessageBubble from './ChatMessageBubble'
import SectionDividerPill from './SectionDividerPill'

interface ChatMessageListProps {
  messages: ChatEntry[]
  onAcceptChange: (messageId: string, changeId: string) => void
  onDismissChange: (messageId: string, changeId: string) => void
}

export default function ChatMessageList({
  messages,
  onAcceptChange,
  onDismissChange,
}: ChatMessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const shouldAutoScroll = useRef(true)

  // Track whether user has scrolled up
  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    shouldAutoScroll.current = distanceFromBottom < 60
  }, [])

  // Auto-scroll on new messages
  useEffect(() => {
    if (shouldAutoScroll.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
    >
      {messages.map((entry, i) => {
        if (entry.type === 'section-divider') {
          return (
            <SectionDividerPill
              key={`divider-${entry.timestamp}-${i}`}
              label={entry.sectionLabel}
            />
          )
        }

        return (
          <ChatMessageBubble
            key={entry.id}
            message={entry}
            onAcceptChange={(changeId) => onAcceptChange(entry.id, changeId)}
            onDismissChange={(changeId) => onDismissChange(entry.id, changeId)}
          />
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
