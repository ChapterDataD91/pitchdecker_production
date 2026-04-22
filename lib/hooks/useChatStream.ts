'use client'

import { useRef, useCallback } from 'react'
import { useAIStore } from '@/lib/store/ai-store'
import { useEditorStore } from '@/lib/store/editor-store'
import { buildChatContext } from '@/lib/ai/chat-context'
import type { SectionId } from '@/lib/theme'
import type {
  ChatEntry,
  ChatMessage,
  ProposedChange,
  ChatStreamEvent,
} from '@/lib/ai-types'

interface UseChatStreamReturn {
  sendMessage: (content: string) => Promise<void>
  cancelStream: () => void
}

// Anthropic message-block shapes we emit when replaying tool calls.
type TextBlock = { type: 'text'; text: string }
type ToolUseBlock = {
  type: 'tool_use'
  id: string
  name: string
  input: unknown
}
type ToolResultBlock = {
  type: 'tool_result'
  tool_use_id: string
  content: string
}
type ApiContent = string | Array<TextBlock | ToolUseBlock | ToolResultBlock>
type ApiMessage = { role: 'user' | 'assistant'; content: ApiContent }

function toolResultContent(changes: ProposedChange[]): string {
  return changes
    .map((c) => {
      const verb =
        c.status === 'accepted'
          ? 'Applied'
          : c.status === 'dismissed'
            ? 'Dismissed by consultant — do not re-propose'
            : 'Pending consultant review — do not re-propose'
      return `${verb}: ${c.description}`
    })
    .join('\n')
}

// Rebuild conversation history so Claude sees the full tool_use / tool_result
// lifecycle, not just the text preamble. Without this, prior propose_changes
// turns look like unfinished promises and Claude re-executes them on the next
// user message.
function buildApiMessages(entries: ChatEntry[]): ApiMessage[] {
  const msgs = entries.filter(
    (e): e is ChatMessage => e.type === 'message',
  )
  const out: ApiMessage[] = []
  let pendingToolResult: ToolResultBlock | null = null

  for (const msg of msgs) {
    if (msg.role === 'assistant') {
      const hasToolCall =
        !!msg.toolUseId && !!msg.proposedChanges?.length
      if (hasToolCall) {
        const blocks: Array<TextBlock | ToolUseBlock> = []
        if (msg.content) blocks.push({ type: 'text', text: msg.content })
        blocks.push({
          type: 'tool_use',
          id: msg.toolUseId!,
          name: 'propose_changes',
          input: msg.toolUseInput ?? { changes: msg.proposedChanges },
        })
        out.push({ role: 'assistant', content: blocks })
        pendingToolResult = {
          type: 'tool_result',
          tool_use_id: msg.toolUseId!,
          content: toolResultContent(msg.proposedChanges!),
        }
      } else {
        // Plain text assistant turn — no tool call to close.
        out.push({ role: 'assistant', content: msg.content })
      }
    } else {
      // User turn. If there's an unclosed tool_result, merge it in front of
      // the user's text so the turn satisfies Anthropic's alternation rule.
      if (pendingToolResult) {
        out.push({
          role: 'user',
          content: [
            pendingToolResult,
            { type: 'text', text: msg.content },
          ],
        })
        pendingToolResult = null
      } else {
        out.push({ role: 'user', content: msg.content })
      }
    }
  }

  return out
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

    // Build conversation history — expands prior propose_changes turns into
    // tool_use + tool_result block pairs so Claude doesn't re-execute them.
    const updatedMessages = useAIStore.getState().chatMessages
    const apiMessages = buildApiMessages(updatedMessages)

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
        body: JSON.stringify({
          messages: apiMessages,
          context,
          locale: deck.locale,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`Chat request failed: ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response stream')

      const decoder = new TextDecoder()
      let buffer = ''
      const collectedChanges: ProposedChange[] = []
      let collectedToolUseId: string | undefined
      let collectedToolUseInput: unknown

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
                if (event.toolUseId) {
                  collectedToolUseId = event.toolUseId
                  collectedToolUseInput = event.toolUseInput
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
          collectedToolUseId,
          collectedToolUseInput,
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
