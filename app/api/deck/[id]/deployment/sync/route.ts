// ---------------------------------------------------------------------------
// POST /api/deck/[id]/deployment/sync
//
// Explicit user-triggered reconciliation. Calls cicero's list_pitchdecks,
// detects drift against the stored publishedDeployment, patches Mongo.
// Returns the updated deployment + a `drifted` field listing what changed
// (so the UI can toast "Synced — revoked upstream" vs "Already in sync").
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server'
import { deckStorage } from '@/lib/deck-storage'
import { reconcileDeployment } from '@/lib/deployment-sync'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params
  const deck = await deckStorage.get(id)
  if (!deck) {
    return NextResponse.json({ error: 'Deck not found' }, { status: 404 })
  }
  if (!deck.publishedDeployment) {
    return NextResponse.json(
      { error: 'Deck has no deployment to sync' },
      { status: 400 },
    )
  }

  try {
    const report = await reconcileDeployment(deck)
    if (!report) {
      return NextResponse.json(
        { error: 'Nothing to sync' },
        { status: 400 },
      )
    }
    return NextResponse.json({
      success: true,
      changed: report.changed,
      drifted: report.drifted,
      publishedDeployment: report.deployment,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { error: 'Sync failed', message },
      { status: 502 },
    )
  }
}
