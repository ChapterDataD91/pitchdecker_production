import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/db/mongodb'
import {
  MAX_FILE_SIZE,
  getFileExtension,
  getFileType,
  isTextFile,
  isSupportedFile,
  extractTextFromFile,
} from '@/lib/ai/extract-text'

// POST — Upload a document, extract text, persist to MongoDB
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

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File exceeds maximum size of 10MB` },
        { status: 413 },
      )
    }

    const extension = getFileExtension(file.name)
    if (!isSupportedFile(extension)) {
      return NextResponse.json(
        { error: `Unsupported file type: .${extension}` },
        { status: 415 },
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let extractedText = ''
    if (isTextFile(extension)) {
      extractedText = await extractTextFromFile(buffer, extension)
      if (!extractedText.trim()) {
        return NextResponse.json(
          { error: 'Could not extract any text from the file' },
          { status: 422 },
        )
      }
    } else {
      // For images, we store a placeholder — image analysis happens via Claude vision
      extractedText = `[Image file: ${file.name} — text extraction not available for images]`
    }

    const db = await getDb()
    const doc = {
      deckId,
      userId: null, // Azure AD — populated when auth is implemented
      fileName: file.name,
      fileType: getFileType(extension),
      fileSize: file.size,
      extractedText,
      uploadedAt: new Date().toISOString(),
    }

    const result = await db.collection('documents').insertOne(doc)

    return NextResponse.json({
      id: result.insertedId.toString(),
      fileName: doc.fileName,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      extractedText: doc.extractedText,
      uploadedAt: doc.uploadedAt,
    })
  } catch (error) {
    console.error('[documents POST] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 },
    )
  }
}

// GET — List all documents for a deck (includes extractedText for chat context)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: deckId } = await params
    const db = await getDb()

    const docs = await db
      .collection('documents')
      .find({ deckId })
      .sort({ uploadedAt: -1 })
      .toArray()

    const mapped = docs.map((doc) => ({
      id: doc._id.toString(),
      deckId: doc.deckId,
      fileName: doc.fileName,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      extractedText: doc.extractedText,
      uploadedAt: doc.uploadedAt,
    }))

    return NextResponse.json({ documents: mapped })
  } catch (error) {
    console.error('[documents GET] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load documents' },
      { status: 500 },
    )
  }
}
