import { NextRequest } from 'next/server'
import { getClaudeClient } from '@/lib/ai/claude-client'
import { getChatSystemPrompt } from '@/lib/ai/prompts'
import type { ChatContext } from '@/lib/ai-types'

// Tool definition for proposing structured edits
const PROPOSE_CHANGES_TOOL = {
  name: 'propose_changes' as const,
  description:
    'Propose structured edits to deck section data. Use this when the user asks you to add, remove, change, or refine content in any section.',
  input_schema: {
    type: 'object' as const,
    properties: {
      changes: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            id: {
              type: 'string' as const,
              description: 'Unique identifier for this change',
            },
            sectionKey: {
              type: 'string' as const,
              description:
                'The deck section to modify (e.g. searchProfile, salary, cover)',
            },
            description: {
              type: 'string' as const,
              description: 'Brief human-readable description of the change',
            },
            patch: {
              type: 'object' as const,
              description:
                'Partial data to merge into the section. Must match the section data structure.',
            },
          },
          required: ['id', 'sectionKey', 'description', 'patch'],
        },
      },
    },
    required: ['changes'],
  },
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      messages,
      context,
    }: {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>
      context: ChatContext
    } = body

    if (!messages || !context) {
      return new Response(
        JSON.stringify({ error: 'Missing messages or context' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const claude = getClaudeClient()
    const systemPrompt = getChatSystemPrompt(context)

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        function sendEvent(data: Record<string, unknown>) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
          )
        }

        try {
          const response = await claude.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 4096,
            system: systemPrompt,
            tools: [PROPOSE_CHANGES_TOOL],
            messages,
            stream: true,
          })

          let currentToolName: string | null = null
          let toolInput = ''

          for await (const event of response) {
            switch (event.type) {
              case 'content_block_start': {
                if (event.content_block.type === 'tool_use') {
                  currentToolName = event.content_block.name
                  toolInput = ''
                }
                break
              }

              case 'content_block_delta': {
                if (event.delta.type === 'text_delta') {
                  sendEvent({ type: 'text_delta', text: event.delta.text })
                } else if (event.delta.type === 'input_json_delta') {
                  toolInput += event.delta.partial_json
                }
                break
              }

              case 'content_block_stop': {
                if (currentToolName === 'propose_changes' && toolInput) {
                  try {
                    const parsed = JSON.parse(toolInput)
                    const changes = (parsed.changes ?? []).map(
                      (c: Record<string, unknown>, i: number) => ({
                        id: c.id ?? `change-${i}`,
                        sectionKey: c.sectionKey,
                        description: c.description,
                        patch: c.patch,
                        status: 'pending',
                      }),
                    )
                    sendEvent({ type: 'tool_use', proposedChanges: changes })
                  } catch {
                    sendEvent({
                      type: 'error',
                      message: 'Failed to parse proposed changes',
                    })
                  }
                }
                currentToolName = null
                toolInput = ''
                break
              }

              case 'message_stop': {
                sendEvent({ type: 'done' })
                break
              }
            }
          }
        } catch (err) {
          sendEvent({
            type: 'error',
            message:
              err instanceof Error ? err.message : 'Chat request failed',
          })
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'Internal server error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
