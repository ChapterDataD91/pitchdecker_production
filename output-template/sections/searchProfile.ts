// ---------------------------------------------------------------------------
// Search Profile section: 2-col Must-Haves + Nice-to-Haves cards, then
// Personality Profile (label + intro + bulleted traits).
// Reference: demo HTML L382-408.
//
// Weights from Criterion are deliberately not surfaced here — they belong in
// the Scorecard section.
// ---------------------------------------------------------------------------

import type { SearchProfileSection, Criterion } from '@/lib/types'
import type { Brand } from '../brand'
import { esc } from '../primitives/escape'

function renderCriteriaList(items: readonly Criterion[]): string {
  if (items.length === 0) return '<li style="opacity:.5">None captured yet</li>'
  return items.map((c) => `<li>${esc(c.text)}</li>`).join('')
}

function renderPersonalityProfile(
  profile: SearchProfileSection['personalityProfile'],
): string {
  const hasIntro = profile.intro.trim().length > 0
  const hasTraits = profile.traits.length > 0
  if (!hasIntro && !hasTraits) return ''

  const intro = hasIntro ? `<p>${esc(profile.intro)}</p>` : ''
  const traits = hasTraits
    ? `<ul style="margin:12px 0 16px 24px;padding:0;list-style:disc">${profile.traits
        .map((t) => `<li style="margin-bottom:8px">${esc(t)}</li>`)
        .join('')}</ul>`
    : ''

  return `<div class="lb">Personality Profile</div>${intro}${traits}`
}

export function renderSearchProfile(
  data: SearchProfileSection,
  _brand: Brand,
): string {
  const noProfile =
    data.mustHaves.length === 0 &&
    data.niceToHaves.length === 0 &&
    data.personalityProfile.intro.trim() === '' &&
    data.personalityProfile.traits.length === 0

  if (noProfile) {
    return `<div class="ot-empty">No search profile captured yet.</div>`
  }

  return `<div class="cols">
  <div class="cd">
    <h4>Must-Haves</h4>
    <ul>${renderCriteriaList(data.mustHaves)}</ul>
  </div>
  <div class="cd">
    <h4>Nice-to-Haves</h4>
    <ul>${renderCriteriaList(data.niceToHaves)}</ul>
  </div>
</div>
${renderPersonalityProfile(data.personalityProfile)}`
}
