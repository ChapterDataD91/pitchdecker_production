// ---------------------------------------------------------------------------
// Shared text extraction utility — extracts text from PDF, DOCX, and TXT files
// Used by both the analyze-document API route and the document upload route.
// ---------------------------------------------------------------------------

import { PDFParse } from 'pdf-parse'
import mammoth from 'mammoth'

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
      const parser = new PDFParse({ data: new Uint8Array(buffer) })
      const textResult = await parser.getText()
      await parser.destroy()
      return textResult.text
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
