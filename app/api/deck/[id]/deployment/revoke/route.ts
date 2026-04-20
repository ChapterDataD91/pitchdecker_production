// ---------------------------------------------------------------------------
// POST /api/deck/[id]/deployment/revoke
//
// Permanently revokes the deployment via cicero's revoke_pitchdeck. Flips
// deck.publishedDeployment.status to 'revoked'. The next publish will mint a
// fresh token + PIN (handled by the smart publish route).
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server'
import { deckStorage } from '@/lib/deck-storage'
import { revokeDeployment } from '@/lib/mcp/deployment'
import type { PublishedDeployment } from '@/lib/types'

export async function POST(
  _request: Request,
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
  if (existing.status === 'revoked') {
    // Idempotent — already revoked, nothing to do.
    return NextResponse.json({ success: true, publishedDeployment: existing })
  }

  const result = await revokeDeployment(existing.token)
  if (!result.ok) {
    // If cicero says not_found, treat as already-revoked and sync local state.
    if (result.reason === 'not_found') {
      const next: PublishedDeployment = {
        ...existing,
        status: 'revoked',
        lastSyncedAt: new Date().toISOString(),
      }
      await deckStorage.update(id, { publishedDeployment: next })
      return NextResponse.json({ success: true, publishedDeployment: next })
    }
    return NextResponse.json(
      { error: 'Revoke failed', reason: result.reason, message: result.error },
      { status: 502 },
    )
  }

  const next: PublishedDeployment = {
    ...existing,
    status: 'revoked',
    lastSyncedAt: new Date().toISOString(),
  }
  await deckStorage.update(id, { publishedDeployment: next })
  return NextResponse.json({ success: true, publishedDeployment: next })
}
