// ---------------------------------------------------------------------------
// Selection Scorecard: header sentence + .sc table with 4 category-header
// rows and weighted criteria.
// Reference: demo HTML L567-597.
// ---------------------------------------------------------------------------

import type {
  ScorecardSection,
  ScorecardCriterion,
  ScorecardCategoryKey,
} from '@/lib/types'
import type { Brand } from '../brand'
import type { OutputStrings } from '../strings'
import { esc } from '../primitives/escape'

interface CategoryDef {
  key: ScorecardCategoryKey
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

export function renderScorecard(
  data: ScorecardSection,
  _brand: Brand,
  strings: OutputStrings,
): string {
  const hidden = new Set(data.hiddenCategories ?? [])
  const allCategories: CategoryDef[] = [
    { key: 'mustHaves', label: strings.scMustHaves, criteria: data.mustHaves },
    { key: 'niceToHaves', label: strings.scNiceToHaves, criteria: data.niceToHaves },
    { key: 'leadership', label: strings.scLeadership, criteria: data.leadership },
    { key: 'successFactors', label: strings.scSuccessFactors, criteria: data.successFactors },
  ]
  const categories = allCategories.filter((c) => !hidden.has(c.key))

  const total = categories.reduce((n, c) => n + c.criteria.length, 0)
  if (total === 0) {
    return `<div class="ot-empty">${esc(strings.scEmpty)}</div>`
  }

  const populated = categories.filter((c) => c.criteria.length > 0)
  const dimensionsWord = strings.scDimensions(populated.length)

  const header = `<p>${strings.scHeader(total, esc(dimensionsWord))}</p>`

  const rows = categories.map(renderCategoryBlock).join('')

  const table = `<table class="sc">
  <thead><tr><th style="width:80%">${esc(strings.scColCriterion)}</th><th style="width:20%;text-align:center">${esc(strings.scColWeight)}</th></tr></thead>
  <tbody>${rows}</tbody>
</table>`

  return `${header}${table}`
}
