// Phase-A stub. Phase-D will replace with assessor card + pillars + MT block.
import type { AssessmentSection } from '@/lib/types'
import type { Brand } from '../brand'
import { sectionPlaceholder } from './_placeholder'

export function renderAssessment(_data: AssessmentSection, _brand: Brand): string {
  return sectionPlaceholder('Assessment section — rendered in Phase D')
}
