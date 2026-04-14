// ---------------------------------------------------------------------------
// POST /api/ai/personas/suggest
// One-shot Claude call that proposes 3 candidate personas from deck context.
// Pulls searchProfile + credentials + cover as the main signal.
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server'
import { getClaudeClient } from '@/lib/ai/claude-client'
import { getPersonasSystemPrompt, type PersonasContext } from '@/lib/ai/prompts'
import type { PersonaPoolSize } from '@/lib/types'

interface SuggestPersonasRequest {
  deckContext: PersonasContext
}

interface DraftPersona {
  title: string
  description: string
  poolSize: PersonaPoolSize
  poolRangeLabel: string
  poolRationale: string
}

const SUGGEST_PERSONAS_TOOL = {
  name: 'suggest_personas' as const,
  description: 'Propose candidate personas for an executive search pitch deck',
  input_schema: {
    type: 'object' as const,
    properties: {
      personas: {
        type: 'array' as const,
        minItems: 1,
        maxItems: 3,
        items: {
          type: 'object' as const,
          properties: {
            title: {
              type: 'string' as const,
              description:
                "Evocative noun phrase, e.g. 'The Healthcare-Tech Leader'. Do NOT include 'Profile A/B/C'.",
            },
            description: {
              type: 'string' as const,
              description:
                '2-4 sentences describing the archetype — current situation, scale, experience, relevant capabilities',
            },
            poolSize: {
              type: 'string' as const,
              enum: ['narrow', 'moderate', 'strong'],
              description: 'Sourcing difficulty tier',
            },
            poolRangeLabel: {
              type: 'string' as const,
              description: "Short chip label, e.g. '3–5 candidates'",
            },
            poolRationale: {
              type: 'string' as const,
              description: 'One sentence explaining why the pool is that size',
            },
          },
          required: [
            'title',
            'description',
            'poolSize',
            'poolRangeLabel',
            'poolRationale',
          ],
        },
      },
    },
    required: ['personas'],
  },
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SuggestPersonasRequest

    if (!body.deckContext?.clientName || !body.deckContext?.roleTitle) {
      return NextResponse.json(
        { error: 'Missing required fields: clientName and roleTitle' },
        { status: 400 },
      )
    }

    const claude = getClaudeClient()
    const systemPrompt = getPersonasSystemPrompt(body.deckContext)

    const response = await claude.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      tools: [SUGGEST_PERSONAS_TOOL],
      tool_choice: { type: 'tool', name: 'suggest_personas' },
      messages: [
        {
          role: 'user',
          content: body.deckContext.keep?.length
            ? `Propose 1 new candidate persona covering distinct terrain from the ${body.deckContext.keep.length} kept persona${body.deckContext.keep.length === 1 ? '' : 's'} for the ${body.deckContext.roleTitle} role at ${body.deckContext.clientName}.`
            : `Propose 3 candidate personas for an executive search targeting ${body.deckContext.clientName} for the role of ${body.deckContext.roleTitle}.`,
        },
      ],
    })

    const toolBlock = response.content.find(
      (block) => block.type === 'tool_use' && block.name === 'suggest_personas',
    )

    if (!toolBlock || toolBlock.type !== 'tool_use') {
      return NextResponse.json(
        { error: 'Claude did not return structured personas' },
        { status: 500 },
      )
    }

    const result = toolBlock.input as { personas: DraftPersona[] }

    return NextResponse.json({ personas: result.personas })
  } catch (err) {
    console.error('Suggest personas failed:', err)
    return NextResponse.json(
      { error: 'Failed to generate candidate personas' },
      { status: 500 },
    )
  }
}
