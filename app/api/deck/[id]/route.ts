// ---------------------------------------------------------------------------
// GET /api/deck/[id] — Get a full deck by ID
// PUT /api/deck/[id] — Update deck metadata (not sections)
// DELETE /api/deck/[id] — Delete a deck
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server'
import { deckStorage } from '@/lib/deck-storage'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params
  const deck = await deckStorage.get(id)

  if (!deck) {
    return NextResponse.json({ error: 'Deck not found' }, { status: 404 })
  }

  return NextResponse.json({ deck })
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { id } = await params

  try {
    const body = await request.json()
    const updated = await deckStorage.update(id, body)

    if (!updated) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 },
    )
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params
  const deleted = await deckStorage.delete(id)

  if (!deleted) {
    return NextResponse.json({ error: 'Deck not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
