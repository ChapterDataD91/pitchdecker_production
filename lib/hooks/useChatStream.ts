'use client'

import { useRef, useCallback } from 'react'
import { useAIStore } from '@/lib/store/ai-store'
import { useEditorStore } from '@/lib/store/editor-store'
import { buildChatContext } from '@/lib/ai/chat-context'
import type { SectionId } from '@/lib/theme'
import type { ProposedChange, ChatStreamEvent } from '@/lib/ai-types'

interface UseChatStreamReturn {
  sendMessage: (content: string) => Promise<void>
  cancelStream: () => void
}

export function useChatStream(): UseChatStreamReturn {
  const abortRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (content: string) => {
    const aiStore = useAIStore.getState()
    const editorStore = useEditorStore.getState()
    const { deck, activeSection } = editorStore

    if (!deck) return

    // Add user message
    aiStore.addUserMessage(content, activeSection as SectionId)

    // Build conversation history (filter out dividers, map to API format)
    const updatedMessages = useAIStore.getState().chatMessages
    const apiMessages = updatedMessages
      .filter((entry): entry is Extract<typeof entry, { type: 'message' }> =>
        entry.type === 'message',
      )
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

    // Build context (includes uploaded documents from store)
    const { deckDocuments } = useAIStore.getState()
    const context = buildChatContext(deck, activeSection as SectionId, deckDocuments)

    // Start streaming
    const assistantId = aiStore.startAssistantMessage(activeSection as SectionId)
    aiStore.setChatError(null)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, context }),
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`Chat request failed: ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response stream')

      const decoder = new TextDecoder()
      let buffer = ''
      let collectedChanges: ProposedChange[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Parse SSE events from buffer
        const lines = buffer.split('\n\n')
        buffer = lines.pop() ?? '' // Keep incomplete event in buffer

        for (const line of lines) {
          const dataLine = line
            .split('\n')
            .find((l) => l.startsWith('data: '))
          if (!dataLine) continue

          try {
            const event: ChatStreamEvent = JSON.parse(
              dataLine.slice('data: '.length),
            )

            switch (event.type) {
              case 'text_delta':
                if (event.text) {
                  useAIStore
                    .getState()
                    .appendToAssistantMessage(assistantId, event.text)
                }
                break

              case 'tool_use':
                if (event.proposedChanges) {
                  collectedChanges.push(...event.proposedChanges)
                }
                break

              case 'error':
                useAIStore
                  .getState()
                  .setChatError(event.message ?? 'Stream error')
                break

              case 'done':
                // Handled after loop
                break
            }
          } catch {
            // Malformed SSE event, skip
          }
        }
      }

      // Finalize the assistant message
      useAIStore
        .getState()
        .finalizeAssistantMessage(
          assistantId,
          collectedChanges.length > 0 ? collectedChanges : undefined,
        )
      useAIStore.getState().persistChat()
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        // User cancelled — finalize what we have
        useAIStore.getState().finalizeAssistantMessage(assistantId)
      } else {
        useAIStore
          .getState()
          .setChatError(
            err instanceof Error ? err.message : 'Chat request failed',
          )
        useAIStore.getState().finalizeAssistantMessage(assistantId)
      }
    } finally {
      abortRef.current = null
    }
  }, [])

  const cancelStream = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  return { sendMessage, cancelStream }
}
