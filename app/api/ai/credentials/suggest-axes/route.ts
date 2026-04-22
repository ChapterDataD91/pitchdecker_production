// ---------------------------------------------------------------------------
// POST /api/ai/credentials/suggest-axes
// One-shot Claude call that proposes 3 credential axes from deck context.
// No database calls, no cicero — purely editorial.
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server'
import { getClaudeClient } from '@/lib/ai/claude-client'
import { getCredentialsAxesSystemPrompt, withLanguage } from '@/lib/ai/prompts'
import type { Locale } from '@/lib/types'

interface SuggestAxesRequest {
  deckContext: {
    clientName: string
    roleTitle: string
    coverIntro?: string
    searchProfileSummary?: string
  }
  locale?: Locale
}

interface DraftAxis {
  name: string
  description: string
  intro: string
  contextLabel: string
}

const SUGGEST_AXES_TOOL = {
  name: 'suggest_axes' as const,
  description: 'Propose 3 credential axes for the pitch deck',
  input_schema: {
    type: 'object' as const,
    properties: {
      axes: {
        type: 'array' as const,
        minItems: 3,
        maxItems: 3,
        items: {
          type: 'object' as const,
          properties: {
            name: {
              type: 'string' as const,
              description: 'Short axis label (1-3 words), e.g. "Healthcare" or "PE-backed Leadership"',
            },
            description: {
              type: 'string' as const,
              description: 'One-line subtitle explaining the angle',
            },
            intro: {
              type: 'string' as const,
              description: 'One or two sentences in the firm\'s voice (first person plural) explaining why this axis is relevant',
            },
            contextLabel: {
              type: 'string' as const,
              enum: ['Industry', 'Sub-industry', 'Investor', 'Specialization'],
              description: 'The most informative third column for the placement table under this axis',
            },
          },
          required: ['name', 'description', 'intro', 'contextLabel'],
        },
      },
    },
    required: ['axes'],
  },
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SuggestAxesRequest

    if (!body.deckContext?.clientName || !body.deckContext?.roleTitle) {
      return NextResponse.json(
        { error: 'Missing required fields: clientName and roleTitle' },
        { status: 400 },
      )
    }

    const claude = getClaudeClient()
    const systemPrompt = withLanguage(
      getCredentialsAxesSystemPrompt(body.deckContext),
      body.locale,
    )

    const response = await claude.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      tools: [SUGGEST_AXES_TOOL],
      tool_choice: { type: 'tool', name: 'suggest_axes' },
      messages: [
        {
          role: 'user',
          content: `Propose 3 credential axes for a pitch deck targeting ${body.deckContext.clientName} for the role of ${body.deckContext.roleTitle}.`,
        },
      ],
    })

    const toolBlock = response.content.find(
      (block) => block.type === 'tool_use' && block.name === 'suggest_axes',
    )

    if (!toolBlock || toolBlock.type !== 'tool_use') {
      return NextResponse.json(
        { error: 'Claude did not return structured axes' },
        { status: 500 },
      )
    }

    const result = toolBlock.input as { axes: DraftAxis[] }

    return NextResponse.json({ axes: result.axes })
  } catch (err) {
    console.error('Suggest axes failed:', err)
    return NextResponse.json(
      { error: 'Failed to generate credential axes' },
      { status: 500 },
    )
  }
}
