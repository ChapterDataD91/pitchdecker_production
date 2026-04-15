// ---------------------------------------------------------------------------
// Preview page — server component.
//
// The iframe + sandbox in PreviewShell guarantees the output template's CSS
// cannot leak into the editor (and vice versa).
// ---------------------------------------------------------------------------

import { notFound } from 'next/navigation'
import { deckStorage } from '@/lib/deck-storage'
import { renderDeck } from '@/output-template'
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

  return (
    <PreviewShell
      deckId={id}
      deckTitle={`${deck.clientName || 'Untitled'} — ${deck.roleTitle || 'Proposal'}`}
      mainHtml={result.html}
      candidates={result.candidates.map((c, i) => ({
        slug: c.slug,
        label: deck.sections.candidates.candidates[i]?.name ?? c.slug,
        html: c.html,
      }))}
    />
  )
}
