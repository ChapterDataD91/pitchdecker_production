// ---------------------------------------------------------------------------
// POST /api/deck/[id]/deployment/rename
//
// Body: { clientName: string }
//
// Renames the client label in BOTH places:
//   1. Cicero's stored client_name (controls what the PIN page shows)
//   2. Pitchdecker's deck.clientName and deck.sections.cover.clientName
//      (so the deck content reflects the new name on the next republish)
//
// This is the "option A — sync" behavior chosen in Evening 2 scoping.
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server'
import { deckStorage } from '@/lib/deck-storage'
import { renameDeployment } from '@/lib/mcp/deployment'
import type { PublishedDeployment } from '@/lib/types'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params
  const deck = await deckStorage.get(id)
  if (!deck) {
    return NextResponse.json({ error: 'Deck not found' }, { status: 404 })
  }
  const existing = deck.publishedDeployment
  if (!existing) {
    return NextResponse.json(
      { error: 'Deck has no active deployment' },
      { status: 400 },
    )
  }

  const body = (await request.json().catch(() => ({}))) as { clientName?: unknown }
  const clientName =
    typeof body.clientName === 'string' ? body.clientName.trim() : ''
  if (!clientName) {
    return NextResponse.json(
      { error: 'Invalid body: { clientName: non-empty string } required' },
      { status: 400 },
    )
  }

  const result = await renameDeployment(existing.token, clientName)
  if (!result.ok) {
    return NextResponse.json(
      { error: 'Rename failed', reason: result.reason, message: result.error },
      { status: 502 },
    )
  }

  // Sync cover section first (separate collection path), then top-level fields.
  await deckStorage.updateSection(id, 'cover', { clientName: result.clientName })
  const nextDeployment: PublishedDeployment = {
    ...existing,
    lastSyncedAt: new Date().toISOString(),
  }
  await deckStorage.update(id, {
    clientName: result.clientName,
    publishedDeployment: nextDeployment,
  })

  return NextResponse.json({
    success: true,
    clientName: result.clientName,
    publishedDeployment: nextDeployment,
  })
}
