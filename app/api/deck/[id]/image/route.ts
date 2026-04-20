import { NextRequest, NextResponse } from 'next/server'
import { deckStorage } from '@/lib/deck-storage'
import { uploadImage } from '@/lib/blob/image-storage'

const VALID_FIELDS = new Set(['hero', 'banner', 'logo'])
const VALID_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: deckId } = await params
    const formData = await request.formData()

    const file = formData.get('file')
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Missing "file" in form data' },
        { status: 400 },
      )
    }

    const field = formData.get('field')
    if (typeof field !== 'string' || !VALID_FIELDS.has(field)) {
      return NextResponse.json(
        { error: 'Invalid field: must be hero, banner, or logo' },
        { status: 400 },
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File exceeds maximum size of 5MB' },
        { status: 413 },
      )
    }

    if (!VALID_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported image type. Upload JPEG, PNG, or WebP.' },
        { status: 415 },
      )
    }

    const deck = await deckStorage.get(deckId)
    if (!deck) {
      return NextResponse.json(
        { error: 'Deck not found' },
        { status: 404 },
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const url = await uploadImage(deckId, field, buffer, file.type)

    return NextResponse.json({ url })
  } catch (error) {
    console.error('[image upload] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 },
    )
  }
}
