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
import type { OutputStrings } from '../strings'
import { esc } from '../primitives/escape'

function renderCriteriaList(
  items: readonly Criterion[],
  placeholder: string,
): string {
  if (items.length === 0)
    return `<li style="opacity:.5">${esc(placeholder)}</li>`
  return items.map((c) => `<li>${esc(c.text)}</li>`).join('')
}

function renderPersonalityProfile(
  profile: SearchProfileSection['personalityProfile'],
  strings: OutputStrings,
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

  return `<div class="lb">${esc(strings.spPersonalityProfile)}</div>${intro}${traits}`
}

export function renderSearchProfile(
  data: SearchProfileSection,
  _brand: Brand,
  strings: OutputStrings,
): string {
  const noProfile =
    data.mustHaves.length === 0 &&
    data.niceToHaves.length === 0 &&
    data.personalityProfile.intro.trim() === '' &&
    data.personalityProfile.traits.length === 0

  if (noProfile) {
    return `<div class="ot-empty">${esc(strings.spEmpty)}</div>`
  }

  const introText = data.intro?.trim() || strings.spLead
  const lead = `<p>${esc(introText)}</p>`

  return `${lead}<div class="cols">
  <div class="cd">
    <h4>${esc(strings.spMustHaves)}</h4>
    <ul>${renderCriteriaList(data.mustHaves, strings.spCriteriaPlaceholder)}</ul>
  </div>
  <div class="cd">
    <h4>${esc(strings.spNiceToHaves)}</h4>
    <ul>${renderCriteriaList(data.niceToHaves, strings.spCriteriaPlaceholder)}</ul>
  </div>
</div>
${renderPersonalityProfile(data.personalityProfile, strings)}`
}
