import { NextRequest, NextResponse } from 'next/server'
import type { AISectionContext } from '@/lib/ai-types'
import type { Locale } from '@/lib/types'
import { analyzeWithClaude } from '@/lib/ai/claude-client'
import { getAnalysisSystemPrompt, withLanguage } from '@/lib/ai/prompts'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, context, instruction, locale } = body as {
      text: string
      context: AISectionContext
      instruction?: string
      locale?: Locale
    }

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Missing or empty "text" field' },
        { status: 400 },
      )
    }

    if (!context || !context.sectionType || !context.clientName || !context.roleTitle) {
      return NextResponse.json(
        { error: 'Missing or incomplete "context" field (requires sectionType, clientName, roleTitle)' },
        { status: 400 },
      )
    }

    const systemPrompt = withLanguage(getAnalysisSystemPrompt(context), locale)
    const userContent = instruction
      ? `${text}\n\n---\nAdditional instruction from the consultant: ${instruction}`
      : text
    const result = await analyzeWithClaude(systemPrompt, userContent)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[analyze-text] Error:', error)

    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: message },
      { status: 500 },
    )
  }
}
