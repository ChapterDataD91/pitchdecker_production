// ---------------------------------------------------------------------------
// POST /api/upload/candidate — Upload candidate CV/LinkedIn (stub)
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { success: false, message: 'Upload not yet implemented' },
    { status: 501 },
  )
}
