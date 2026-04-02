'use client'

import { motion } from 'framer-motion'
import type { ChatMessage } from '@/lib/ai-types'
import { SECTIONS } from '@/lib/theme'
import ProposedChangeCard from './ProposedChangeCard'
import LoadingDots from '@/components/ui/LoadingDots'

interface ChatMessageBubbleProps {
  message: ChatMessage
  onAcceptChange: (changeId: string) => void
  onDismissChange: (changeId: string) => void
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function ChatMessageBubble({
  message,
  onAcceptChange,
  onDismissChange,
}: ChatMessageBubbleProps) {
  const isUser = message.role === 'user'
  const sectionLabel =
    SECTIONS.find((s) => s.id === message.sectionId)?.label ?? message.sectionId

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className="max-w-[85%]">
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
        <div
          className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${
            isUser
              ? 'bg-accent text-white'
              : 'bg-bg-muted text-text'
          }`}
        >
          {message.content}
          {message.isStreaming && message.content === '' && (
            <LoadingDots />
          )}
          {message.isStreaming && message.content !== '' && (
            <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-current opacity-70" />
          )}
        </div>

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
