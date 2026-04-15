// ---------------------------------------------------------------------------
// Salary section: a single .bx callout listing base, bonus, LTI, benefits.
// Reference: demo HTML L418-426.
// ---------------------------------------------------------------------------

import type { SalarySection } from '@/lib/types'
import type { Brand } from '../brand'
import { esc } from '../primitives/escape'

function formatEur(amount: number): string {
  // Top of Minds convention: thousands grouped with thin space, no decimals.
  return `€${amount.toLocaleString('en-GB').replace(/,/g, '\u202F')}`
}

function renderBase(low: number, high: number): string | null {
  if (low <= 0 && high <= 0) return null
  if (low > 0 && high > 0 && high !== low) {
    return `${formatEur(low)} – ${formatEur(high)} gross per year`
  }
  return `${formatEur(low > 0 ? low : high)} gross per year (indicative)`
}

export function renderSalary(data: SalarySection, _brand: Brand): string {
  const lines: string[] = []

  const base = renderBase(data.baseLow, data.baseHigh)
  if (base) {
    lines.push(`<p><strong>Base salary:</strong> ${esc(base)}</p>`)
  }
  if (data.bonus.trim()) {
    lines.push(`<p><strong>Annual bonus:</strong> ${esc(data.bonus)}</p>`)
  }
  if (data.ltip.trim()) {
    lines.push(`<p><strong>Long-Term Incentive (LTI):</strong> ${esc(data.ltip)}</p>`)
  }
  if (data.benefits.trim()) {
    lines.push(`<p><strong>Benefits:</strong> ${esc(data.benefits)}</p>`)
  }
  if (data.other.trim()) {
    lines.push(`<p><strong>Other:</strong> ${esc(data.other)}</p>`)
  }

  if (lines.length === 0) {
    return `<div class="ot-empty">No salary details captured yet.</div>`
  }

  return `<div class="bx">${lines.join('')}</div>`
}
