// ---------------------------------------------------------------------------
// Cover is rendered as the <header> above the accordion, not as an accordion
// section. The hero primitive handles it. This file exists so the section
// dispatcher has a uniform API; it returns an empty string and layout.ts
// short-circuits it from the accordion.
// ---------------------------------------------------------------------------

import type { CoverSection } from '@/lib/types'
import type { Brand } from '../brand'

export function renderCover(_cover: CoverSection, _brand: Brand): string {
  return ''
}
