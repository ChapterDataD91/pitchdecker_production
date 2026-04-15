// ---------------------------------------------------------------------------
// POST /api/publish/[id]
//
// 1. Fetch the deck from in-memory storage.
// 2. Validate completeness — every section must be non-'empty'.
// 3. Render HTML via @/output-template (pure function, typed Deck → strings).
// 4. Upload index.html + candidates/{slug}.html via the Cicero MCP
//    deployPitchdeck tool, which returns a viewer URL + PIN.
// 5. Return { viewerUrl, pin, expiresInDays } to the editor.
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server'
import { deckStorage } from '@/lib/deck-storage'
import { publishDeckArtifacts } from '@/lib/mcp/deploy-pitchdeck'
import type { PublishFile } from '@/lib/mcp/deploy-pitchdeck'
import { renderDeck } from '@/output-template'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params

  // --- 1. Fetch -----------------------------------------------------------
  const deck = await deckStorage.get(id)
  if (!deck) {
    return NextResponse.json({ error: 'Deck not found' }, { status: 404 })
  }

  // --- 2. Validate completeness ------------------------------------------
  const empty = Object.entries(deck.sectionStatuses)
    .filter(([, status]) => status === 'empty')
    .map(([key]) => key)

  if (empty.length > 0) {
    return NextResponse.json(
      {
        error: 'Deck is incomplete',
        emptySections: empty,
        message: `Cannot publish: ${empty.length} section(s) still empty: ${empty.join(', ')}`,
      },
      { status: 400 },
    )
  }

  // --- 3. Render ----------------------------------------------------------
  let files: PublishFile[]
  try {
    const result = renderDeck(deck, { mode: 'publish' })
    files = [
      { path: 'index.html', content: result.html },
      ...result.candidates.map((c) => ({
        path: `candidates/${c.slug}.html`,
        content: c.html,
      })),
    ]
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { error: 'Render failed', message },
      { status: 500 },
    )
  }

  // --- 4. Deploy via MCP --------------------------------------------------
  let published
  try {
    published = await publishDeckArtifacts(
      deck.clientName || 'Unnamed Client',
      files,
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { error: 'Deploy failed', message },
      { status: 502 },
    )
  }

  // --- 5. Respond ---------------------------------------------------------
  return NextResponse.json({
    success: true,
    viewerUrl: published.viewerUrl,
    pin: published.pin,
    expiresInDays: published.expiresInDays,
    filesPublished: files.length,
  })
}
