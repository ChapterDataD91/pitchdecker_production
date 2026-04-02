'use client'

interface SectionHeaderProps {
  number: number
  title: string
  description: string
}

export default function SectionHeader({
  number,
  title,
  description,
}: SectionHeaderProps) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold text-text">{title}</h2>
      <p className="mt-1.5 text-sm text-text-secondary">{description}</p>
    </div>
  )
}
