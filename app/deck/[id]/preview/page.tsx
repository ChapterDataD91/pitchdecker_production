// ---------------------------------------------------------------------------
// Preview page — server component.
//
// Next.js (16 + Turbopack) isolates module state between server components
// and route handlers, so reading deckStorage directly would miss decks created
// via the API. We fetch through /api/deck/[id] to reach the shared instance.
//
// The iframe + sandbox in PreviewShell guarantees the output template's CSS
// cannot leak into the editor (and vice versa).
// ---------------------------------------------------------------------------

import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import type { Deck } from '@/lib/types'
import { renderDeck } from '@/output-template'
import PreviewShell from './PreviewShell'

async function loadDeck(id: string): Promise<Deck | null> {
  const hdrs = await headers()
  const host = hdrs.get('host') ?? 'localhost:3000'
  const proto = hdrs.get('x-forwarded-proto') ?? 'http'
  const res = await fetch(`${proto}://${host}/api/deck/${id}`, { cache: 'no-store' })
  if (!res.ok) return null
  const body = (await res.json()) as { deck?: Deck }
  return body.deck ?? null
}

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const deck = await loadDeck(id)
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
