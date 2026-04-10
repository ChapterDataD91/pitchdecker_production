// ---------------------------------------------------------------------------
// POST /api/ai/timeline/suggest-phases
// One-shot Claude call that proposes timeline phases from deck context.
// No database calls — purely editorial.
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server'
import { getClaudeClient } from '@/lib/ai/claude-client'
import { getTimelineSystemPrompt } from '@/lib/ai/prompts'

interface SuggestPhasesRequest {
  deckContext: {
    clientName: string
    roleTitle: string
    coverIntro?: string
    searchProfileSummary?: string
  }
}

interface DraftPhase {
  name: string
  description: string
  durationWeeks: number
  milestones: string[]
}

const SUGGEST_PHASES_TOOL = {
  name: 'suggest_phases' as const,
  description: 'Propose timeline phases for an executive search pitch deck',
  input_schema: {
    type: 'object' as const,
    properties: {
      phases: {
        type: 'array' as const,
        minItems: 4,
        maxItems: 7,
        items: {
          type: 'object' as const,
          properties: {
            name: {
              type: 'string' as const,
              description: 'Phase name, e.g. "Intake & Market Scan"',
            },
            description: {
              type: 'string' as const,
              description: 'One or two sentences describing what happens in this phase, referencing the client/role where relevant',
            },
            durationWeeks: {
              type: 'number' as const,
              minimum: 1,
              maximum: 6,
              description: 'Duration in weeks',
            },
            milestones: {
              type: 'array' as const,
              items: { type: 'string' as const },
              description: 'Key milestones or deliverables for this phase (1-3 items)',
            },
          },
          required: ['name', 'description', 'durationWeeks', 'milestones'],
        },
      },
    },
    required: ['phases'],
  },
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SuggestPhasesRequest

    if (!body.deckContext?.clientName || !body.deckContext?.roleTitle) {
      return NextResponse.json(
        { error: 'Missing required fields: clientName and roleTitle' },
        { status: 400 },
      )
    }

    const claude = getClaudeClient()
    const systemPrompt = getTimelineSystemPrompt(body.deckContext)

    const response = await claude.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      tools: [SUGGEST_PHASES_TOOL],
      tool_choice: { type: 'tool', name: 'suggest_phases' },
      messages: [
        {
          role: 'user',
          content: `Propose a timeline for an executive search targeting ${body.deckContext.clientName} for the role of ${body.deckContext.roleTitle}.`,
        },
      ],
    })

    const toolBlock = response.content.find(
      (block) => block.type === 'tool_use' && block.name === 'suggest_phases',
    )

    if (!toolBlock || toolBlock.type !== 'tool_use') {
      return NextResponse.json(
        { error: 'Claude did not return structured phases' },
        { status: 500 },
      )
    }

    const result = toolBlock.input as { phases: DraftPhase[] }

    return NextResponse.json({ phases: result.phases })
  } catch (err) {
    console.error('Suggest phases failed:', err)
    return NextResponse.json(
      { error: 'Failed to generate timeline phases' },
      { status: 500 },
    )
  }
}
