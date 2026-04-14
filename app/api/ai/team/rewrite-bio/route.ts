// ---------------------------------------------------------------------------
// POST /api/ai/team/rewrite-bio
// Rewrites a team member's bio so it lands for THIS specific search.
// Keep facts, tighten voice. Max 3 sentences.
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server'
import { getClaudeClient } from '@/lib/ai/claude-client'

interface RewriteRequest {
  memberName: string
  memberTitle: string
  currentBio: string
  group: 'leadTeam' | 'network'
  deckContext: {
    clientName: string
    roleTitle: string
    coverIntro?: string
  }
}

const RETURN_BIO_TOOL = {
  name: 'return_bio' as const,
  description: 'Return the rewritten bio for the team member.',
  input_schema: {
    type: 'object' as const,
    properties: {
      rewritten: {
        type: 'string' as const,
        description:
          'The rewritten bio. Max 3 sentences. Tight, specific, no hedges.',
      },
    },
    required: ['rewritten'],
  },
}

function buildSystemPrompt(body: RewriteRequest): string {
  const roleGuidance =
    body.group === 'leadTeam'
      ? `This member is on the **lead team** for this search. The bio must explain their specific role in THIS mandate and why their background is relevant.`
      : `This member is part of the **network** supporting this search. The bio is a 1–2 sentence expertise summary — not a full career note.`

  return `You rewrite consultant bios for a pitch deck at Top of Minds, a Dutch executive search firm. Your job: keep every fact, tighten the voice, and make the bio land for THIS specific search.

## The search
- **Client**: ${body.deckContext.clientName}
- **Role**: ${body.deckContext.roleTitle}
${body.deckContext.coverIntro ? `- **Context**: ${body.deckContext.coverIntro}` : ''}

## The member
- **Name**: ${body.memberName}
- **Title**: ${body.memberTitle}

## Guidance
- ${roleGuidance}
- Max 3 sentences total. Shorter is better.
- No hedges. Never use: "passionate about", "proven track record", "strong", "demonstrable", "excellent", "seasoned".
- Specific over generic. "Led three CEO searches in healthcare-tech since 2022" beats "extensive executive search experience".
- Do not invent facts. Only use what the current bio states — tighten, don't embellish.
- Keep the same voice as the current bio (third person, active).

Use the \`return_bio\` tool to return the result.`
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RewriteRequest

    if (
      !body.memberName ||
      !body.deckContext?.clientName ||
      !body.deckContext?.roleTitle
    ) {
      return NextResponse.json(
        { error: 'Missing memberName or deck context' },
        { status: 400 },
      )
    }

    const claude = getClaudeClient()
    const response = await claude.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: buildSystemPrompt(body),
      tools: [RETURN_BIO_TOOL],
      tool_choice: { type: 'tool', name: 'return_bio' },
      messages: [
        {
          role: 'user',
          content: body.currentBio.trim()
            ? `Current bio:\n\n${body.currentBio}`
            : `No bio yet — write a first draft for ${body.memberName} (${body.memberTitle}) in the voice described above.`,
        },
      ],
    })

    const toolBlock = response.content.find(
      (b) => b.type === 'tool_use' && b.name === 'return_bio',
    )
    if (!toolBlock || toolBlock.type !== 'tool_use') {
      return NextResponse.json(
        { error: 'Claude did not return a rewritten bio' },
        { status: 500 },
      )
    }

    const { rewritten } = toolBlock.input as { rewritten: string }
    return NextResponse.json({ rewritten })
  } catch (err) {
    console.error('[team/rewrite-bio] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Rewrite failed' },
      { status: 500 },
    )
  }
}
