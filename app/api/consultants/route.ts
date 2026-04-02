import { NextResponse } from 'next/server'
import type { AlgoliaConsultant, ConsultantSummary } from '@/lib/types'

const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID!
const ALGOLIA_API_KEY = process.env.ALGOLIA_API_KEY!
const ALGOLIA_CDN_BASE = process.env.ALGOLIA_CDN_BASE ?? 'https://cdn.media.topofminds.index.nl/'
const INDEX_NAME = '3777_consultants_nl-NL'

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildPhotoUrl(image: string): string {
  if (!image) return ''
  const encoded = image.split('/').map(encodeURIComponent).join('/')
  return `${ALGOLIA_CDN_BASE}${encoded}`
}

function toSummary(hit: AlgoliaConsultant): ConsultantSummary {
  return {
    id: hit.objectID,
    name: hit.title ?? `${hit.name} ${hit.surname}`,
    role: hit.function ?? '',
    photoUrl: buildPhotoUrl(hit.image ?? ''),
    bio: stripHtml(hit.quote ?? ''),
    sectors: hit.sectors ?? [],
    functionalAreas: hit.functionalAreas ?? [],
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') ?? ''

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
        query,
        hitsPerPage: 100,
        attributesToRetrieve: [
          'title', 'name', 'surname', 'function', 'email',
          'image', 'quote', 'linkedIn', 'sectors',
          'functionalAreas', 'teams', 'plateId',
        ],
      }),
    },
  )

  if (!response.ok) {
    return NextResponse.json(
      { error: 'Failed to fetch consultants' },
      { status: response.status },
    )
  }

  const data = await response.json()
  const consultants: ConsultantSummary[] = (data.hits as AlgoliaConsultant[]).map(toSummary)

  return NextResponse.json(consultants)
}
