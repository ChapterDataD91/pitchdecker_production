// ---------------------------------------------------------------------------
// GET /api/analytics/[id] — Get analytics for a published deck (stub)
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ views: [] })
}
