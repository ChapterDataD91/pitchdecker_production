// ---------------------------------------------------------------------------
// Three Candidate Personas: lead paragraph + .pr cards (one per archetype).
// Each card carries a pool-size badge (narrow/moderate/strong) coloured per
// the huisstijl.
// Reference: demo HTML L544-546.
// ---------------------------------------------------------------------------

import type { PersonasSection, Persona } from '@/lib/types'
import type { Brand } from '../brand'
import type { OutputStrings } from '../strings'
import { esc } from '../primitives/escape'

function poolLabel(poolSize: Persona['poolSize'], strings: OutputStrings): string {
  switch (poolSize) {
    case 'narrow':
      return strings.poolNarrow
    case 'moderate':
      return strings.poolModerate
    case 'strong':
      return strings.poolStrong
    default:
      return strings.poolFallback
  }
}

function renderPoolBadge(
  poolSize: Persona['poolSize'],
  strings: OutputStrings,
): string {
  const label = poolLabel(poolSize, strings)
  return `<span class="pool-badge pool-${esc(poolSize)}">${esc(label.toUpperCase())}</span>`
}

function renderPersona(persona: Persona, strings: OutputStrings): string {
  const title = persona.title.trim() || strings.personaUntitled
  const description = persona.description.trim()
  const rangeLabel = persona.poolRangeLabel.trim()
  const rationale = persona.poolRationale.trim()

  const descBlock = description ? `<p>${esc(description)}</p>` : ''

  const poolLine = rangeLabel || rationale
    ? `<p style="margin-top:12px;color:var(--txt3);font-size:14px">
  ${renderPoolBadge(persona.poolSize, strings)}
  ${rangeLabel ? `${esc(rangeLabel)}.` : ''}${rangeLabel && rationale ? ' ' : ''}${rationale ? esc(rationale) : ''}
</p>`
    : ''

  return `<div class="pr">
  <div class="ph"><div class="pn">${esc(title)}</div></div>
  ${descBlock}
  ${poolLine}
</div>`
}

export function renderPersonas(
  data: PersonasSection,
  _brand: Brand,
  strings: OutputStrings,
): string {
  if (data.archetypes.length === 0) {
    return `<div class="ot-empty">${esc(strings.personasEmpty)}</div>`
  }

  const sorted = [...data.archetypes].sort((a, b) => a.order - b.order)

  const lead = `<p>${esc(strings.personasLead)}</p>`
  const cards = sorted.map((p) => renderPersona(p, strings)).join('\n')

  return `${lead}${cards}`
}
