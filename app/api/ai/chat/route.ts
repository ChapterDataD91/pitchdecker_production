import { NextRequest } from 'next/server'
import type Anthropic from '@anthropic-ai/sdk'
import { getClaudeClient } from '@/lib/ai/claude-client'
import { getChatSystemPrompt, withLanguage } from '@/lib/ai/prompts'
import type { ChatContext } from '@/lib/ai-types'
import type { Locale } from '@/lib/types'
import { getCiceroClient } from '@/lib/mcp/cicero-client'

const MAX_TOOL_ITERATIONS = 8

// Tool definition for proposing structured edits
const PROPOSE_CHANGES_TOOL: Anthropic.Messages.Tool = {
  name: 'propose_changes',
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
                'The deck section to modify (e.g. searchProfile, salary, cover, credentials)',
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

// ---------------------------------------------------------------------------
// MCP tool schema → Anthropic tool schema converter
// ---------------------------------------------------------------------------

interface MCPToolDef {
  name: string
  description?: string
  inputSchema: {
    type: 'object'
    properties?: Record<string, object>
    required?: string[]
    [key: string]: unknown
  }
}

function mcpToolToAnthropic(tool: MCPToolDef): Anthropic.Messages.Tool {
  return {
    name: tool.name,
    description: tool.description ?? '',
    input_schema: {
      type: 'object' as const,
      properties: (tool.inputSchema.properties ?? {}) as Anthropic.Messages.Tool.InputSchema['properties'],
      required: tool.inputSchema.required,
    },
  }
}

// ---------------------------------------------------------------------------
// Execute a cicero tool call
// ---------------------------------------------------------------------------

async function executeCiceroTool(
  toolName: string,
  toolInput: Record<string, unknown>,
): Promise<string> {
  const cicero = await getCiceroClient()
  const result = await cicero.callTool({
    name: toolName,
    arguments: toolInput,
  })
  const content = result.content as Array<{ type: string; text?: string }>
  const textParts = content
    .filter((c) => c.type === 'text' && typeof c.text === 'string')
    .map((c) => c.text as string)
  return textParts.join('\n') || JSON.stringify(result.content)
}

// ---------------------------------------------------------------------------
// Load cicero tools (cached per-request)
// ---------------------------------------------------------------------------

async function getCiceroTools(): Promise<Anthropic.Messages.Tool[]> {
  try {
    const cicero = await getCiceroClient()
    const { tools } = await cicero.listTools()
    return (tools as MCPToolDef[]).map(mcpToolToAnthropic)
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      messages,
      context,
      locale,
    }: {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>
      context: ChatContext
      locale?: Locale
    } = body

    if (!messages || !context) {
      return new Response(
        JSON.stringify({ error: 'Missing messages or context' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const isCredentials = context.sectionType === 'credentials'
    const claude = getClaudeClient()
    const systemPrompt = withLanguage(getChatSystemPrompt(context), locale)

    // Build tools list — include cicero tools for credentials
    const tools: Anthropic.Messages.Tool[] = [PROPOSE_CHANGES_TOOL]
    if (isCredentials) {
      const ciceroTools = await getCiceroTools()
      tools.push(...ciceroTools)
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        function sendEvent(data: Record<string, unknown>) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
          )
        }

        try {
          if (isCredentials) {
            await handleCredentialsChat(
              claude,
              systemPrompt,
              tools,
              messages as Anthropic.Messages.MessageParam[],
              sendEvent,
            )
          } else {
            await handleStandardChat(
              claude,
              systemPrompt,
              tools,
              messages as Anthropic.Messages.MessageParam[],
              sendEvent,
            )
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

// ---------------------------------------------------------------------------
// Standard chat — one-shot streaming (existing behavior, unchanged)
// ---------------------------------------------------------------------------

async function handleStandardChat(
  claude: Anthropic,
  systemPrompt: string,
  tools: Anthropic.Messages.Tool[],
  messages: Anthropic.Messages.MessageParam[],
  sendEvent: (data: Record<string, unknown>) => void,
) {
  const response = await claude.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    tools,
    messages,
    stream: true,
  })

  let currentToolName: string | null = null
  let currentToolId: string | null = null
  let toolInput = ''

  for await (const event of response) {
    switch (event.type) {
      case 'content_block_start': {
        if (event.content_block.type === 'tool_use') {
          currentToolName = event.content_block.name
          currentToolId = event.content_block.id
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
        if (currentToolName === 'propose_changes' && currentToolId && toolInput) {
          emitProposedChanges(currentToolId, toolInput, sendEvent)
        }
        currentToolName = null
        currentToolId = null
        toolInput = ''
        break
      }

      case 'message_stop': {
        sendEvent({ type: 'done' })
        break
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Credentials chat — multi-turn with cicero tool execution
// ---------------------------------------------------------------------------

async function handleCredentialsChat(
  claude: Anthropic,
  systemPrompt: string,
  tools: Anthropic.Messages.Tool[],
  messages: Anthropic.Messages.MessageParam[],
  sendEvent: (data: Record<string, unknown>) => void,
) {
  // Work with a mutable copy of messages for the agentic loop
  const agentMessages = [...messages]
  let iterations = 0

  while (iterations < MAX_TOOL_ITERATIONS) {
    // Use non-streaming for tool iterations, streaming only for the final response
    const response = await claude.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      tools,
      messages: agentMessages,
    })

    // Check for tool_use blocks
    const toolUses = response.content.filter(
      (block): block is Anthropic.Messages.ToolUseBlock => block.type === 'tool_use',
    )

    // Stream any text blocks to the client
    for (const block of response.content) {
      if (block.type === 'text' && block.text) {
        sendEvent({ type: 'text_delta', text: block.text })
      }
    }

    // If no tool calls or end_turn, we're done
    if (toolUses.length === 0 || response.stop_reason === 'end_turn') {
      sendEvent({ type: 'done' })
      return
    }

    // Check for propose_changes — emit it and we're done
    const proposeChanges = toolUses.find((tu) => tu.name === 'propose_changes')
    if (proposeChanges) {
      emitProposedChanges(
        proposeChanges.id,
        JSON.stringify(proposeChanges.input),
        sendEvent,
      )
      sendEvent({ type: 'done' })
      return
    }

    // Execute cicero tool calls
    agentMessages.push({ role: 'assistant', content: response.content })
    const toolResults: Anthropic.Messages.ToolResultBlockParam[] = []

    for (const toolUse of toolUses) {
      sendEvent({
        type: 'text_delta',
        text: `\n\n*Searching placements (${toolUse.name})…*\n\n`,
      })

      try {
        const resultText = await executeCiceroTool(
          toolUse.name,
          toolUse.input as Record<string, unknown>,
        )
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: resultText,
        })
      } catch (err) {
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: `Error: ${err instanceof Error ? err.message : 'Tool execution failed'}`,
          is_error: true,
        })
      }
    }

    agentMessages.push({ role: 'user', content: toolResults })
    iterations++
  }

  // Exceeded max iterations
  sendEvent({
    type: 'text_delta',
    text: '\n\n*Reached maximum search iterations. Here are the results so far.*',
  })
  sendEvent({ type: 'done' })
}

// ---------------------------------------------------------------------------
// Shared helper — parse and emit proposed changes
// ---------------------------------------------------------------------------

function emitProposedChanges(
  toolUseId: string,
  toolInput: string,
  sendEvent: (data: Record<string, unknown>) => void,
) {
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
    sendEvent({
      type: 'tool_use',
      proposedChanges: changes,
      toolUseId,
      toolUseInput: parsed,
    })
  } catch {
    sendEvent({
      type: 'error',
      message: 'Failed to parse proposed changes',
    })
  }
}
