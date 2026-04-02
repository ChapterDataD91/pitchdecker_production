'use client'

import type { SalarySection } from '@/lib/types'

interface SalaryEditorProps {
  data: SalarySection
  onChange: (data: SalarySection) => void
}

export default function SalaryEditor({ data, onChange }: SalaryEditorProps) {
  void onChange

  return (
    <div className="space-y-5">
      {/* Base salary range */}
      <div>
        <label className="block text-sm font-medium text-text mb-2">
          Base Salary Range
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-text-tertiary mb-1">From</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-tertiary">EUR</span>
              <input
                type="number"
                placeholder="0"
                defaultValue={data.baseLow || ''}
                className="w-full rounded-md border border-border bg-bg pl-12 pr-3 py-2.5 text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-text-tertiary mb-1">To</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-tertiary">EUR</span>
              <input
                type="number"
                placeholder="0"
                defaultValue={data.baseHigh || ''}
                className="w-full rounded-md border border-border bg-bg pl-12 pr-3 py-2.5 text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bonus */}
      <div>
        <label className="block text-sm font-medium text-text mb-1.5">
          Bonus
        </label>
        <input
          type="text"
          placeholder="e.g. 20% target bonus"
          defaultValue={data.bonus}
          className="w-full rounded-md border border-border bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
        />
      </div>

      {/* LTIP */}
      <div>
        <label className="block text-sm font-medium text-text mb-1.5">
          Long-term Incentive Plan
        </label>
        <input
          type="text"
          placeholder="e.g. Stock options, RSUs, phantom shares"
          defaultValue={data.ltip}
          className="w-full rounded-md border border-border bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
        />
      </div>

      {/* Benefits */}
      <div>
        <label className="block text-sm font-medium text-text mb-1.5">
          Benefits
        </label>
        <textarea
          placeholder="Company car, pension contribution, health insurance..."
          defaultValue={data.benefits}
          rows={3}
          className="w-full rounded-md border border-border bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
        />
      </div>

      {/* Other */}
      <div>
        <label className="block text-sm font-medium text-text mb-1.5">
          Other Compensation
        </label>
        <textarea
          placeholder="Relocation package, sign-on bonus, etc."
          defaultValue={data.other}
          rows={2}
          className="w-full rounded-md border border-border bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
        />
      </div>
    </div>
  )
}
