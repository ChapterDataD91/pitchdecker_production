'use client'

// ---------------------------------------------------------------------------
// ProgressBar — Thin horizontal progress indicator
// Animated width via Framer Motion. Track: bg-muted, fill: accent.
// ---------------------------------------------------------------------------

import { motion } from 'framer-motion'

interface ProgressBarProps {
  completed: number
  total: number
}

export default function ProgressBar({ completed, total }: ProgressBarProps) {
  const percentage = total > 0 ? (completed / total) * 100 : 0

  return (
    <div
      className="h-[2px] w-full bg-bg-muted"
      role="progressbar"
      aria-valuenow={completed}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={`${completed} of ${total} sections complete`}
    >
      <motion.div
        className="h-full bg-accent"
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  )
}
