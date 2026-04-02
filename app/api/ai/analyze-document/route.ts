import { NextRequest, NextResponse } from 'next/server'
import type { AISectionContext, AIAnalysisResponse } from '@/lib/ai-types'
import { analyzeWithClaude, getClaudeClient } from '@/lib/ai/claude-client'
import { getAnalysisSystemPrompt } from '@/lib/ai/prompts'
import { PDFParse } from 'pdf-parse'
import mammoth from 'mammoth'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const SUPPORTED_TEXT_EXTENSIONS = new Set(['pdf', 'docx', 'txt'])
const SUPPORTED_IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp'])

type ImageMediaType = 'image/png' | 'image/jpeg' | 'image/webp'

function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? ''
}

function getImageMediaType(ext: string): ImageMediaType {
  const map: Record<string, ImageMediaType> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
  }
  return map[ext]
}

async function extractTextFromFile(
  buffer: Buffer,
  extension: string,
): Promise<string> {
  switch (extension) {
    case 'pdf': {
      const parser = new PDFParse({ data: new Uint8Array(buffer) })
      const textResult = await parser.getText()
      await parser.destroy()
      return textResult.text
    }
    case 'docx': {
      const result = await mammoth.extractRawText({ buffer })
      return result.value
    }
    case 'txt': {
      return buffer.toString('utf-8')
    }
    default:
      throw new Error(`Unsupported text file type: .${extension}`)
  }
}

async function analyzeImageWithClaude(
  buffer: Buffer,
  mediaType: ImageMediaType,
  systemPrompt: string,
): Promise<AIAnalysisResponse> {
  const claude = getClaudeClient()
  const base64 = buffer.toString('base64')

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
        summary: { type: 'string' as const, description: 'Brief summary of what was analyzed' },
      },
      required: ['suggestions'],
    },
  }

  const response = await claude.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    tools: [SUGGESTION_TOOL],
    tool_choice: { type: 'tool', name: 'provide_suggestions' },
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64,
            },
          },
          {
            type: 'text',
            text: 'Analyze this image and extract relevant criteria and insights.',
          },
        ],
      },
    ],
  })

  const toolBlock = response.content.find(
    (block) => block.type === 'tool_use' && block.name === 'provide_suggestions',
  )

  if (!toolBlock || toolBlock.type !== 'tool_use') {
    throw new Error('Claude did not return structured suggestions for image analysis')
  }

  const input = toolBlock.input as AIAnalysisResponse
  return {
    suggestions: input.suggestions || [],
    summary: input.summary,
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const file = formData.get('file')
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Missing "file" in form data' },
        { status: 400 },
      )
    }

    const contextStr = formData.get('context')
    if (!contextStr || typeof contextStr !== 'string') {
      return NextResponse.json(
        { error: 'Missing "context" in form data (should be a JSON string)' },
        { status: 400 },
      )
    }

    let context: AISectionContext
    try {
      context = JSON.parse(contextStr)
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in "context" field' },
        { status: 400 },
      )
    }

    if (!context.sectionType || !context.clientName || !context.roleTitle) {
      return NextResponse.json(
        { error: 'Incomplete "context" (requires sectionType, clientName, roleTitle)' },
        { status: 400 },
      )
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File exceeds maximum size of 10MB (got ${(file.size / 1024 / 1024).toFixed(1)}MB)` },
        { status: 413 },
      )
    }

    const extension = getFileExtension(file.name)
    const isTextFile = SUPPORTED_TEXT_EXTENSIONS.has(extension)
    const isImage = SUPPORTED_IMAGE_EXTENSIONS.has(extension)

    if (!isTextFile && !isImage) {
      return NextResponse.json(
        { error: `Unsupported file type: .${extension}. Supported: PDF, DOCX, TXT, PNG, JPG, WEBP` },
        { status: 415 },
      )
    }

    const instructionStr = formData.get('instruction')
    const instruction = typeof instructionStr === 'string' && instructionStr.trim() ? instructionStr.trim() : undefined

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const systemPrompt = getAnalysisSystemPrompt(context)

    let result: AIAnalysisResponse

    if (isImage) {
      const mediaType = getImageMediaType(extension)
      result = await analyzeImageWithClaude(buffer, mediaType, systemPrompt)
    } else {
      const extractedText = await extractTextFromFile(buffer, extension)
      if (!extractedText.trim()) {
        return NextResponse.json(
          { error: 'Could not extract any text from the uploaded file' },
          { status: 422 },
        )
      }
      const userContent = instruction
        ? `${extractedText}\n\n---\nAdditional instruction from the consultant: ${instruction}`
        : extractedText
      result = await analyzeWithClaude(systemPrompt, userContent)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[analyze-document] Error:', error)

    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: message },
      { status: 500 },
    )
  }
}
