'use client'

import { useState } from 'react'
import type { SalarySection } from '@/lib/types'
import { useEditorStore } from '@/lib/store/editor-store'
import LoadingDots from '@/components/ui/LoadingDots'

interface SalaryEditorProps {
  data: SalarySection
  onChange: (data: SalarySection) => void
}

interface BenchmarkResult {
  p25: number | null
  p50: number | null
  p75: number | null
  avg: number | null
  n: number
  roleTitleUsed: string
  periodLabel: string
}

function parseAmount(value: string): number {
  if (value === '') return 0
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export default function SalaryEditor({ data, onChange }: SalaryEditorProps) {
  const roleTitle = useEditorStore((s) => s.deck?.roleTitle ?? '')
  const [benchmarkLoading, setBenchmarkLoading] = useState(false)
  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkResult | null>(null)
  const [benchmarkError, setBenchmarkError] = useState<string | null>(null)

  function update(patch: Partial<SalarySection>) {
    onChange({ ...data, ...patch })
  }

  async function handleBenchmark() {
    setBenchmarkLoading(true)
    setBenchmarkError(null)
    try {
      const res = await fetch('/api/benchmark/salary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleTitle }),
      })
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(payload.error ?? 'Request failed')
      }
      const result = (await res.json()) as BenchmarkResult
      setBenchmarkResult(result)
      if (result.n > 0 && result.p25 != null && result.p75 != null) {
        update({
          baseLow: Math.round(result.p25),
          baseHigh: Math.round(result.p75),
        })
      }
    } catch (err) {
      setBenchmarkError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setBenchmarkLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Base salary range */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-text">Base Salary Range</label>
          <button
            type="button"
            onClick={handleBenchmark}
            disabled={benchmarkLoading}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:text-accent hover:border-accent hover:bg-accent-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {benchmarkLoading ? (
              <>
                <LoadingDots />
                <span>Benchmarking…</span>
              </>
            ) : (
              <>
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                  />
                </svg>
                <span>Benchmark</span>
              </>
            )}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-text-tertiary mb-1">From</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-tertiary">EUR</span>
              <input
                type="number"
                placeholder="0"
                value={data.baseLow ?? ''}
                onChange={(e) => update({ baseLow: parseAmount(e.target.value) })}
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
                value={data.baseHigh ?? ''}
                onChange={(e) => update({ baseHigh: parseAmount(e.target.value) })}
                className="w-full rounded-md border border-border bg-bg pl-12 pr-3 py-2.5 text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>
          </div>
        </div>
        {benchmarkResult && benchmarkResult.n > 0 && (
          <p className="mt-2 text-xs text-text-tertiary">
            Based on {benchmarkResult.n} placement{benchmarkResult.n === 1 ? '' : 's'}
            {benchmarkResult.roleTitleUsed && (
              <> matching &ldquo;{benchmarkResult.roleTitleUsed}&rdquo;</>
            )}{' '}
            in the {benchmarkResult.periodLabel} (25th–75th percentile).
          </p>
        )}
        {benchmarkResult && benchmarkResult.n === 0 && (
          <p className="mt-2 text-xs text-text-tertiary">
            No comparable placements found
            {benchmarkResult.roleTitleUsed && (
              <> for &ldquo;{benchmarkResult.roleTitleUsed}&rdquo;</>
            )}
            .
          </p>
        )}
        {benchmarkError && (
          <p className="mt-2 text-xs text-red-600">
            Benchmark unavailable: {benchmarkError}
          </p>
        )}
      </div>

      {/* Bonus */}
      <div>
        <label className="block text-sm font-medium text-text mb-1.5">
          Bonus
        </label>
        <input
          type="text"
          placeholder="e.g. 20% target bonus"
          value={data.bonus}
          onChange={(e) => update({ bonus: e.target.value })}
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
          value={data.ltip}
          onChange={(e) => update({ ltip: e.target.value })}
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
          value={data.benefits}
          onChange={(e) => update({ benefits: e.target.value })}
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
          value={data.other}
          onChange={(e) => update({ other: e.target.value })}
          rows={2}
          className="w-full rounded-md border border-border bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
        />
      </div>
    </div>
  )
}
