'use client'

interface SectionDividerPillProps {
  label: string
}

export default function SectionDividerPill({ label }: SectionDividerPillProps) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="h-px flex-1 bg-border" />
      <span className="text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
        {label}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  )
}
