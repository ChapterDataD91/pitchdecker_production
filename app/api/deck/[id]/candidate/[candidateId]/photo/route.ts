import { NextRequest, NextResponse } from 'next/server'
import { deckStorage } from '@/lib/deck-storage'
import { uploadImage } from '@/lib/blob/image-storage'

const VALID_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_FILE_SIZE = 5 * 1024 * 1024

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; candidateId: string }> },
) {
  try {
    const { id: deckId, candidateId } = await params
    const formData = await request.formData()

    const file = formData.get('file')
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Missing "file" in form data' },
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
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 })
    }

    const candidateExists = deck.sections.candidates.candidates.some(
      (c) => c.id === candidateId,
    )
    if (!candidateExists) {
      return NextResponse.json(
        { error: 'Candidate not found on this deck' },
        { status: 404 },
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const url = await uploadImage(
      deckId,
      `candidate-${candidateId}`,
      buffer,
      file.type,
    )

    return NextResponse.json({ url })
  } catch (error) {
    console.error('[candidate photo upload] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 },
    )
  }
}
