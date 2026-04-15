// Phase-A stub. Phase-C will replace with axis tables.
import type { CredentialsSection } from '@/lib/types'
import type { Brand } from '../brand'
import { sectionPlaceholder } from './_placeholder'

export function renderCredentials(_data: CredentialsSection, _brand: Brand): string {
  return sectionPlaceholder('Credentials section — rendered in Phase C')
}
