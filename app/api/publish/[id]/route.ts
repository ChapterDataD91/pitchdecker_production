// ---------------------------------------------------------------------------
// POST /api/publish/[id] — Publish a deck (stub)
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { success: false, message: 'Publishing not yet implemented' },
    { status: 501 },
  )
}
