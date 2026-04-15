// ---------------------------------------------------------------------------
// POST /api/upload/candidate — Parse an uploaded CV (PDF/DOCX/TXT) into a
// structured Candidate using Claude tool-use.
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server'
import { v4 as uuid } from 'uuid'
import { getClaudeClient } from '@/lib/ai/claude-client'
import {
  MAX_FILE_SIZE,
  extractTextFromFile,
  getFileExtension,
  isTextFile,
} from '@/lib/ai/extract-text'
import type { Candidate, CareerEntry, EducationEntry, Persona } from '@/lib/types'

const PARSE_CV_TOOL = {
  name: 'parse_cv' as const,
  description:
    'Return the structured profile extracted from the candidate CV text.',
  input_schema: {
    type: 'object' as const,
    properties: {
      name: { type: 'string' as const },
      age: { type: 'number' as const, description: 'Age in years, 0 if unknown' },
      currentRole: { type: 'string' as const },
      currentCompany: { type: 'string' as const },
      summary: {
        type: 'string' as const,
        description:
          'One-paragraph executive summary (2–4 sentences) describing fit and background',
      },
      archetypeTag: {
        type: 'string' as const,
        description:
          'Short tag capturing archetype or sector, e.g. "HEALTH-TECH", "SAAS LEADER", "GROWTH CEO"',
      },
      suggestedPersonaId: {
        type: 'string' as const,
        description:
          'If personas are provided in the prompt, the id of the best-matching persona for this candidate, or empty string if no good match.',
      },
      careerHistory: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            period: { type: 'string' as const, description: 'e.g. "2020-2024"' },
            role: { type: 'string' as const },
            company: { type: 'string' as const },
            highlights: {
              type: 'array' as const,
              items: { type: 'string' as const },
            },
          },
          required: ['period', 'role', 'company', 'highlights'],
        },
      },
      education: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            period: { type: 'string' as const },
            degree: { type: 'string' as const },
            institution: { type: 'string' as const },
          },
          required: ['period', 'degree', 'institution'],
        },
      },
      languages: {
        type: 'array' as const,
        items: { type: 'string' as const },
      },
    },
    required: [
      'name',
      'currentRole',
      'currentCompany',
      'summary',
      'archetypeTag',
      'careerHistory',
    ],
  },
}

interface ParsedCv {
  name: string
  age?: number
  currentRole: string
  currentCompany: string
  summary: string
  archetypeTag: string
  suggestedPersonaId?: string
  careerHistory: Array<{
    period: string
    role: string
    company: string
    highlights: string[]
  }>
  education?: Array<{ period: string; degree: string; institution: string }>
  languages?: string[]
}

const SYSTEM_PROMPT = `You are an executive search analyst at Top of Minds. You are given the raw text of a candidate CV. Extract a structured profile. Be faithful to the source — do not invent data. If a field is unknown, leave it out (or return 0 for age). Keep the summary tight and executive — it will be read by a hiring client.`

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Missing "file" in form data' },
        { status: 400 },
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File exceeds maximum size of 10MB' },
        { status: 413 },
      )
    }

    const extension = getFileExtension(file.name)
    if (!isTextFile(extension)) {
      return NextResponse.json(
        {
          error: `Unsupported file type: .${extension}. Upload a PDF, DOCX, or TXT.`,
        },
        { status: 415 },
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const rawText = await extractTextFromFile(buffer, extension)

    if (!rawText.trim()) {
      return NextResponse.json(
        { error: 'Could not extract any text from this file' },
        { status: 422 },
      )
    }

    // Optional: deck personas for auto-matching
    const personasRaw = formData.get('personas')
    let personas: Persona[] = []
    if (typeof personasRaw === 'string' && personasRaw.trim()) {
      try {
        personas = JSON.parse(personasRaw) as Persona[]
      } catch {
        // Ignore — proceed without persona matching
      }
    }

    const personaContext =
      personas.length > 0
        ? `\n\nThe consultant has defined these candidate personas for this search. After extracting the CV, choose the single best matching persona id for \`suggestedPersonaId\` — or return an empty string if no persona is a reasonable fit.\n\n${personas
            .map(
              (p) =>
                `- id: "${p.id}" — ${p.title}\n  ${p.description.slice(0, 400)}`,
            )
            .join('\n\n')}`
        : ''

    const claude = getClaudeClient()
    const response = await claude.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT + personaContext,
      tools: [PARSE_CV_TOOL],
      tool_choice: { type: 'tool', name: 'parse_cv' },
      messages: [
        {
          role: 'user',
          content: `Extract the structured profile from this CV:\n\n${rawText.slice(0, 60_000)}`,
        },
      ],
    })

    const toolBlock = response.content.find(
      (b) => b.type === 'tool_use' && b.name === 'parse_cv',
    )
    if (!toolBlock || toolBlock.type !== 'tool_use') {
      return NextResponse.json(
        { error: 'Claude did not return a parsed CV' },
        { status: 500 },
      )
    }

    const parsed = toolBlock.input as ParsedCv

    const careerHistory: CareerEntry[] = (parsed.careerHistory ?? []).map(
      (c) => ({ id: uuid(), ...c }),
    )
    const education: EducationEntry[] = (parsed.education ?? []).map((e) => ({
      id: uuid(),
      ...e,
    }))

    const suggestedPersonaId =
      typeof parsed.suggestedPersonaId === 'string' &&
      parsed.suggestedPersonaId.trim() !== '' &&
      personas.some((p) => p.id === parsed.suggestedPersonaId)
        ? parsed.suggestedPersonaId
        : null

    const candidate: Candidate = {
      id: uuid(),
      name: parsed.name,
      photoUrl: '',
      currentCompany: parsed.currentCompany,
      currentRole: parsed.currentRole,
      age: typeof parsed.age === 'number' ? parsed.age : 0,
      summary: parsed.summary,
      archetypeTag: parsed.archetypeTag,
      personaId: suggestedPersonaId,
      scores: [],
      overallScore: 0,
      ranking: 0,
      status: 'parsed',
      cvFileName: file.name,
      rawCvText: rawText,
      careerHistory,
      education,
      languages: parsed.languages ?? [],
    }

    return NextResponse.json({ candidate })
  } catch (err) {
    console.error('[upload/candidate] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 },
    )
  }
}
