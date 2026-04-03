import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/db/mongodb'

// DELETE — Remove a document
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> },
) {
  try {
    const { id: deckId, docId } = await params

    let objectId: ObjectId
    try {
      objectId = new ObjectId(docId)
    } catch {
      return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 })
    }

    const db = await getDb()
    const result = await db
      .collection('documents')
      .deleteOne({ _id: objectId, deckId })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[documents DELETE] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Delete failed' },
      { status: 500 },
    )
  }
}
