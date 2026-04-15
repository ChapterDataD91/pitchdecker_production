// ---------------------------------------------------------------------------
// POST /api/ai/cover/suggest
// Zero-input starter draft — generates hero tagline and intro paragraph
// from client + role + uploaded context documents.
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server'
import { getClaudeClient } from '@/lib/ai/claude-client'
import {
  getCoverStarterSystemPrompt,
  type CoverStarterContext,
} from '@/lib/ai/prompts'

interface SuggestRequest {
  deckContext: CoverStarterContext
}

interface DraftResponse {
  tagline: string
  introParagraph: string
}

const DRAFT_TOOL = {
  name: 'draft_cover' as const,
  description:
    'Return the hero tagline and introduction paragraph for the pitch deck cover',
  input_schema: {
    type: 'object' as const,
    properties: {
      tagline: {
        type: 'string' as const,
        description:
          'Short tagline (8–16 words) shown under the hero title. No trailing period optional, but keep it punchy.',
      },
      introParagraph: {
        type: 'string' as const,
        description:
          'Longer introduction, 2 short paragraphs separated by a blank line (roughly 120–180 words total).',
      },
    },
    required: ['tagline', 'introParagraph'],
  },
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SuggestRequest

    if (!body.deckContext) {
      return NextResponse.json(
        { error: 'Missing deckContext' },
        { status: 400 },
      )
    }

    const claude = getClaudeClient()
    const systemPrompt = getCoverStarterSystemPrompt(body.deckContext)

    const response = await claude.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      tools: [DRAFT_TOOL],
      tool_choice: { type: 'tool', name: 'draft_cover' },
      messages: [
        {
          role: 'user',
          content: `Draft the hero tagline and introduction for ${
            body.deckContext.roleTitle || 'the role'
          }${
            body.deckContext.clientName
              ? ` at ${body.deckContext.clientName}`
              : ''
          }, drawing on the uploaded context documents.`,
        },
      ],
    })

    const toolBlock = response.content.find(
      (block) => block.type === 'tool_use' && block.name === 'draft_cover',
    )

    if (!toolBlock || toolBlock.type !== 'tool_use') {
      return NextResponse.json(
        { error: 'Claude did not return a structured cover draft' },
        { status: 500 },
      )
    }

    const result = toolBlock.input as DraftResponse
    return NextResponse.json(result)
  } catch (err) {
    console.error('Suggest cover failed:', err)
    return NextResponse.json(
      { error: 'Failed to generate cover draft' },
      { status: 500 },
    )
  }
}
