'use client'

interface SectionHeaderProps {
  number: number
  title: string
  description: string
  /** When provided, renders an Include/Exclude switch on the title row. */
  enabled?: boolean
  onToggleEnabled?: (next: boolean) => void
}

export default function SectionHeader({
  number,
  title,
  description,
  enabled,
  onToggleEnabled,
}: SectionHeaderProps) {
  const showToggle = typeof enabled === 'boolean' && typeof onToggleEnabled === 'function'

  return (
    <div className="mb-8">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold text-text">{title}</h2>
          <p className="mt-1.5 text-sm text-text-secondary">{description}</p>
        </div>

        {showToggle && (
          <label
            className="relative inline-flex shrink-0 cursor-pointer items-center mt-1.5"
            title={enabled ? 'Included in this deck' : 'Excluded from this deck'}
          >
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => onToggleEnabled!(e.target.checked)}
              className="peer sr-only"
              aria-label={`Include ${title} in this deck`}
            />
            <div
              className="
                h-6 w-11 rounded-full bg-border-strong
                peer-checked:bg-accent
                transition-colors
                after:content-[''] after:absolute after:top-0.5 after:left-0.5
                after:h-5 after:w-5 after:rounded-full after:bg-white
                after:shadow-sm after:transition-transform
                peer-checked:after:translate-x-5
              "
            />
          </label>
        )}
      </div>
    </div>
  )
}
