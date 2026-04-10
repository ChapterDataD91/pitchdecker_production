// ---------------------------------------------------------------------------
// POST /api/companies/match
// Best-effort company name → Algolia company URL matching.
// Used to enrich credential placements with clickable company links.
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server'

const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID
const ALGOLIA_API_KEY = process.env.ALGOLIA_API_KEY
const INDEX_NAME = '3777_companies_nl-NL'

interface MatchRequest {
  companyName: string
}

interface AlgoliaCompanyHit {
  objectID: string
  name?: string
  title?: string
  slug?: string
  url?: string
}

interface MatchResponse {
  url: string | null
  confidence: 'high' | 'low'
  matchedName?: string
}

function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(bv|b\.v\.|nv|n\.v\.|gmbh|ag|ltd|inc|llc|plc)\b/gi, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function POST(request: Request) {
  if (!ALGOLIA_APP_ID || !ALGOLIA_API_KEY) {
    return NextResponse.json(
      { url: null, confidence: 'low' as const },
    )
  }

  let body: MatchRequest
  try {
    body = (await request.json()) as MatchRequest
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const companyName = typeof body.companyName === 'string' ? body.companyName.trim() : ''
  if (!companyName) {
    return NextResponse.json({ url: null, confidence: 'low' as const })
  }

  try {
    const response = await fetch(
      `https://${ALGOLIA_APP_ID}.algolia.net/1/indexes/${INDEX_NAME}/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Algolia-Application-Id': ALGOLIA_APP_ID,
          'X-Algolia-API-Key': ALGOLIA_API_KEY,
        },
        body: JSON.stringify({
          query: companyName,
          hitsPerPage: 3,
          attributesToRetrieve: ['name', 'title', 'slug', 'url', 'objectID'],
        }),
      },
    )

    if (!response.ok) {
      return NextResponse.json({ url: null, confidence: 'low' as const })
    }

    const data = (await response.json()) as { hits: AlgoliaCompanyHit[] }

    if (!data.hits || data.hits.length === 0) {
      return NextResponse.json({ url: null, confidence: 'low' as const })
    }

    const topHit = data.hits[0]
    const hitName = topHit.name || topHit.title || ''

    // Compare normalized names for confidence
    const normalizedQuery = normalizeCompanyName(companyName)
    const normalizedHit = normalizeCompanyName(hitName)

    const isHighConfidence =
      normalizedQuery === normalizedHit ||
      normalizedHit.includes(normalizedQuery) ||
      normalizedQuery.includes(normalizedHit)

    // Build URL — prefer explicit url field, fall back to slug-based URL
    const companyUrl =
      topHit.url ||
      (topHit.slug ? `https://topofminds.com/companies/${topHit.slug}` : null)

    const result: MatchResponse = {
      url: companyUrl,
      confidence: isHighConfidence ? 'high' : 'low',
      matchedName: hitName,
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('Company match failed:', err)
    return NextResponse.json({ url: null, confidence: 'low' as const })
  }
}
