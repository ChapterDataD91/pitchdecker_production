// ---------------------------------------------------------------------------
// POST /api/ai/scorecard/suggest
// Generates the Leadership & Personality and First-Year Success Factors
// categories from deck context. Must-haves / nice-to-haves stay the
// consultant's — typically imported from the search profile.
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server'
import { getClaudeClient } from '@/lib/ai/claude-client'
import { getScorecardSystemPrompt, type ScorecardContext } from '@/lib/ai/prompts'
import type { Weight } from '@/lib/types'

interface SuggestRequest {
  deckContext: ScorecardContext
}

interface DraftCriterion {
  text: string
  weight: Weight
}

interface DraftResponse {
  leadership: DraftCriterion[]
  successFactors: DraftCriterion[]
}

const SUGGEST_TOOL = {
  name: 'suggest_scorecard' as const,
  description:
    'Propose leadership & personality and first-year success factors criteria',
  input_schema: {
    type: 'object' as const,
    properties: {
      leadership: {
        type: 'array' as const,
        minItems: 5,
        maxItems: 7,
        items: {
          type: 'object' as const,
          properties: {
            text: {
              type: 'string' as const,
              description:
                'Leadership criterion in the shape "<Topic> — <specific angle>". Max 10 words. Always include the angle. No banned filler.',
            },
            weight: {
              type: 'number' as const,
              minimum: 1,
              maximum: 5,
              description: 'Importance: 5 = dealbreaker, 1 = minor',
            },
          },
          required: ['text', 'weight'],
        },
      },
      successFactors: {
        type: 'array' as const,
        minItems: 3,
        maxItems: 5,
        items: {
          type: 'object' as const,
          properties: {
            text: {
              type: 'string' as const,
              description:
                'A concrete year-one outcome. Max 12 words. Reference client-specific situation/competitors/priorities where context supports it.',
            },
            weight: { type: 'number' as const, minimum: 1, maximum: 5 },
          },
          required: ['text', 'weight'],
        },
      },
    },
    required: ['leadership', 'successFactors'],
  },
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SuggestRequest

    if (!body.deckContext?.clientName || !body.deckContext?.roleTitle) {
      return NextResponse.json(
        { error: 'Missing required fields: clientName and roleTitle' },
        { status: 400 },
      )
    }

    const claude = getClaudeClient()
    const systemPrompt = getScorecardSystemPrompt(body.deckContext)

    const response = await claude.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      tools: [SUGGEST_TOOL],
      tool_choice: { type: 'tool', name: 'suggest_scorecard' },
      messages: [
        {
          role: 'user',
          content: `Propose leadership and success factor criteria for the role of ${body.deckContext.roleTitle} at ${body.deckContext.clientName}.`,
        },
      ],
    })

    const toolBlock = response.content.find(
      (block) => block.type === 'tool_use' && block.name === 'suggest_scorecard',
    )

    if (!toolBlock || toolBlock.type !== 'tool_use') {
      return NextResponse.json(
        { error: 'Claude did not return a structured scorecard' },
        { status: 500 },
      )
    }

    const result = toolBlock.input as DraftResponse
    return NextResponse.json(result)
  } catch (err) {
    console.error('Suggest scorecard failed:', err)
    return NextResponse.json(
      { error: 'Failed to generate scorecard' },
      { status: 500 },
    )
  }
}
