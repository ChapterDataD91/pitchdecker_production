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
import type { OutputStrings } from '../strings'
import { esc } from '../primitives/escape'

const NBSP = '\u202F' // narrow no-break space — Top of Minds thousands separator

function formatMoney(amount: number, currency: string): string {
  const symbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'USD' ? '$' : `${currency} `
  return `${symbol}${amount.toLocaleString('en-GB').replace(/,/g, NBSP)}`
}

function joinSentence(items: string[], conjunction: string): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]!
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, ${conjunction} ${items[items.length - 1]}`
}

function formatPercentage(value: number): string {
  // Strip trailing .0 so "30" stays "30%" and "12.5" stays "12.5%"
  const rounded = Math.round(value * 100) / 100
  return `${rounded}%`
}

function renderFeeLine(data: FeeSection, strings: OutputStrings): string {
  const vat = data.vatNote.trim() ? ` (${esc(data.vatNote)})` : ''
  const isPercentage = data.feeMode === 'percentage'
  const priceLabel = isPercentage
    ? (() => {
        const basis = data.percentageBasis?.trim() || strings.feePctBasisFallback
        return `${formatPercentage(data.percentage)} ${strings.feePctOf} ${basis}`
      })()
    : formatMoney(data.amount, data.currency)

  const anyAmounts = data.instalments.some((i) => i.amount > 0)
  const triggers = data.instalments.map((i) => i.trigger.trim()).filter(Boolean)

  // New style: per-instalment amounts are set → a single headline followed
  // by one line per instalment (rendered separately by renderInstalmentLines).
  if (anyAmounts) {
    return `<p><strong>${esc(strings.feeSearchFee)}:</strong> ${esc(priceLabel)}${vat}.</p>`
  }

  // Legacy: no per-instalment amounts — fall back to the original sentence.
  if (triggers.length === 0) {
    return strings.feeHeadlineSingle(esc(priceLabel), vat)
  }
  const numWord = strings.feeNumWord(triggers.length)
  return strings.feeHeadlineEqualInstalments(
    esc(priceLabel),
    vat,
    esc(numWord),
    esc(joinSentence(triggers, strings.feeConjunction)),
  )
}

function renderInstalmentLines(data: FeeSection, strings: OutputStrings): string {
  const lines: string[] = []
  for (const inst of data.instalments) {
    if (inst.amount <= 0) continue
    const label = inst.label.trim() || strings.feeInstalmentFallback
    const money = formatMoney(inst.amount, data.currency)
    const trigger = inst.trigger.trim()
    const tail = trigger ? ` — ${esc(trigger)}` : ''
    lines.push(`<p><strong>${esc(label)}:</strong> ${esc(money)}${tail}</p>`)
  }
  return lines.join('')
}

function renderSpecialTerms(data: FeeSection, strings: OutputStrings): string {
  const terms = data.specialTerms?.trim()
  if (!terms) return ''
  return `<p><strong>${esc(strings.feeSpecialTerms)}:</strong> ${esc(terms)}</p>`
}

function renderGuaranteeLine(data: FeeSection, strings: OutputStrings): string {
  if (data.guaranteeMonths <= 0 && !data.guaranteeNote.trim()) return ''
  const window =
    data.guaranteeMonths > 0
      ? `${data.guaranteeMonths} ${data.guaranteeMonths === 1 ? strings.feeMonth : strings.feeMonths}`
      : ''
  const note = data.guaranteeNote.trim()
  if (note) {
    // Prefer a consultant-written note verbatim whether or not a window is set.
    return `<p><strong>${esc(strings.feeGuarantee)}:</strong> ${esc(note)}</p>`
  }
  return `<p><strong>${esc(strings.feeGuarantee)}:</strong> ${esc(strings.feeGuaranteeDefault(window))}</p>`
}

function renderAddonLine(
  addon: FeeAddon,
  currency: string,
  vatNote: string,
  strings: OutputStrings,
): string {
  const money = formatMoney(addon.amount, currency)
  const vat = vatNote.trim() ? ` (${esc(vatNote)})` : ''
  const desc = addon.description.trim()
  const body = desc
    ? `${esc(desc)}: ${esc(money)}${vat}.`
    : `${esc(money)}${vat}.`
  const heading = addon.required
    ? `<strong>${esc(addon.label)}:</strong>`
    : `<strong>${esc(strings.feeOptionalPrefix)}${esc(addon.label)}:</strong>`
  return `<p>${heading} ${body}</p>`
}

export function renderFee(
  data: FeeSection,
  _brand: Brand,
  strings: OutputStrings,
): string {
  const hasFee =
    data.feeMode === 'percentage' ? data.percentage > 0 : data.amount > 0
  if (!hasFee) {
    return `<div class="ot-empty">${esc(strings.feeEmpty)}</div>`
  }

  const requiredAddons = data.addons.filter((a) => a.required)
  const optionalAddons = data.addons.filter((a) => !a.required)

  const lines = [
    renderFeeLine(data, strings),
    renderInstalmentLines(data, strings),
    ...requiredAddons.map((a) =>
      renderAddonLine(a, data.currency, data.vatNote, strings),
    ),
    renderSpecialTerms(data, strings),
    renderGuaranteeLine(data, strings),
    ...optionalAddons.map((a) =>
      renderAddonLine(a, data.currency, data.vatNote, strings),
    ),
  ]
    .filter(Boolean)
    .join('')

  return `<div class="bx" style="text-align:left;margin:20px auto;max-width:780px;width:100%">${lines}</div>`
}
