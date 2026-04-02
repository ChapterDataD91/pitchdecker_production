import { NextRequest, NextResponse } from 'next/server'
import type { AISectionContext } from '@/lib/ai-types'
import { analyzeWithWebSearch } from '@/lib/ai/claude-client'
import { getAnalysisSystemPrompt, getWebSearchPrompt } from '@/lib/ai/prompts'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, context } = body as { query: string; context: AISectionContext }

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

    const systemPrompt = getAnalysisSystemPrompt(context)
    const webSearchQuery = getWebSearchPrompt(context)
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
