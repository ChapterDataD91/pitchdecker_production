'use client'

import type { Locale } from '@/lib/types'

interface SectionIntroFieldProps {
  value: string | undefined
  onChange: (next: string) => void
  locale: Locale
}

const COPY: Record<Locale, { label: string; placeholder: string; hint: string }> = {
  nl: {
    label: 'Intro',
    placeholder:
      'Schrijf een openingsalinea voor deze sectie (optioneel)…',
    hint: 'Laat leeg om de standaardtekst te tonen.',
  },
  en: {
    label: 'Intro',
    placeholder:
      'Write an opening paragraph for this section (optional)…',
    hint: 'Leave blank to use the default opening.',
  },
}

export default function SectionIntroField({
  value,
  onChange,
  locale,
}: SectionIntroFieldProps) {
  const copy = COPY[locale]

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-tertiary">
        {copy.label}
      </label>
      <textarea
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={copy.placeholder}
        rows={2}
        style={{ fieldSizing: 'content' } as React.CSSProperties}
        className="w-full min-h-[3rem] resize-none rounded-md border border-border bg-bg px-3 py-2.5 text-sm leading-relaxed text-text placeholder-text-placeholder outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
      />
      <p className="mt-1.5 text-xs text-text-tertiary">{copy.hint}</p>
    </div>
  )
}
