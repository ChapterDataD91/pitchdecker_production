'use client'

// ---------------------------------------------------------------------------
// Fee editor — form wiring for flat or percentage fee.
//
// Fields: feeMode, amount | (percentage + percentageBasis), currency, vatNote,
// instalments[{label, trigger}], guaranteeMonths, guaranteeNote,
// addons[{label, amount, description}].
//
// Each field pushes the updated section through `onChange` on blur / change;
// the parent section-level auto-save debouncer handles persistence.
// ---------------------------------------------------------------------------

import { useState } from 'react'
import type { FeeSection, FeeInstalment, FeeAddon, FeeMode } from '@/lib/types'

interface FeeEditorProps {
  data: FeeSection
  onChange: (data: FeeSection) => void
}

function newInstalment(): FeeInstalment {
  return { id: crypto.randomUUID(), label: '', amount: 0, trigger: '' }
}

function newAddon(): FeeAddon {
  return { id: crypto.randomUUID(), label: '', amount: 0, description: '', required: false }
}

const TRIGGER_PRESETS = [
  'Start of the assignment',
  'At shortlist',
  'At offer accepted',
  '30 days after start',
  'Upon completion',
  'If cancelled',
] as const

// Parse a currency-style numeric input ("100,000" or "100.000" → 100000)
function parseAmount(input: string): number {
  const digits = input.replace(/[^\d]/g, '')
  if (!digits) return 0
  const n = parseInt(digits, 10)
  return Number.isFinite(n) ? n : 0
}

function formatAmount(n: number): string {
  return n > 0 ? n.toLocaleString('en-GB') : ''
}

export default function FeeEditor({ data, onChange }: FeeEditorProps) {
  // Back-compat: old decks may not have feeMode set.
  const feeMode: FeeMode = data.feeMode ?? 'flat'

  // Local amount text lets the user type commas / spaces without fighting
  // the formatter on every keystroke. We commit the parsed number on blur.
  const [amountText, setAmountText] = useState<string>(formatAmount(data.amount))
  const [percentageText, setPercentageText] = useState<string>(
    data.percentage > 0 ? String(data.percentage) : '',
  )

  function update<K extends keyof FeeSection>(key: K, value: FeeSection[K]) {
    onChange({ ...data, [key]: value })
  }

  function setFeeMode(mode: FeeMode) {
    if (mode === feeMode) return
    onChange({ ...data, feeMode: mode })
  }

  function addInstalment() {
    update('instalments', [...data.instalments, newInstalment()])
  }
  function removeInstalment(id: string) {
    update(
      'instalments',
      data.instalments.filter((i) => i.id !== id),
    )
  }
  function updateInstalment(id: string, patch: Partial<FeeInstalment>) {
    update(
      'instalments',
      data.instalments.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    )
  }

  function addAddon() {
    update('addons', [...data.addons, newAddon()])
  }
  function removeAddon(id: string) {
    update(
      'addons',
      data.addons.filter((a) => a.id !== id),
    )
  }
  function updateAddon(id: string, patch: Partial<FeeAddon>) {
    update(
      'addons',
      data.addons.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    )
  }

  const currencySymbol =
    data.currency === 'EUR' ? '€' : data.currency === 'GBP' ? '£' : data.currency === 'USD' ? '$' : ''

  return (
    <div className="space-y-5">
      {/* Fee mode toggle */}
      <div>
        <label className="block text-sm font-medium text-text mb-1.5">
          Fee Type
        </label>
        <div
          role="tablist"
          aria-label="Fee type"
          className="inline-flex rounded-md border border-border bg-bg p-0.5"
        >
          <button
            type="button"
            role="tab"
            aria-selected={feeMode === 'flat'}
            onClick={() => setFeeMode('flat')}
            className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
              feeMode === 'flat'
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:text-text'
            }`}
          >
            Flat fee
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={feeMode === 'percentage'}
            onClick={() => setFeeMode('percentage')}
            className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
              feeMode === 'percentage'
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:text-text'
            }`}
          >
            Percentage
          </button>
        </div>
      </div>

      {/* Fee amount / percentage + currency + VAT note */}
      {feeMode === 'flat' ? (
        <div className="grid grid-cols-[1fr_auto_1fr] gap-3">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              Fee Amount
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                placeholder="100,000"
                value={amountText}
                onChange={(e) => setAmountText(e.target.value)}
                onBlur={() => {
                  const parsed = parseAmount(amountText)
                  setAmountText(formatAmount(parsed))
                  if (parsed !== data.amount) update('amount', parsed)
                }}
                className="w-full rounded-md border border-border bg-bg px-3 py-2.5 pl-8 text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-tertiary">
                {currencySymbol || '€'}
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              Currency
            </label>
            <input
              type="text"
              placeholder="EUR"
              value={data.currency}
              onChange={(e) => update('currency', e.target.value.toUpperCase())}
              maxLength={3}
              className="w-20 rounded-md border border-border bg-bg px-3 py-2.5 text-sm text-text uppercase placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              VAT Note
            </label>
            <input
              type="text"
              placeholder="excl. VAT"
              value={data.vatNote}
              onChange={(e) => update('vatNote', e.target.value)}
              className="w-full rounded-md border border-border bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-[auto_1fr_1fr] gap-3">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              Percentage
            </label>
            <div className="relative w-32">
              <input
                type="text"
                inputMode="decimal"
                placeholder="30"
                value={percentageText}
                onChange={(e) => setPercentageText(e.target.value)}
                onBlur={() => {
                  const raw = percentageText.replace(',', '.').replace(/[^\d.]/g, '')
                  const n = raw === '' ? 0 : parseFloat(raw)
                  const clamped = Number.isFinite(n) && n >= 0 ? Math.min(n, 100) : 0
                  setPercentageText(clamped > 0 ? String(clamped) : '')
                  if (clamped !== data.percentage) update('percentage', clamped)
                }}
                className="w-full rounded-md border border-border bg-bg px-3 py-2.5 pr-9 text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-tertiary">
                %
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              Of
            </label>
            <input
              type="text"
              placeholder="first-year total compensation"
              value={data.percentageBasis ?? ''}
              onChange={(e) => update('percentageBasis', e.target.value)}
              className="w-full rounded-md border border-border bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              VAT Note
            </label>
            <input
              type="text"
              placeholder="excl. VAT"
              value={data.vatNote}
              onChange={(e) => update('vatNote', e.target.value)}
              className="w-full rounded-md border border-border bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Instalments */}
      <div>
        <datalist id="fee-trigger-presets">
          {TRIGGER_PRESETS.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-text">
            Instalments
            <span className="ml-2 text-xs text-text-tertiary font-normal">
              ({data.instalments.length}{' '}
              {data.instalments.length === 1 ? 'instalment' : 'instalments'})
            </span>
          </label>
          <button
            type="button"
            onClick={addInstalment}
            className="text-sm font-medium text-accent hover:text-accent-hover transition-colors"
          >
            + Add instalment
          </button>
        </div>
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 bg-bg-subtle border-b border-border grid grid-cols-[1.25fr_auto_2fr_auto] gap-4">
            <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
              Label
            </span>
            <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
              Amount
            </span>
            <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
              Trigger
            </span>
            <span className="w-7" aria-hidden />
          </div>
          {data.instalments.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-text-secondary">
                No instalments — fee paid in a single sum
              </p>
              <p className="text-xs text-text-tertiary mt-1">
                Add instalments to spread the fee across milestones
              </p>
            </div>
          ) : (
            data.instalments.map((inst) => (
              <InstalmentRow
                key={inst.id}
                inst={inst}
                currencySymbol={currencySymbol}
                onChange={(patch) => updateInstalment(inst.id, patch)}
                onRemove={() => removeInstalment(inst.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Guarantee */}
      <div className="grid grid-cols-[auto_1fr] gap-4">
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            Guarantee
          </label>
          <div className="relative w-32">
            <input
              type="number"
              min={0}
              placeholder="12"
              value={data.guaranteeMonths || ''}
              onChange={(e) => {
                const n = e.target.value === '' ? 0 : parseInt(e.target.value, 10)
                update('guaranteeMonths', Number.isFinite(n) && n >= 0 ? n : 0)
              }}
              className="w-full rounded-md border border-border bg-bg px-3 py-2.5 pr-16 text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-tertiary">
              months
            </span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            Guarantee description
          </label>
          <textarea
            placeholder="e.g. Free replacement search if the appointed candidate leaves within the guarantee window."
            value={data.guaranteeNote}
            onChange={(e) => update('guaranteeNote', e.target.value)}
            rows={2}
            className="w-full rounded-md border border-border bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
          />
        </div>
      </div>

      {/* Special terms */}
      <div>
        <label className="block text-sm font-medium text-text mb-1.5">
          Special terms
          <span className="ml-2 text-xs text-text-tertiary font-normal">
            (optional)
          </span>
        </label>
        <textarea
          placeholder="e.g. 25–50% discount on internally sourced candidates."
          value={data.specialTerms ?? ''}
          onChange={(e) => update('specialTerms', e.target.value)}
          rows={2}
          className="w-full rounded-md border border-border bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
        />
      </div>

      {/* Add-ons */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-text">
            Add-ons
            <span className="ml-2 text-xs text-text-tertiary font-normal">
              ({data.addons.length}{' '}
              {data.addons.length === 1 ? 'add-on' : 'add-ons'})
            </span>
          </label>
          <button
            type="button"
            onClick={addAddon}
            className="text-sm font-medium text-accent hover:text-accent-hover transition-colors"
          >
            + Add add-on
          </button>
        </div>
        {data.addons.length === 0 ? (
          <div className="border border-border rounded-lg p-6 text-center">
            <p className="text-sm text-text-secondary">No add-ons</p>
            <p className="text-xs text-text-tertiary mt-1">
              E.g. Hogan management-team assessment, references package
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.addons.map((a) => (
              <AddonRow
                key={a.id}
                addon={a}
                currency={data.currency}
                onChange={(patch) => updateAddon(a.id, patch)}
                onRemove={() => removeAddon(a.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Instalment row — 3-column editor (Label · Amount · Trigger). Local amount
// state avoids fighting the formatter on every keystroke; commits on blur.
// ---------------------------------------------------------------------------

function InstalmentRow({
  inst,
  currencySymbol,
  onChange,
  onRemove,
}: {
  inst: FeeInstalment
  currencySymbol: string
  onChange: (patch: Partial<FeeInstalment>) => void
  onRemove: () => void
}) {
  const [amountText, setAmountText] = useState<string>(formatAmount(inst.amount))
  return (
    <div className="px-4 py-2.5 border-b border-border last:border-b-0 grid grid-cols-[1.25fr_auto_2fr_auto] gap-4 items-center">
      <input
        type="text"
        placeholder="Retainer"
        value={inst.label}
        onChange={(e) => onChange({ label: e.target.value })}
        className="rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm text-text font-medium placeholder:text-text-placeholder focus:outline-none focus:border-border focus:bg-white"
      />
      <div className="relative w-32">
        <input
          type="text"
          inputMode="numeric"
          placeholder="10,000"
          value={amountText}
          onChange={(e) => setAmountText(e.target.value)}
          onBlur={() => {
            const parsed = parseAmount(amountText)
            setAmountText(formatAmount(parsed))
            if (parsed !== inst.amount) onChange({ amount: parsed })
          }}
          className="w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 pl-6 text-sm text-text font-mono placeholder:text-text-placeholder focus:outline-none focus:border-border focus:bg-white"
        />
        {currencySymbol && (
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-text-tertiary pointer-events-none">
            {currencySymbol}
          </span>
        )}
      </div>
      <input
        type="text"
        list="fee-trigger-presets"
        placeholder="Start of the assignment"
        value={inst.trigger}
        onChange={(e) => onChange({ trigger: e.target.value })}
        className="rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm text-text-secondary placeholder:text-text-placeholder focus:outline-none focus:border-border focus:bg-white"
      />
      <button
        type="button"
        onClick={onRemove}
        className="flex h-7 w-7 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-error-light hover:text-error"
        aria-label={`Remove instalment ${inst.label || 'row'}`}
        title="Remove"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2.5 4h11M6 4V2.5a1 1 0 011-1h2a1 1 0 011 1V4M4.5 4l.5 9.5a1 1 0 001 1h4a1 1 0 001-1L12 4" />
        </svg>
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Add-on row — its own component so the local amount-text state doesn't
// collide with sibling rows' state (React's reconciliation by key).
// ---------------------------------------------------------------------------

function AddonRow({
  addon,
  currency,
  onChange,
  onRemove,
}: {
  addon: FeeAddon
  currency: string
  onChange: (patch: Partial<FeeAddon>) => void
  onRemove: () => void
}) {
  const [amountText, setAmountText] = useState<string>(formatAmount(addon.amount))
  const symbol =
    currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'USD' ? '$' : ''
  const isRequired = addon.required === true

  return (
    <div className="border border-border rounded-lg p-3">
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 mb-2 items-end">
        <div>
          <label className="block text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">
            Label
          </label>
          <input
            type="text"
            placeholder="Management Team Assessment"
            value={addon.label}
            onChange={(e) => onChange({ label: e.target.value })}
            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text font-medium placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">
            Amount
          </label>
          <div className="relative w-40">
            <input
              type="text"
              inputMode="numeric"
              placeholder="20,000"
              value={amountText}
              onChange={(e) => setAmountText(e.target.value)}
              onBlur={() => {
                const parsed = parseAmount(amountText)
                setAmountText(formatAmount(parsed))
                if (parsed !== addon.amount) onChange({ amount: parsed })
              }}
              className="w-full rounded-md border border-border bg-bg px-3 py-2 pl-7 text-sm text-text font-mono placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
            {symbol && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-tertiary">
                {symbol}
              </span>
            )}
          </div>
        </div>
        <label className="flex h-[38px] items-center gap-2 cursor-pointer select-none rounded-md border border-border bg-bg px-3 text-xs font-medium text-text-secondary">
          <input
            type="checkbox"
            checked={isRequired}
            onChange={(e) => onChange({ required: e.target.checked })}
            className="h-3.5 w-3.5 rounded border-border text-accent focus:ring-accent focus:ring-2 focus:ring-offset-0"
          />
          Required
        </label>
        <button
          type="button"
          onClick={onRemove}
          className="mb-0.5 flex h-8 w-8 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-error-light hover:text-error"
          aria-label={`Remove add-on ${addon.label || 'row'}`}
          title="Remove"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2.5 4h11M6 4V2.5a1 1 0 011-1h2a1 1 0 011 1V4M4.5 4l.5 9.5a1 1 0 001 1h4a1 1 0 001-1L12 4" />
          </svg>
        </button>
      </div>
      <label className="block text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">
        Description
      </label>
      <textarea
        placeholder="Brief explanation shown in the published deck"
        value={addon.description}
        onChange={(e) => onChange({ description: e.target.value })}
        rows={2}
        className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
      />
    </div>
  )
}
