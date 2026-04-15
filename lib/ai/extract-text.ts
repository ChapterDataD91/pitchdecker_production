// ---------------------------------------------------------------------------
// Shared text extraction utility — extracts text from PDF, DOCX, and TXT files
// Used by both the analyze-document API route and the document upload route.
// ---------------------------------------------------------------------------

import mammoth from 'mammoth'
import { getClaudeClient } from './claude-client'

const SUPPORTED_TEXT_EXTENSIONS = new Set(['pdf', 'docx', 'txt'])
const SUPPORTED_IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp'])

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export type ImageMediaType = 'image/png' | 'image/jpeg' | 'image/webp'

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? ''
}

export function isTextFile(extension: string): boolean {
  return SUPPORTED_TEXT_EXTENSIONS.has(extension)
}

export function isImageFile(extension: string): boolean {
  return SUPPORTED_IMAGE_EXTENSIONS.has(extension)
}

export function isSupportedFile(extension: string): boolean {
  return isTextFile(extension) || isImageFile(extension)
}

export function getImageMediaType(ext: string): ImageMediaType {
  const map: Record<string, ImageMediaType> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
  }
  return map[ext]
}

export function getFileType(extension: string): string {
  if (extension === 'pdf') return 'pdf'
  if (extension === 'docx') return 'docx'
  if (extension === 'txt') return 'txt'
  if (SUPPORTED_IMAGE_EXTENSIONS.has(extension)) return 'image'
  return 'unknown'
}

export async function extractTextFromFile(
  buffer: Buffer,
  extension: string,
): Promise<string> {
  switch (extension) {
    case 'pdf': {
      return extractPdfWithClaude(buffer)
    }
    case 'docx': {
      const result = await mammoth.extractRawText({ buffer })
      return result.value
    }
    case 'txt': {
      return buffer.toString('utf-8')
    }
    default:
      throw new Error(`Unsupported text file type: .${extension}`)
  }
}

// PDFs go to Claude as a native `document` block — preserves tables, columns,
// and reads embedded graphics. Replaces the old pdf-parse/pdfjs path so we
// don't ship pdfjs + @napi-rs/canvas on Linux.
async function extractPdfWithClaude(buffer: Buffer): Promise<string> {
  const claude = getClaudeClient()
  const base64 = buffer.toString('base64')

  const response = await claude.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 16_000,
    system:
      'You extract readable plain text from PDF documents. Preserve headings, lists, and the relative structure of tables. Do not summarize, do not add commentary — return only the document contents as Markdown-formatted plain text.',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: base64,
            },
          },
          { type: 'text', text: 'Return the full text of this document.' },
        ],
      },
    ],
  })

  const textBlock = response.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude returned no text content for PDF extraction')
  }
  return textBlock.text
}
