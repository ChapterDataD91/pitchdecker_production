// ---------------------------------------------------------------------------
// Shared helper: format uploaded context documents for embedding in a
// system prompt. Used by every "suggest" route so the user's uploaded
// briefing materials flow into generation the same way they flow into
// the chat overlay.
// ---------------------------------------------------------------------------

export interface ReferenceDoc {
  fileName: string
  extractedText: string
}

// Keep the total payload bounded so we don't blow past Claude's context
// when the consultant has dumped a dozen dense briefs. Sized for the 200k
// context model (claude-opus-4-6): 400k chars ≈ 100k tokens, leaving ~100k
// tokens headroom for the rest of the prompt + completion.
const MAX_CHARS_PER_DOC = 150_000
const MAX_TOTAL_CHARS = 400_000

export function formatReferenceDocs(docs: ReferenceDoc[] | undefined): string {
  if (!docs || docs.length === 0) return ''

  let used = 0
  const blocks: string[] = []

  for (const doc of docs) {
    if (used >= MAX_TOTAL_CHARS) break
    const remaining = MAX_TOTAL_CHARS - used
    const slice = doc.extractedText.slice(
      0,
      Math.min(MAX_CHARS_PER_DOC, remaining),
    )
    blocks.push(`### ${doc.fileName}\n\`\`\`\n${slice}\n\`\`\``)
    used += slice.length
  }

  return `\n\n## Reference documents\nThe consultant uploaded these briefing documents as context for this search. Draw from them whenever they sharpen your output — but do not invent facts that aren't supported by them or the structured deck inputs above.\n\n${blocks.join('\n\n')}`
}
