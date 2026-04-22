import { NextRequest, NextResponse } from 'next/server'
import type { AISectionContext } from '@/lib/ai-types'
import type { Locale } from '@/lib/types'
import { analyzeWithWebSearch } from '@/lib/ai/claude-client'
import {
  getAnalysisSystemPrompt,
  getWebSearchPrompt,
  withLanguage,
} from '@/lib/ai/prompts'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, context, instruction, locale } = body as {
      query: string
      context: AISectionContext
      instruction?: string
      locale?: Locale
    }

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Missing or empty "query" field' },
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
    const webSearchQuery = instruction
      ? `${getWebSearchPrompt(context)}\n\nAdditional instruction from the consultant: ${instruction}`
      : getWebSearchPrompt(context)
    const result = await analyzeWithWebSearch(systemPrompt, webSearchQuery)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[web-search] Error:', error)

    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: message },
      { status: 500 },
    )
  }
}
