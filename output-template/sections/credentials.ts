// ---------------------------------------------------------------------------
// Credentials section: per-axis label + intro paragraph + placements table.
// Reference: demo HTML L437-468.
//
// Each axis has its own contextLabel (e.g. "Industry" or "Investor") that
// becomes the third column header of its table. Companies are linked via
// Placement.companyUrl when present.
// ---------------------------------------------------------------------------

import type { CredentialsSection, CredentialAxis, Placement } from '@/lib/types'
import type { Brand } from '../brand'
import type { OutputStrings } from '../strings'
import { esc, escAttr } from '../primitives/escape'

function renderCompanyCell(p: Placement): string {
  const name = esc(p.company || '—')
  if (!p.companyUrl?.trim()) return name
  return `<a href="${escAttr(p.companyUrl)}" target="_blank" rel="noopener noreferrer">${name}</a>`
}

function renderContextCell(p: Placement): string {
  // Prefer explicit `context`; fall back to `industry` if context is empty
  // (older shape sometimes omitted context). Always escapes.
  const value = p.context.trim() || p.industry?.trim() || ''
  return value ? esc(value) : '<span style="opacity:.5">—</span>'
}

function renderAxisTable(axis: CredentialAxis, strings: OutputStrings): string {
  if (axis.placements.length === 0) {
    return `<p style="opacity:.6;font-style:normal">${esc(strings.credAxisPlacementsEmpty)}</p>`
  }

  const rows = axis.placements
    .map(
      (p) => `<tr>
  <td class="tr">${esc(p.role)}</td>
  <td class="tco">${renderCompanyCell(p)}</td>
  <td style="color:var(--txt3)">${renderContextCell(p)}</td>
</tr>`,
    )
    .join('')

  return `<table class="tb">
  <thead><tr>
    <th style="width:30%">${esc(strings.credRole)}</th>
    <th style="width:35%">${esc(strings.credCompany)}</th>
    <th style="width:35%">${esc(axis.contextLabel || strings.credContextFallback)}</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>`
}

function renderAxis(
  axis: CredentialAxis,
  index: number,
  strings: OutputStrings,
): string {
  const label = axis.name.trim() || strings.credAxisFallback(index + 1)
  const intro = axis.intro.trim() ? `<p>${esc(axis.intro)}</p>` : ''
  return `<div class="lb">${esc(label)}</div>
${intro}
${renderAxisTable(axis, strings)}`
}

export function renderCredentials(
  data: CredentialsSection,
  _brand: Brand,
  strings: OutputStrings,
): string {
  if (data.axes.length === 0) {
    return `<div class="ot-empty">${esc(strings.credEmpty)}</div>`
  }

  return data.axes.map((axis, i) => renderAxis(axis, i, strings)).join('\n')
}
