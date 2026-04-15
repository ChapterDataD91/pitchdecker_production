// ---------------------------------------------------------------------------
// Three Candidate Personas: lead paragraph + .pr cards (one per archetype).
// Each card carries a pool-size badge (narrow/moderate/strong) coloured per
// the huisstijl.
// Reference: demo HTML L544-546.
// ---------------------------------------------------------------------------

import type { PersonasSection, Persona } from '@/lib/types'
import type { Brand } from '../brand'
import { esc } from '../primitives/escape'

const POOL_LABEL: Record<Persona['poolSize'], string> = {
  narrow: 'Narrow Pool',
  moderate: 'Moderate Pool',
  strong: 'Strong Pool',
}

function renderPoolBadge(poolSize: Persona['poolSize']): string {
  const label = POOL_LABEL[poolSize] ?? 'Pool'
  return `<span class="pool-badge pool-${esc(poolSize)}">${esc(label.toUpperCase())}</span>`
}

function renderPersona(persona: Persona): string {
  const title = persona.title.trim() || 'Untitled persona'
  const description = persona.description.trim()
  const rangeLabel = persona.poolRangeLabel.trim()
  const rationale = persona.poolRationale.trim()

  const descBlock = description ? `<p>${esc(description)}</p>` : ''

  const poolLine = rangeLabel || rationale
    ? `<p style="margin-top:12px;color:var(--txt3);font-size:14px">
  ${renderPoolBadge(persona.poolSize)}
  ${rangeLabel ? `${esc(rangeLabel)}.` : ''}${rangeLabel && rationale ? ' ' : ''}${rationale ? esc(rationale) : ''}
</p>`
    : ''

  return `<div class="pr">
  <div class="ph"><div class="pn">${esc(title)}</div></div>
  ${descBlock}
  ${poolLine}
</div>`
}

export function renderPersonas(data: PersonasSection, _brand: Brand): string {
  if (data.archetypes.length === 0) {
    return `<div class="ot-empty">No persona archetypes added yet.</div>`
  }

  const sorted = [...data.archetypes].sort((a, b) => a.order - b.order)

  const lead = `<p>Anonymised candidate personas illustrating the type of leader we expect to identify for this role.</p>`
  const cards = sorted.map(renderPersona).join('\n')

  return `${lead}${cards}`
}
