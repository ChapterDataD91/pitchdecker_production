'use client'

import type { FeeSection } from '@/lib/types'

interface FeeEditorProps {
  data: FeeSection
  onChange: (data: FeeSection) => void
}

const structures = [
  { value: 'retainer' as const, label: 'Retainer', description: 'Fixed fee paid in installments' },
  { value: 'contingency' as const, label: 'Contingency', description: 'Fee upon successful placement' },
  { value: 'hybrid' as const, label: 'Hybrid', description: 'Upfront retainer + success fee' },
]

export default function FeeEditor({ data, onChange }: FeeEditorProps) {
  void onChange

  return (
    <div className="space-y-5">
      {/* Fee structure selector */}
      <div>
        <label className="block text-sm font-medium text-text mb-2">
          Fee Structure
        </label>
        <div className="grid grid-cols-3 gap-3">
          {structures.map((s) => (
            <div
              key={s.value}
              className={`border rounded-lg p-3.5 cursor-pointer transition-colors ${
                data.feeStructure === s.value
                  ? 'border-accent bg-accent-light'
                  : 'border-border hover:border-border-strong hover:bg-bg-subtle'
              }`}
            >
              <p className={`text-sm font-semibold ${
                data.feeStructure === s.value ? 'text-accent' : 'text-text'
              }`}>
                {s.label}
              </p>
              <p className="mt-0.5 text-xs text-text-secondary">{s.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Fee percentage */}
      <div>
        <label className="block text-sm font-medium text-text mb-1.5">
          Fee Percentage
        </label>
        <div className="relative w-40">
          <input
            type="number"
            placeholder="0"
            defaultValue={data.feePercentage || ''}
            className="w-full rounded-md border border-border bg-bg px-3 py-2.5 pr-8 text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-tertiary">%</span>
        </div>
        <p className="mt-1 text-xs text-text-tertiary">
          Percentage of first-year compensation
        </p>
      </div>

      {/* Payment milestones */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-text">
            Payment Milestones
          </label>
          <button
            type="button"
            className="text-sm font-medium text-accent hover:text-accent-hover transition-colors"
          >
            + Add milestone
          </button>
        </div>
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 bg-bg-subtle border-b border-border grid grid-cols-12 gap-4">
            <span className="col-span-4 text-xs font-medium text-text-tertiary uppercase tracking-wide">Milestone</span>
            <span className="col-span-2 text-xs font-medium text-text-tertiary uppercase tracking-wide">Percentage</span>
            <span className="col-span-6 text-xs font-medium text-text-tertiary uppercase tracking-wide">Description</span>
          </div>
          <div className="p-6 text-center">
            <p className="text-sm text-text-secondary">No milestones defined yet</p>
            <p className="text-xs text-text-tertiary mt-1">Add payment milestones to structure the fee schedule</p>
          </div>
        </div>
      </div>

      {/* Exclusivity & Guarantee */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            Exclusivity Terms
          </label>
          <textarea
            placeholder="e.g. Exclusive mandate for 90 days from kick-off"
            defaultValue={data.exclusivityTerms}
            rows={3}
            className="w-full rounded-md border border-border bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            Guarantee Period
          </label>
          <textarea
            placeholder="e.g. 6-month replacement guarantee at no additional fee"
            defaultValue={data.guaranteePeriod}
            rows={3}
            className="w-full rounded-md border border-border bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
          />
        </div>
      </div>
    </div>
  )
}
