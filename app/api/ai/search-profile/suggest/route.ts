// ---------------------------------------------------------------------------
// POST /api/ai/search-profile/suggest
// Zero-input starter draft — generates must-haves, nice-to-haves, and the
// personality profile directly from client + role + cover intro.
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server'
import { getClaudeClient } from '@/lib/ai/claude-client'
import {
  getSearchProfileStarterSystemPrompt,
  type SearchProfileStarterContext,
} from '@/lib/ai/prompts'
import type { Weight } from '@/lib/types'

interface SuggestRequest {
  deckContext: SearchProfileStarterContext
}

interface DraftCriterion {
  text: string
  weight: Weight
}

interface DraftResponse {
  mustHaves: DraftCriterion[]
  niceToHaves: DraftCriterion[]
  personalityProfile: {
    intro: string
    traits: string[]
  }
}

const SUGGEST_TOOL = {
  name: 'suggest_search_profile' as const,
  description:
    'Propose a starter search profile — must-haves, nice-to-haves, and personality profile',
  input_schema: {
    type: 'object' as const,
    properties: {
      mustHaves: {
        type: 'array' as const,
        minItems: 5,
        maxItems: 8,
        items: {
          type: 'object' as const,
          properties: {
            text: { type: 'string' as const },
            weight: {
              type: 'number' as const,
              minimum: 1,
              maximum: 5,
              description: 'Importance weight: 5 = dealbreaker, 1 = minor',
            },
          },
          required: ['text', 'weight'],
        },
      },
      niceToHaves: {
        type: 'array' as const,
        minItems: 3,
        maxItems: 5,
        items: {
          type: 'object' as const,
          properties: {
            text: { type: 'string' as const },
            weight: { type: 'number' as const, minimum: 1, maximum: 5 },
          },
          required: ['text', 'weight'],
        },
      },
      personalityProfile: {
        type: 'object' as const,
        properties: {
          intro: {
            type: 'string' as const,
            description:
              "One sentence describing the client's culture and the personality the role demands. End with a colon.",
          },
          traits: {
            type: 'array' as const,
            minItems: 3,
            maxItems: 5,
            items: { type: 'string' as const },
            description: 'Specific personality/leadership qualities as concise sentences',
          },
        },
        required: ['intro', 'traits'],
      },
    },
    required: ['mustHaves', 'niceToHaves', 'personalityProfile'],
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
    const systemPrompt = getSearchProfileStarterSystemPrompt(body.deckContext)

    const response = await claude.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      tools: [SUGGEST_TOOL],
      tool_choice: { type: 'tool', name: 'suggest_search_profile' },
      messages: [
        {
          role: 'user',
          content: `Draft a starter search profile for the role of ${body.deckContext.roleTitle} at ${body.deckContext.clientName}.`,
        },
      ],
    })

    const toolBlock = response.content.find(
      (block) =>
        block.type === 'tool_use' && block.name === 'suggest_search_profile',
    )

    if (!toolBlock || toolBlock.type !== 'tool_use') {
      return NextResponse.json(
        { error: 'Claude did not return a structured profile' },
        { status: 500 },
      )
    }

    const result = toolBlock.input as DraftResponse
    return NextResponse.json(result)
  } catch (err) {
    console.error('Suggest search profile failed:', err)
    return NextResponse.json(
      { error: 'Failed to generate search profile' },
      { status: 500 },
    )
  }
}
