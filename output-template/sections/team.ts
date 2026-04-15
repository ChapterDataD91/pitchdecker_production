// ---------------------------------------------------------------------------
// Team section: Lead Team grid + Network grid.
// Reference: demo HTML L317-370.
//
// `expertiseTags` on TeamMember is not surfaced in the proposal output —
// it's editor metadata. Photo absent → cream-blue gradient placeholder with initials.
// ---------------------------------------------------------------------------

import type { TeamSection, TeamMember } from '@/lib/types'
import type { Brand } from '../brand'
import { esc, escAttr } from '../primitives/escape'

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

function renderMember(member: TeamMember): string {
  const photo = member.photoUrl?.trim()
    ? `<img class="tc-img" src="${escAttr(member.photoUrl)}" alt="${escAttr(member.name)}">`
    : `<div class="tc-img-placeholder">${esc(getInitials(member.name))}</div>`

  return `<div class="tc">
  ${photo}
  <div class="tc-body">
    <div class="tc-name">${esc(member.name)}</div>
    <div class="tc-role">${esc(member.title)}</div>
    <div class="tc-bio">${esc(member.bio)}</div>
  </div>
</div>`
}

function renderGrid(label: string, members: readonly TeamMember[]): string {
  if (members.length === 0) return ''
  return `<div class="lb">${esc(label)}</div>
<div class="team">${members.map(renderMember).join('')}</div>`
}

export function renderTeam(data: TeamSection, _brand: Brand): string {
  if (data.leadTeam.length === 0 && data.network.length === 0) {
    return `<div class="ot-empty">No team members added yet.</div>`
  }
  const lead = renderGrid('Lead Team', data.leadTeam)
  const network = renderGrid('Building Upon Different Networks', data.network)
  return [lead, network].filter(Boolean).join('\n')
}
