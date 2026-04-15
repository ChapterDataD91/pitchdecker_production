// Phase-A stub. Phase-D will replace with the candidate grid + per-candidate links.
import type { CandidatesSection } from '@/lib/types'
import type { Brand } from '../brand'
import { sectionPlaceholder } from './_placeholder'

export function renderCandidates(
  _data: CandidatesSection,
  _brand: Brand,
  _slugMap: Map<string, string>,
): string {
  return sectionPlaceholder('Sample Candidates — rendered in Phase D')
}
