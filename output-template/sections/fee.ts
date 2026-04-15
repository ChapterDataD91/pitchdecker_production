// Phase-A stub. Phase-B will replace with fee + instalments + guarantee callout.
import type { FeeSection } from '@/lib/types'
import type { Brand } from '../brand'
import { sectionPlaceholder } from './_placeholder'

export function renderFee(_data: FeeSection, _brand: Brand): string {
  return sectionPlaceholder('Fee Proposal — rendered in Phase B')
}
