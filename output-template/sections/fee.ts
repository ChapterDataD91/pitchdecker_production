// ---------------------------------------------------------------------------
// Fee Proposal: a centered narrow .bx callout listing the search fee, the
// instalment schedule, the guarantee, and any optional add-ons.
// Reference: demo HTML L1330-1338.
//
// Renders inside a `.sb--centered` body modifier (set in layout.ts) so the
// callout is centered in the section, not left-padded like other sections.
// ---------------------------------------------------------------------------

import type { FeeSection, FeeAddon } from '@/lib/types'
import type { Brand } from '../brand'
import { esc } from '../primitives/escape'

const NBSP = '\u202F' // narrow no-break space — Top of Minds thousands separator

function formatMoney(amount: number, currency: string): string {
  const symbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'USD' ? '$' : `${currency} `
  return `${symbol}${amount.toLocaleString('en-GB').replace(/,/g, NBSP)}`
}

function joinSentence(items: string[]): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]!
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

function formatPercentage(value: number): string {
  // Strip trailing .0 so "30" stays "30%" and "12.5" stays "12.5%"
  const rounded = Math.round(value * 100) / 100
  return `${rounded}%`
}

function renderFeeLine(data: FeeSection): string {
  const vat = data.vatNote.trim() ? ` (${esc(data.vatNote)})` : ''
  const isPercentage = data.feeMode === 'percentage'
  const priceLabel = isPercentage
    ? (() => {
        const basis = data.percentageBasis?.trim() || 'first-year total compensation'
        return `${formatPercentage(data.percentage)} of ${basis}`
      })()
    : formatMoney(data.amount, data.currency)

  const anyAmounts = data.instalments.some((i) => i.amount > 0)
  const triggers = data.instalments.map((i) => i.trigger.trim()).filter(Boolean)

  // New style: per-instalment amounts are set → a single headline followed
  // by one line per instalment (rendered separately by renderInstalmentLines).
  if (anyAmounts) {
    return `<p><strong>Search fee:</strong> ${esc(priceLabel)}${vat}.</p>`
  }

  // Legacy: no per-instalment amounts — fall back to the original sentence.
  if (triggers.length === 0) {
    return `<p><strong>Search fee:</strong> The fee of ${esc(priceLabel)}${vat}.</p>`
  }
  const numWord =
    triggers.length === 2
      ? 'two'
      : triggers.length === 3
        ? 'three'
        : triggers.length === 4
          ? 'four'
          : `${triggers.length}`
  return `<p><strong>Search fee:</strong> The fee of ${esc(priceLabel)}${vat} is invoiced in ${esc(numWord)} equal instalments: ${esc(joinSentence(triggers))}.</p>`
}

function renderInstalmentLines(data: FeeSection): string {
  const lines: string[] = []
  for (const inst of data.instalments) {
    if (inst.amount <= 0) continue
    const label = inst.label.trim() || 'Instalment'
    const money = formatMoney(inst.amount, data.currency)
    const trigger = inst.trigger.trim()
    const tail = trigger ? ` — ${esc(trigger)}` : ''
    lines.push(`<p><strong>${esc(label)}:</strong> ${esc(money)}${tail}</p>`)
  }
  return lines.join('')
}

function renderSpecialTerms(data: FeeSection): string {
  const terms = data.specialTerms?.trim()
  if (!terms) return ''
  return `<p><strong>Special terms:</strong> ${esc(terms)}</p>`
}

function renderGuaranteeLine(data: FeeSection): string {
  if (data.guaranteeMonths <= 0 && !data.guaranteeNote.trim()) return ''
  const window =
    data.guaranteeMonths > 0
      ? `${data.guaranteeMonths} ${data.guaranteeMonths === 1 ? 'month' : 'months'}`
      : ''
  const note = data.guaranteeNote.trim()
  if (note && window) {
    // If the note already mentions a window, prefer the note verbatim.
    return `<p><strong>Guarantee:</strong> ${esc(note)}</p>`
  }
  if (note) return `<p><strong>Guarantee:</strong> ${esc(note)}</p>`
  return `<p><strong>Guarantee:</strong> Free replacement search if the appointed candidate leaves the position within ${esc(window)}.</p>`
}

function renderAddonLine(addon: FeeAddon, currency: string, vatNote: string): string {
  const money = formatMoney(addon.amount, currency)
  const vat = vatNote.trim() ? ` (${esc(vatNote)})` : ''
  const desc = addon.description.trim()
  const body = desc
    ? `${esc(desc)}: ${esc(money)}${vat}.`
    : `${esc(money)}${vat}.`
  const heading = addon.required
    ? `<strong>${esc(addon.label)}:</strong>`
    : `<strong>Optional — ${esc(addon.label)}:</strong>`
  return `<p>${heading} ${body}</p>`
}

export function renderFee(data: FeeSection, _brand: Brand): string {
  const hasFee =
    data.feeMode === 'percentage' ? data.percentage > 0 : data.amount > 0
  if (!hasFee) {
    return `<div class="ot-empty">No fee details captured yet.</div>`
  }

  const requiredAddons = data.addons.filter((a) => a.required)
  const optionalAddons = data.addons.filter((a) => !a.required)

  const lines = [
    renderFeeLine(data),
    renderInstalmentLines(data),
    ...requiredAddons.map((a) => renderAddonLine(a, data.currency, data.vatNote)),
    renderSpecialTerms(data),
    renderGuaranteeLine(data),
    ...optionalAddons.map((a) => renderAddonLine(a, data.currency, data.vatNote)),
  ]
    .filter(Boolean)
    .join('')

  return `<div class="bx" style="text-align:left;margin:20px auto;max-width:780px;width:100%">${lines}</div>`
}
