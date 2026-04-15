// ---------------------------------------------------------------------------
// POST /api/ai/credentials/find-placements
// Agentic tool-use loop: Claude calls cicero MCP tools to find placements
// for one credential axis. Returns a list of client placements.
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server'
import type Anthropic from '@anthropic-ai/sdk'
import { getClaudeClient } from '@/lib/ai/claude-client'
import { getCredentialsSourcingSystemPrompt } from '@/lib/ai/prompts'
import { getCiceroClient } from '@/lib/mcp/cicero-client'
import type { CredentialAxis } from '@/lib/types'

const MAX_ITERATIONS = 8
const TOOL_TIMEOUT_MS = 15_000

interface FindPlacementsRequest {
  axis: CredentialAxis
  deckContext: {
    clientName: string
    roleTitle: string
    coverIntro?: string
  }
}

export interface ClientPlacement {
  placementId: string
  role: string
  company: string
  context: string
  year?: number
  rationale?: string
}

interface FindPlacementsResponse {
  clients: ClientPlacement[]
  toolCalls: number
  reasoning?: string
}

// ---------------------------------------------------------------------------
// Terminal tool — Claude calls this when done to emit structured results
// ---------------------------------------------------------------------------

const RETURN_PLACEMENTS_TOOL: Anthropic.Messages.Tool = {
  name: 'return_placements',
  description:
    'Return the final list of selected placements for this axis. Call this when you have identified the best matches.',
  input_schema: {
    type: 'object' as const,
    properties: {
      clients: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            placementId: {
              type: 'string' as const,
              description: 'The placement_id from bh_placements',
            },
            role: {
              type: 'string' as const,
              description: 'Job title placed at the client',
            },
            company: {
              type: 'string' as const,
              description: 'Client company where the placement was made',
            },
            context: {
              type: 'string' as const,
              description:
                'Value for the axis\'s context column (e.g., industry, investor, specialization)',
            },
            year: {
              type: 'number' as const,
              description: 'Year of placement (optional)',
            },
            rationale: {
              type: 'string' as const,
              description: 'Brief explanation of why this placement is relevant (optional)',
            },
          },
          required: ['placementId', 'role', 'company', 'context'],
        },
      },
      reasoning: {
        type: 'string' as const,
        description: 'Brief summary of the search strategy used',
      },
    },
    required: ['candidates'],
  },
}

// ---------------------------------------------------------------------------
// Convert MCP tool schemas to Anthropic tool format
// ---------------------------------------------------------------------------

interface MCPTool {
  name: string
  description?: string
  inputSchema: {
    type: 'object'
    properties?: Record<string, object>
    required?: string[]
    [key: string]: unknown
  }
}

function mcpToolToAnthropic(tool: MCPTool): Anthropic.Messages.Tool {
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
// Execute a single cicero tool call with timeout
// ---------------------------------------------------------------------------

async function executeCiceroTool(
  toolName: string,
  toolInput: Record<string, unknown>,
): Promise<string> {
  const cicero = await getCiceroClient()

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error(`Tool ${toolName} timed out after ${TOOL_TIMEOUT_MS}ms`)),
      TOOL_TIMEOUT_MS,
    ),
  )

  const callPromise = cicero.callTool({
    name: toolName,
    arguments: toolInput,
  })

  const result = await Promise.race([callPromise, timeoutPromise])

  // Extract text content from MCP result
  const content = result.content as Array<{ type: string; text?: string }>
  const textParts = content
    .filter((c) => c.type === 'text' && typeof c.text === 'string')
    .map((c) => c.text as string)

  return textParts.join('\n') || JSON.stringify(result.content)
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  // Check for cicero URL early
  if (!process.env.CICERO_URL) {
    return NextResponse.json(
      {
        error:
          "Couldn't reach the placements service. If you're running locally, make sure cicero is running on port 3001 with SKIP_AUTH=true. Otherwise check the service status.",
      },
      { status: 501 },
    )
  }

  let body: FindPlacementsRequest
  try {
    body = (await request.json()) as FindPlacementsRequest
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!body.axis || !body.deckContext?.clientName || !body.deckContext?.roleTitle) {
    return NextResponse.json(
      { error: 'Missing required fields: axis, deckContext.clientName, deckContext.roleTitle' },
      { status: 400 },
    )
  }

  try {
    // 1. Connect to cicero and list tools
    const cicero = await getCiceroClient()
    const { tools: mcpTools } = await cicero.listTools()

    // 2. Convert MCP tools to Anthropic format + add return_placements
    const anthropicTools: Anthropic.Messages.Tool[] = [
      ...(mcpTools as MCPTool[]).map(mcpToolToAnthropic),
      RETURN_PLACEMENTS_TOOL,
    ]

    // 3. Build system prompt and initial message
    const systemPrompt = getCredentialsSourcingSystemPrompt({
      ...body.deckContext,
      axis: body.axis,
    })

    const claude = getClaudeClient()
    const messages: Anthropic.Messages.MessageParam[] = [
      {
        role: 'user',
        content: `Find relevant placements for the "${body.axis.name}" axis. The axis focuses on: ${body.axis.description}. The intro reads: "${body.axis.intro}". The third column should show: ${body.axis.contextLabel}. Find 6-15 placements that best demonstrate this axis of experience.`,
      },
    ]

    // 4. Agentic loop
    let iterations = 0
    let totalToolCalls = 0

    while (iterations < MAX_ITERATIONS) {
      const response = await claude.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 4096,
        system: systemPrompt,
        tools: anthropicTools,
        messages,
      })

      // Add assistant response to message history
      messages.push({ role: 'assistant', content: response.content })

      // Check for end_turn (no tool calls)
      if (response.stop_reason === 'end_turn') {
        break
      }

      // Find tool_use blocks
      const toolUses = response.content.filter(
        (block): block is Anthropic.Messages.ToolUseBlock => block.type === 'tool_use',
      )

      if (toolUses.length === 0) {
        break
      }

      // Process tool calls
      const toolResults: Anthropic.Messages.ToolResultBlockParam[] = []

      for (const toolUse of toolUses) {
        totalToolCalls++

        // Check for terminal tool
        if (toolUse.name === 'return_placements') {
          const result = toolUse.input as {
            clients: ClientPlacement[]
            reasoning?: string
          }
          const response: FindPlacementsResponse = {
            clients: result.clients || [],
            toolCalls: totalToolCalls,
            reasoning: result.reasoning,
          }
          return NextResponse.json(response)
        }

        // Execute cicero tool
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
          // Report error to Claude so it can adjust strategy
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: `Error: ${err instanceof Error ? err.message : 'Tool execution failed'}`,
            is_error: true,
          })
        }
      }

      // Add tool results and continue the loop
      messages.push({ role: 'user', content: toolResults })
      iterations++
    }

    // If we exit the loop without return_placements, return empty
    const response: FindPlacementsResponse = {
      clients: [],
      toolCalls: totalToolCalls,
      reasoning:
        'Search completed without explicit placement return. This may indicate the agent did not find suitable matches.',
    }
    return NextResponse.json(response)
  } catch (err) {
    console.error('Find placements failed:', err)

    const message =
      err instanceof Error && err.message.includes('CICERO_URL')
        ? "Couldn't reach the placements service. If you're running locally, make sure cicero is running on port 3001 with SKIP_AUTH=true. Otherwise check the service status."
        : 'Failed to search for placements'

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
