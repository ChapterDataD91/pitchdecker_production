import Anthropic from '@anthropic-ai/sdk'
import type { AIAnalysisResponse } from '@/lib/ai-types'

let client: Anthropic | null = null

export function getClaudeClient(): Anthropic {
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }
  return client
}

const SUGGESTION_TOOL = {
  name: 'provide_suggestions' as const,
  description: 'Provide structured criteria suggestions based on the analysis',
  input_schema: {
    type: 'object' as const,
    properties: {
      suggestions: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            text: { type: 'string' as const, description: 'The criterion text' },
            weight: { type: 'number' as const, enum: [1, 2, 3, 4, 5], description: 'Importance weight 1-5' },
            category: { type: 'string' as const, enum: ['mustHave', 'niceToHave'], description: 'Classification' },
            reasoning: { type: 'string' as const, description: 'Brief explanation for this criterion' },
          },
          required: ['text', 'weight', 'category'],
        },
      },
      personalityProfile: {
        type: 'object' as const,
        description: 'Personality profile for the ideal candidate — an intro paragraph describing the culture/context and a list of key personality traits',
        properties: {
          intro: { type: 'string' as const, description: 'One sentence describing the client culture and what the role demands, e.g. "The client has an ambitious, results-driven culture. The CEO must combine:"' },
          traits: {
            type: 'array' as const,
            items: { type: 'string' as const },
            description: 'Key personality/leadership traits, each as a concise sentence',
          },
        },
        required: ['intro', 'traits'],
      },
      summary: { type: 'string' as const, description: 'Brief summary of what was analyzed' },
    },
    required: ['suggestions'],
  },
}

export async function analyzeWithClaude(
  systemPrompt: string,
  userContent: string,
): Promise<AIAnalysisResponse> {
  const claude = getClaudeClient()

  const response = await claude.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    tools: [SUGGESTION_TOOL],
    tool_choice: { type: 'tool', name: 'provide_suggestions' },
    messages: [
      { role: 'user', content: userContent },
    ],
  })

  const toolBlock = response.content.find(
    (block) => block.type === 'tool_use' && block.name === 'provide_suggestions'
  )

  if (!toolBlock || toolBlock.type !== 'tool_use') {
    throw new Error('Claude did not return structured suggestions')
  }

  const input = toolBlock.input as AIAnalysisResponse
  return {
    suggestions: input.suggestions || [],
    personalityProfile: input.personalityProfile,
    summary: input.summary,
  }
}

export async function analyzeWithWebSearch(
  systemPrompt: string,
  query: string,
): Promise<AIAnalysisResponse> {
  const claude = getClaudeClient()

  const response = await claude.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    tools: [
      SUGGESTION_TOOL,
      {
        type: 'web_search_20250305' as const,
        name: 'web_search' as const,
        max_uses: 5,
      },
    ],
    messages: [
      { role: 'user', content: query },
    ],
  })

  const toolBlock = response.content.find(
    (block) => block.type === 'tool_use' && block.name === 'provide_suggestions'
  )

  if (!toolBlock || toolBlock.type !== 'tool_use') {
    throw new Error('Claude did not return structured suggestions after web search')
  }

  const input = toolBlock.input as AIAnalysisResponse
  return {
    suggestions: input.suggestions || [],
    personalityProfile: input.personalityProfile,
    summary: input.summary,
  }
}
