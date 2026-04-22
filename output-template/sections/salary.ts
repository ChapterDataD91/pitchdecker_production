// ---------------------------------------------------------------------------
// Salary section: a single .bx callout listing base, bonus, LTI, benefits.
// Reference: demo HTML L418-426.
// ---------------------------------------------------------------------------

import type { SalarySection } from '@/lib/types'
import type { Brand } from '../brand'
import type { OutputStrings } from '../strings'
import { esc } from '../primitives/escape'

function formatEur(amount: number): string {
  // Top of Minds convention: thousands grouped with thin space, no decimals.
  return `€${amount.toLocaleString('en-GB').replace(/,/g, '\u202F')}`
}

function renderBase(
  low: number,
  high: number,
  isIndicative: boolean,
  strings: OutputStrings,
): string | null {
  if (low <= 0 && high <= 0) return null
  const suffix = isIndicative ? strings.salaryIndicativeSuffix : ''
  if (low > 0 && high > 0 && high !== low) {
    return `${formatEur(low)} – ${formatEur(high)} ${strings.salaryGrossPerYear}${suffix}`
  }
  return `${formatEur(low > 0 ? low : high)} ${strings.salaryGrossPerYear}${suffix}`
}

export function renderSalary(
  data: SalarySection,
  _brand: Brand,
  strings: OutputStrings,
): string {
  const lines: string[] = []

  const base = renderBase(
    data.baseLow,
    data.baseHigh,
    data.isIndicative ?? false,
    strings,
  )
  if (base) {
    lines.push(`<p><strong>${esc(strings.salaryBase)}:</strong> ${esc(base)}</p>`)
  }
  if (data.bonus.trim()) {
    lines.push(
      `<p><strong>${esc(strings.salaryBonus)}:</strong> ${esc(data.bonus)}</p>`,
    )
  }
  if (data.ltip.trim()) {
    lines.push(
      `<p><strong>${esc(strings.salaryLti)}:</strong> ${esc(data.ltip)}</p>`,
    )
  }
  if (data.benefits.trim()) {
    lines.push(
      `<p><strong>${esc(strings.salaryBenefits)}:</strong> ${esc(data.benefits)}</p>`,
    )
  }
  if (data.other.trim()) {
    lines.push(
      `<p><strong>${esc(strings.salaryOther)}:</strong> ${esc(data.other)}</p>`,
    )
  }

  if (lines.length === 0) {
    return `<div class="ot-empty">${esc(strings.salaryEmpty)}</div>`
  }

  return `<div class="bx">${lines.join('')}</div>`
}
