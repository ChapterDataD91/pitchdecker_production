'use client'

import type { Weight } from '@/lib/types'

interface WeightSelectorProps {
  value: Weight
  onChange: (w: Weight) => void
  size?: 'sm' | 'md'
}

const LABELS: Record<Weight, string> = {
  1: '1 — minor',
  2: '2 — relevant',
  3: '3 — standard',
  4: '4 — very important',
  5: '5 — dealbreaker',
}

// Subtle colour shift with value: low weights read quieter,
// high weights read louder. Everything pulls from the accent ramp
// so the control stays monochrome-ish and matches the minimal aesthetic.
function fillClass(value: number): string {
  if (value <= 2) return 'bg-accent/40'
  if (value === 3) return 'bg-accent/70'
  return 'bg-accent'
}

export default function WeightSelector({
  value,
  onChange,
  size = 'md',
}: WeightSelectorProps) {
  const pillHeight = size === 'sm' ? 'h-1.5' : 'h-2'
  const pillWidth = size === 'sm' ? 'w-4' : 'w-5'
  const filled = fillClass(value)

  return (
    <div
      role="radiogroup"
      aria-label="Weight"
      className="inline-flex items-center gap-[2px]"
    >
      {([1, 2, 3, 4, 5] as Weight[]).map((w) => {
        const active = w <= value
        return (
          <button
            key={w}
            type="button"
            role="radio"
            aria-checked={w === value}
            onClick={() => onChange(w)}
            title={LABELS[w]}
            className={`${pillHeight} ${pillWidth} rounded-[2px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 ${
              active
                ? filled
                : 'bg-bg-muted hover:bg-border-strong'
            }`}
          />
        )
      })}
    </div>
  )
}
