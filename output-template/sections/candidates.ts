// ---------------------------------------------------------------------------
// Sample Candidates section: lead + hard-factors gate note + GDPR disclaimer
// + .cand grid of clickable cards linking to per-candidate pages.
// Reference: demo HTML L603-1322.
//
// Each card carries: rank badge, persona-coloured archetype badge, photo or
// initials, name+age, "current role at company", score %, animated score bar,
// short summary. Top 3 by ranking get the .top3 left-border accent.
// ---------------------------------------------------------------------------

import type { CandidatesSection, Candidate } from '@/lib/types'
import type { Brand } from '../brand'
import type { OutputStrings } from '../strings'
import { esc, escAttr } from '../primitives/escape'

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

function renderCandidateAvatar(candidate: Candidate): string {
  if (candidate.photoUrl?.trim()) {
    return `<img class="cand-initials-lg" src="${escAttr(candidate.photoUrl)}" alt="${escAttr(candidate.name)}" style="object-fit:cover">`
  }
  return `<div class="cand-initials-lg">${esc(getInitials(candidate.name))}</div>`
}

function renderArchetypeBadge(candidate: Candidate): string {
  const tag = candidate.archetypeTag?.trim()
  if (!tag) return ''
  // Default to the brand blue accent. Future: map by persona id → huisstijl
  // persona colour (Health-Tech #4a6287, etc.).
  return `<div class="cand-badge" style="color:var(--blue);background:rgba(90,146,181,.12)">${esc(tag)}</div>`
}

function renderRoleSubtitle(candidate: Candidate, strings: OutputStrings): string {
  const role = candidate.currentRole?.trim()
  const company = candidate.currentCompany?.trim()
  if (!role && !company) return ''
  if (role && company)
    return `${esc(role)} ${esc(strings.cpRoleAt)} ${esc(company)}`
  return esc(role || company)
}

function renderCard(
  candidate: Candidate,
  slug: string,
  strings: OutputStrings,
): string {
  const isTop3 = candidate.ranking >= 1 && candidate.ranking <= 3
  const cardClass = `cand-card${isTop3 ? ' top3' : ''}`
  const score = Math.round(candidate.overallScore || 0)
  const ageSuffix = candidate.age && candidate.age > 0 ? ` (${esc(candidate.age)})` : ''

  return `<a class="${cardClass}" href="candidates/${escAttr(slug)}.html" style="text-decoration:none;color:inherit;display:block">
  <div class="cand-rank">${esc(candidate.ranking || '–')}</div>
  <div class="cand-header">
    ${renderCandidateAvatar(candidate)}
    <div class="cand-header-info">
      ${renderArchetypeBadge(candidate)}
      <div class="cand-name">${esc(candidate.name)}${ageSuffix}</div>
      <div class="cand-sub">${renderRoleSubtitle(candidate, strings)}</div>
    </div>
  </div>
  <div class="cand-score" style="color:var(--blue)">${esc(score)}%</div>
  <div class="cand-bar"><div class="cand-bar-fill" style="width:${esc(score)}%;background:var(--blue)"></div></div>
  ${candidate.summary?.trim() ? `<div class="cand-summary">${esc(candidate.summary)}</div>` : ''}
</a>`
}

function renderHardFactorsNote(
  note: string | undefined,
  strings: OutputStrings,
): string {
  if (!note?.trim()) return ''
  return `<div class="lb">${esc(strings.candHardFactsLabel)}</div>
<div class="gd" style="margin:20px 0">
  <p style="margin-bottom:0">${esc(note)}</p>
</div>`
}

function renderGdprDisclaimer(strings: OutputStrings): string {
  // Default disclaimer — always shown. Future: optional override field on the
  // section if firms want different wording.
  return `<div style="border-left:3px solid var(--sand);padding:12px 18px;margin:20px 0 24px 0;font-size:13px;font-style:normal;color:var(--txt3);line-height:1.6;font-family:var(--sans)">${esc(strings.candGdprDisclaimer)}</div>`
}

export function renderCandidates(
  data: CandidatesSection,
  _brand: Brand,
  strings: OutputStrings,
  slugMap: Map<string, string>,
): string {
  if (data.candidates.length === 0) {
    return `<div class="ot-empty">${esc(strings.candEmpty)}</div>`
  }

  // Sort by ranking (lower number = higher rank). Unranked candidates fall to the end.
  const sorted = [...data.candidates].sort((a, b) => {
    const ar = a.ranking > 0 ? a.ranking : Infinity
    const br = b.ranking > 0 ? b.ranking : Infinity
    if (ar !== br) return ar - br
    return a.id.localeCompare(b.id)
  })

  const cards = sorted
    .map((c) => renderCard(c, slugMap.get(c.id) ?? c.id, strings))
    .join('\n')

  return `${renderHardFactorsNote(data.hardFactorsGateNote, strings)}
${renderGdprDisclaimer(strings)}
<div class="cand">${cards}</div>`
}
