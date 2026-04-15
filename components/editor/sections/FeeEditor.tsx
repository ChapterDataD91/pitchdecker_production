'use client'

// ---------------------------------------------------------------------------
// Fee editor — UI stub.
//
// Renders inputs for the new flat-fee FeeSection shape (amount + instalments +
// guarantee + addons). Wiring `onChange` and the add/remove behaviour for
// instalments + addons is deferred to a later phase; this file currently just
// shows defaults so the editor sidebar isn't blank.
// ---------------------------------------------------------------------------

import type { FeeSection } from '@/lib/types'

interface FeeEditorProps {
  data: FeeSection
  onChange: (data: FeeSection) => void
}

export default function FeeEditor({ data, onChange }: FeeEditorProps) {
  void onChange

  const formatAmount = (n: number): string =>
    n > 0 ? n.toLocaleString('en-GB') : ''

  return (
    <div className="space-y-5">
      {/* Fee amount + currency */}
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
              defaultValue={formatAmount(data.amount)}
              className="w-full rounded-md border border-border bg-bg px-3 py-2.5 pl-8 text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-tertiary">
              €
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
            defaultValue={data.currency}
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
            defaultValue={data.vatNote}
            className="w-full rounded-md border border-border bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </div>
      </div>

      {/* Instalments */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-text">
            Instalments
            <span className="ml-2 text-xs text-text-tertiary font-normal">
              (split equally across {data.instalments.length || 1}{' '}
              {data.instalments.length === 1 ? 'instalment' : 'instalments'})
            </span>
          </label>
          <button
            type="button"
            className="text-sm font-medium text-accent hover:text-accent-hover transition-colors"
          >
            + Add instalment
          </button>
        </div>
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 bg-bg-subtle border-b border-border grid grid-cols-12 gap-4">
            <span className="col-span-4 text-xs font-medium text-text-tertiary uppercase tracking-wide">
              Label
            </span>
            <span className="col-span-8 text-xs font-medium text-text-tertiary uppercase tracking-wide">
              Trigger
            </span>
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
              <div
                key={inst.id}
                className="px-4 py-3 border-b border-border last:border-b-0 grid grid-cols-12 gap-4"
              >
                <span className="col-span-4 text-sm font-medium text-text">
                  {inst.label}
                </span>
                <span className="col-span-8 text-sm text-text-secondary">
                  {inst.trigger}
                </span>
              </div>
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
              placeholder="12"
              defaultValue={data.guaranteeMonths || ''}
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
            defaultValue={data.guaranteeNote}
            rows={2}
            className="w-full rounded-md border border-border bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
          />
        </div>
      </div>

      {/* Add-ons */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-text">
            Optional Add-ons
            <span className="ml-2 text-xs text-text-tertiary font-normal">
              ({data.addons.length}{' '}
              {data.addons.length === 1 ? 'add-on' : 'add-ons'})
            </span>
          </label>
          <button
            type="button"
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
          <div className="border border-border rounded-lg divide-y divide-border">
            {data.addons.map((a) => (
              <div key={a.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text">
                    {a.label}
                  </span>
                  <span className="text-sm font-mono text-text-secondary">
                    €{formatAmount(a.amount)}
                  </span>
                </div>
                {a.description && (
                  <p className="mt-1 text-xs text-text-secondary">
                    {a.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
