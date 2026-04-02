// ---------------------------------------------------------------------------
// GET /api/deck — List all decks (summaries)
// POST /api/deck — Create a new deck
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { deckStorage } from '@/lib/deck-storage'

export async function GET() {
  const decks = deckStorage.getAll()
  return NextResponse.json({ decks })
}

export async function POST(request: Request) {
  try {
    const body: { clientName?: string; roleTitle?: string } = await request.json()

    const clientName = body.clientName?.trim() || ''
    const roleTitle = body.roleTitle?.trim() || ''

    if (!clientName || !roleTitle) {
      return NextResponse.json(
        { error: 'clientName and roleTitle are required' },
        { status: 400 },
      )
    }

    const id = uuidv4()
    const deck = deckStorage.create(id, clientName, roleTitle)

    return NextResponse.json({ id: deck.id, deck }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 },
    )
  }
}
