// ---------------------------------------------------------------------------
// GET /api/deck/[id]/deployment[?reconcile=1]
//
// Returns the currently-stored publishedDeployment. When `?reconcile=1` is
// passed, runs a cicero-backed sync first (best effort — failures fall back
// to the stored value so the client never sees a hard error for stale data).
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server'
import { deckStorage } from '@/lib/deck-storage'
import { reconcileDeployment } from '@/lib/deployment-sync'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params
  const deck = await deckStorage.get(id)
  if (!deck) {
    return NextResponse.json({ error: 'Deck not found' }, { status: 404 })
  }

  const url = new URL(request.url)
  const shouldReconcile = url.searchParams.get('reconcile') === '1'

  if (shouldReconcile && deck.publishedDeployment) {
    try {
      const report = await reconcileDeployment(deck)
      if (report) {
        return NextResponse.json({
          publishedDeployment: report.deployment,
          reconciled: true,
          changed: report.changed,
          drifted: report.drifted,
        })
      }
    } catch {
      // Fall through to the stored value on MCP failure.
    }
  }

  return NextResponse.json({
    publishedDeployment: deck.publishedDeployment ?? null,
    reconciled: false,
    changed: false,
    drifted: [],
  })
}
