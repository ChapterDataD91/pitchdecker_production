// ---------------------------------------------------------------------------
// POST /api/deck/[id]/deployment/rollback
//
// Body: { version: number }  — roll the live viewer back to a prior version.
// Calls cicero's rollback_pitchdeck, then patches deck.publishedDeployment.
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server'
import { deckStorage } from '@/lib/deck-storage'
import { rollbackDeployment } from '@/lib/mcp/deployment'
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

  const body = (await request.json().catch(() => ({}))) as { version?: unknown }
  const version = typeof body.version === 'number' ? body.version : NaN
  if (!Number.isInteger(version) || version < 1) {
    return NextResponse.json(
      { error: 'Invalid body: { version: number } required' },
      { status: 400 },
    )
  }

  const result = await rollbackDeployment(existing.token, version)
  if (!result.ok) {
    const status = result.reason === 'invalid_version' ? 400 : 502
    return NextResponse.json(
      { error: 'Rollback failed', reason: result.reason, message: result.error },
      { status },
    )
  }

  const now = new Date().toISOString()
  const next: PublishedDeployment = {
    ...existing,
    version: result.version,
    lastSyncedAt: now,
  }
  await deckStorage.update(id, { publishedDeployment: next })

  return NextResponse.json({
    success: true,
    publishedDeployment: next,
    latestVersion: result.latestVersion,
  })
}
