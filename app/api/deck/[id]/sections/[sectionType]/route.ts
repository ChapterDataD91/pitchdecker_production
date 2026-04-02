// ---------------------------------------------------------------------------
// GET /api/deck/[id]/sections/[sectionType] — Get section data
// PUT /api/deck/[id]/sections/[sectionType] — Update section data
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server'
import { deckStorage } from '@/lib/deck-storage'
import type { DeckSections } from '@/lib/types'

const VALID_SECTIONS: Array<keyof DeckSections> = [
  'cover',
  'team',
  'searchProfile',
  'salary',
  'credentials',
  'timeline',
  'assessment',
  'personas',
  'scorecard',
  'candidates',
  'fee',
]

interface RouteParams {
  params: Promise<{ id: string; sectionType: string }>
}

function isValidSection(key: string): key is keyof DeckSections {
  return VALID_SECTIONS.includes(key as keyof DeckSections)
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id, sectionType } = await params

  if (!isValidSection(sectionType)) {
    return NextResponse.json(
      { error: `Invalid section type: ${sectionType}` },
      { status: 400 },
    )
  }

  const section = deckStorage.getSection(id, sectionType)

  if (section === undefined) {
    return NextResponse.json({ error: 'Deck not found' }, { status: 404 })
  }

  return NextResponse.json({ section })
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { id, sectionType } = await params

  if (!isValidSection(sectionType)) {
    return NextResponse.json(
      { error: `Invalid section type: ${sectionType}` },
      { status: 400 },
    )
  }

  const deck = deckStorage.get(id)
  if (!deck) {
    return NextResponse.json({ error: 'Deck not found' }, { status: 404 })
  }

  try {
    const body = await request.json()
    const updated = deckStorage.updateSection(id, sectionType, body)

    if (!updated) {
      return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 },
    )
  }
}
