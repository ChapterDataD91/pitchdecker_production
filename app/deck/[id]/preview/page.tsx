// ---------------------------------------------------------------------------
// Preview page — server component.
//
// The iframe + sandbox in PreviewShell guarantees the output template's CSS
// cannot leak into the editor (and vice versa).
// ---------------------------------------------------------------------------

import { notFound } from 'next/navigation'
import { deckStorage } from '@/lib/deck-storage'
import { renderDeck } from '@/output-template'
import { SECTIONS } from '@/lib/theme'
import type { SectionStatuses } from '@/lib/types'
import PreviewShell from './PreviewShell'

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const deck = await deckStorage.get(id)
  if (!deck) notFound()

  const result = renderDeck(deck, { mode: 'preview' })

  // Derive section statuses from the authoritative section data, not from
  // the stored `deck.sectionStatuses` field (which can drift — editors
  // don't always flip it to 'complete' when content is saved). Uses the
  // same isSectionComplete helper the dashboard relies on.
  const liveSectionStatuses = SECTIONS.reduce<SectionStatuses>((acc, section) => {
    acc[section.id] = deckStorage.isSectionComplete(deck, section.id)
      ? 'complete'
      : 'empty'
    return acc
  }, { ...deck.sectionStatuses })

  return (
    <PreviewShell
      deckId={id}
      deckTitle={`${deck.clientName || 'Untitled'} — ${deck.roleTitle || 'Proposal'}`}
      clientName={deck.clientName || ''}
      sectionStatuses={liveSectionStatuses}
      mainHtml={result.html}
      candidates={result.candidates.map((c, i) => ({
        slug: c.slug,
        label: deck.sections.candidates.candidates[i]?.name ?? c.slug,
        html: c.html,
      }))}
      publishedDeployment={deck.publishedDeployment}
    />
  )
}
