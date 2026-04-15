// ---------------------------------------------------------------------------
// POST /api/ai/candidate/score
// Grades a candidate's CV + summary against the deck's scorecard criteria,
// returning per-criterion 1–5 scores with rationales and an overall 0–100%.
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server'
import { getClaudeClient } from '@/lib/ai/claude-client'
import type {
  Candidate,
  CandidateScore,
  ScorecardSection,
  ScorecardCriterion,
} from '@/lib/types'

interface ScoreRequest {
  candidate: Pick<
    Candidate,
    | 'name'
    | 'summary'
    | 'currentRole'
    | 'currentCompany'
    | 'careerHistory'
    | 'education'
    | 'languages'
    | 'rawCvText'
  >
  scorecard: ScorecardSection
  deckContext: {
    clientName: string
    roleTitle: string
    coverIntro?: string
  }
}

interface DraftScore {
  criterionId: string
  score: number
  rationale: string
}

interface DraftResponse {
  scores: DraftScore[]
}

function flattenCriteria(scorecard: ScorecardSection): ScorecardCriterion[] {
  return [
    ...scorecard.mustHaves,
    ...scorecard.niceToHaves,
    ...scorecard.leadership,
    ...scorecard.successFactors,
  ]
}

function buildSystemPrompt(
  criteria: ScorecardCriterion[],
  ctx: ScoreRequest['deckContext'],
): string {
  const criteriaBlock = criteria
    .map((c) => `- id: "${c.id}" (weight ${c.weight}/5): ${c.text}`)
    .join('\n')

  return `You are an expert executive search consultant at Top of Minds evaluating a candidate against a structured scorecard.

## The role
- **Client**: ${ctx.clientName}
- **Role**: ${ctx.roleTitle}
${ctx.coverIntro ? `- **Context**: ${ctx.coverIntro}` : ''}

## Scorecard criteria
Each criterion has an id, a weight (1–5 relative importance), and a text. Score the candidate on a 1–5 scale for each criterion:
- 5 = exceptional / clear match, evidence in CV
- 4 = strong
- 3 = adequate / partial evidence
- 2 = weak
- 1 = poor fit / no evidence

${criteriaBlock}

## Guidance
- Base every score on concrete evidence from the CV (roles, responsibilities, sectors, years, achievements). Do not infer beyond what the text supports.
- For criteria where the CV is silent (e.g. personality traits without clear signal), score 3 and say "Not directly evidenced in CV — assume average pending interview."
- Rationale must be 1–2 sentences, specific, and reference CV evidence where possible.
- Return a score for every criterion id above — do not skip any.

Use the return_scores tool.`
}

const RETURN_SCORES_TOOL = {
  name: 'return_scores' as const,
  description: 'Return per-criterion scores for the candidate',
  input_schema: {
    type: 'object' as const,
    properties: {
      scores: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            criterionId: { type: 'string' as const },
            score: { type: 'number' as const, minimum: 1, maximum: 5 },
            rationale: { type: 'string' as const },
          },
          required: ['criterionId', 'score', 'rationale'],
        },
      },
    },
    required: ['scores'],
  },
}

function computeOverall(
  scores: CandidateScore[],
  criteria: ScorecardCriterion[],
): number {
  if (criteria.length === 0) return 0
  const byId = new Map(scores.map((s) => [s.criterionId, s.score]))
  let weightedSum = 0
  let weightTotal = 0
  for (const c of criteria) {
    const s = byId.get(c.id)
    if (typeof s !== 'number') continue
    weightedSum += s * c.weight
    weightTotal += 5 * c.weight // max possible score × weight
  }
  if (weightTotal === 0) return 0
  return Math.round((weightedSum / weightTotal) * 100)
}

function formatCandidateInput(body: ScoreRequest): string {
  const { candidate } = body
  const parts: string[] = []
  parts.push(`Name: ${candidate.name}`)
  parts.push(
    `Current role: ${candidate.currentRole}${candidate.currentCompany ? ` at ${candidate.currentCompany}` : ''}`,
  )
  if (candidate.summary) parts.push(`Summary: ${candidate.summary}`)
  if (candidate.careerHistory?.length) {
    parts.push('\nCareer history:')
    for (const c of candidate.careerHistory) {
      parts.push(
        `- ${c.period} — ${c.role} at ${c.company}${c.highlights?.length ? `\n  • ${c.highlights.join('\n  • ')}` : ''}`,
      )
    }
  }
  if (candidate.education?.length) {
    parts.push('\nEducation:')
    for (const e of candidate.education) {
      parts.push(`- ${e.period} — ${e.degree}, ${e.institution}`)
    }
  }
  if (candidate.languages?.length) {
    parts.push(`\nLanguages: ${candidate.languages.join(', ')}`)
  }
  if (candidate.rawCvText) {
    parts.push(`\nRaw CV:\n${candidate.rawCvText.slice(0, 30_000)}`)
  }
  return parts.join('\n')
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ScoreRequest

    if (!body.candidate || !body.scorecard || !body.deckContext) {
      return NextResponse.json(
        { error: 'Missing candidate, scorecard, or deckContext' },
        { status: 400 },
      )
    }

    const criteria = flattenCriteria(body.scorecard)
    if (criteria.length === 0) {
      return NextResponse.json(
        {
          error:
            'Scorecard is empty. Define criteria in the Scorecard section before scoring.',
        },
        { status: 400 },
      )
    }

    const claude = getClaudeClient()
    const systemPrompt = buildSystemPrompt(criteria, body.deckContext)

    const response = await claude.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      tools: [RETURN_SCORES_TOOL],
      tool_choice: { type: 'tool', name: 'return_scores' },
      messages: [
        {
          role: 'user',
          content: `Score this candidate against the scorecard:\n\n${formatCandidateInput(body)}`,
        },
      ],
    })

    const toolBlock = response.content.find(
      (b) => b.type === 'tool_use' && b.name === 'return_scores',
    )

    if (!toolBlock || toolBlock.type !== 'tool_use') {
      return NextResponse.json(
        { error: 'Claude did not return scores' },
        { status: 500 },
      )
    }

    const draft = toolBlock.input as DraftResponse

    // Keep only scores that reference valid criterion ids
    const validIds = new Set(criteria.map((c) => c.id))
    const scores: CandidateScore[] = draft.scores
      .filter((s) => validIds.has(s.criterionId))
      .map((s) => ({
        criterionId: s.criterionId,
        score: Math.min(5, Math.max(1, Math.round(s.score))),
        rationale: s.rationale,
      }))

    const overallScore = computeOverall(scores, criteria)

    return NextResponse.json({ scores, overallScore })
  } catch (err) {
    console.error('Candidate scoring failed:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Scoring failed' },
      { status: 500 },
    )
  }
}
