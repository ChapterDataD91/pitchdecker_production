// Phase-A stub. Phase-C will replace with the weighted criteria table.
import type { ScorecardSection } from '@/lib/types'
import type { Brand } from '../brand'
import { sectionPlaceholder } from './_placeholder'

export function renderScorecard(_data: ScorecardSection, _brand: Brand): string {
  return sectionPlaceholder('Selection Scorecard — rendered in Phase C')
}
