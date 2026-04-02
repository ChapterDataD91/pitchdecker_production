'use client'

type BadgeColor =
  | 'sand'
  | 'sage'
  | 'rose'
  | 'lilac'
  | 'slate'
  | 'sienna'
  | 'teal'
  | 'copper'

interface BadgeProps {
  text: string
  color: BadgeColor
}

const colorClasses: Record<BadgeColor, string> = {
  sand: 'bg-fn-sand-bg text-fn-sand-fg',
  sage: 'bg-fn-sage-bg text-fn-sage-fg',
  rose: 'bg-fn-rose-bg text-fn-rose-fg',
  lilac: 'bg-fn-lilac-bg text-fn-lilac-fg',
  slate: 'bg-fn-slate-bg text-fn-slate-fg',
  sienna: 'bg-fn-sienna-bg text-fn-sienna-fg',
  teal: 'bg-fn-teal-bg text-fn-teal-fg',
  copper: 'bg-fn-copper-bg text-fn-copper-fg',
}

export default function Badge({ text, color }: BadgeProps) {
  return (
    <span
      className={`inline-block rounded-md px-2.5 py-0.5 text-xs font-medium tracking-wide ${colorClasses[color]}`}
    >
      {text}
    </span>
  )
}
