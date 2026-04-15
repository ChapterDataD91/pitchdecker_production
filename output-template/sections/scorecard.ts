// ---------------------------------------------------------------------------
// Selection Scorecard: header sentence + .sc table with 4 category-header
// rows and weighted criteria.
// Reference: demo HTML L567-597.
// ---------------------------------------------------------------------------

import type { ScorecardSection, ScorecardCriterion } from '@/lib/types'
import type { Brand } from '../brand'
import { esc } from '../primitives/escape'

interface CategoryDef {
  label: string
  criteria: readonly ScorecardCriterion[]
}

function renderCriterionRow(c: ScorecardCriterion): string {
  return `<tr><td>${esc(c.text)}</td><td class="wt">${esc(c.weight)}</td></tr>`
}

function renderCategoryBlock(cat: CategoryDef): string {
  if (cat.criteria.length === 0) return ''
  const header = `<tr><td colspan="2" class="cat">${esc(cat.label.toUpperCase())}</td></tr>`
  const rows = cat.criteria.map(renderCriterionRow).join('')
  return `${header}${rows}`
}

export function renderScorecard(data: ScorecardSection, _brand: Brand): string {
  const categories: CategoryDef[] = [
    { label: 'Must-Haves', criteria: data.mustHaves },
    { label: 'Nice-to-Haves', criteria: data.niceToHaves },
    { label: 'Leadership & Personality', criteria: data.leadership },
    { label: 'First-Year Success Factors', criteria: data.successFactors },
  ]

  const total = categories.reduce((n, c) => n + c.criteria.length, 0)
  if (total === 0) {
    return `<div class="ot-empty">No scorecard criteria added yet.</div>`
  }

  const populated = categories.filter((c) => c.criteria.length > 0)
  const dimensionsWord =
    populated.length === 1
      ? 'one dimension'
      : populated.length === 2
        ? 'two dimensions'
        : populated.length === 3
          ? 'three dimensions'
          : `${populated.length} dimensions`

  const header = `<p>We evaluate candidates on <strong>${esc(total)} weighted criteria</strong> across ${esc(dimensionsWord)}, scored 1–5. Weight reflects relative importance.</p>`

  const rows = categories.map(renderCategoryBlock).join('')

  const table = `<table class="sc">
  <thead><tr><th style="width:80%">Criterion</th><th style="width:20%;text-align:center">Weight</th></tr></thead>
  <tbody>${rows}</tbody>
</table>`

  return `${header}${table}`
}
