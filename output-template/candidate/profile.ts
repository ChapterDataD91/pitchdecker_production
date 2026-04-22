// ---------------------------------------------------------------------------
// Per-candidate profile page renderer.
//
// Layout (matches /Users/daan/PitchDecker/site/candidates/*.html):
//   1. Top nav (back to proposal + prev/next + counter)
//   2. Header: avatar, name+age, role+company, persona badge, score %
//   3. Summary callout
//   4. Career Overview table
//   5. Education + Languages 2-col grid
//   6. Scorecard — Hard Factors Only (Must-Haves + Nice-to-Haves only)
//   7. Strengths + Risks/Considerations tag blocks
//
// Each candidate page is a self-contained HTML document. Brand chrome
// (confidentiality bar + footer) is reused so they feel like part of the deck.
// ---------------------------------------------------------------------------

import type {
  Candidate,
  CandidateScore,
  CareerEntry,
  Deck,
  EducationEntry,
  ScorecardCriterion,
} from '@/lib/types'
import type { Brand } from '../brand'
import {
  brandFontLinks,
  brandCss,
  globalCss,
} from '../brand'
import { primitivesCss } from '../primitives'
import { renderFooter, renderConfidentialityBar } from '../primitives/hero'
import { allScripts } from '../scripts'
import { esc, escAttr } from '../primitives/escape'
import type { OutputStrings } from '../strings'

// ---------------------------------------------------------------------------
// Page-scoped CSS (only used inside the candidate page <style> block)
// ---------------------------------------------------------------------------

const candidatePageCss = `
.cand-nav {
  max-width: 1040px; margin: 0 auto;
  padding: 20px 44px 0;
  display: flex; gap: 16px; align-items: center;
  font-family: var(--sans); font-size: 13px;
  color: var(--txt3);
}
.cand-nav a { color: var(--blue); text-decoration: none; }
.cand-nav a:hover { text-decoration: underline; }
.cand-nav .nav-sep { color: var(--txt3); }
.cand-nav .nav-counter { color: var(--txt3); font-family: var(--mono); }
.cand-nav .nav-disabled { color: var(--txt3); opacity: .5; }

.cand-page {
  max-width: 1040px; margin: 0 auto;
  padding: 32px 44px 64px;
  font-family: var(--sans);
}

.cand-page .header {
  display: flex; align-items: flex-start;
  gap: 24px;
  margin-bottom: 28px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--ln);
}
.cand-page .header-info { flex: 1; }
.cand-page .header-info h1 {
  font-family: var(--serif);
  font-size: 36px; font-weight: 400;
  color: var(--navy);
  margin: 0 0 4px;
  line-height: 1.2;
  letter-spacing: -.3px;
}
.cand-page .header-info h2 {
  font-family: var(--sans);
  font-size: 16px; font-weight: 500;
  color: var(--txt2);
  margin: 0 0 12px;
}
.cand-page .header-info h2 a { color: var(--blue); text-decoration: none; }
.cand-page .header-info h2 a:hover { text-decoration: underline; }
.cand-page .persona-badge {
  display: inline-block;
  font-size: 11px; font-weight: 600;
  padding: 4px 12px;
  border-radius: 4px;
  letter-spacing: 1px; text-transform: uppercase;
  background: rgba(90,146,181,.12);
  color: var(--blue);
}

.cand-page .header-photo {
  width: 160px; height: 160px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}
.cand-page .header-photo-placeholder {
  width: 160px; height: 160px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--bl), var(--bg2));
  display: flex; align-items: center; justify-content: center;
  color: var(--blue);
  font-family: var(--mono); font-size: 42px; font-weight: 600;
  flex-shrink: 0;
}

.cand-page .header-score {
  text-align: right; flex-shrink: 0;
  font-family: var(--mono);
}
.cand-page .score-pct {
  font-size: 48px; font-weight: 700;
  color: var(--blue); line-height: 1;
}
.cand-page .score-label {
  font-size: 11px; letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--txt3);
  margin-top: 8px;
  font-family: var(--sans);
}

.cand-page .summary {
  font-size: 16px; line-height: 1.7;
  padding: 20px 24px;
  background: rgba(212,232,242,.25);
  border-radius: 10px;
  border-left: 3px solid var(--blue);
  margin-bottom: 32px;
}

.cand-page h3 {
  font-family: var(--serif);
  font-size: 22px; font-weight: 400;
  color: var(--navy);
  margin: 36px 0 16px;
  letter-spacing: .01em;
}
.cand-page h3:first-child { margin-top: 0; }

.career-table {
  width: 100%; border-collapse: collapse;
  font-size: 14px; font-family: var(--sans);
}
.career-table th {
  text-align: left;
  font-size: 10px; font-weight: 700;
  letter-spacing: 1.5px; text-transform: uppercase;
  color: var(--txt3);
  padding: 10px 12px;
  border-bottom: 2px solid var(--ln);
}
.career-table td {
  padding: 14px 12px;
  border-bottom: 1px solid var(--ln);
  vertical-align: top;
}
.career-table .career-period { color: var(--txt3); white-space: nowrap; font-family: var(--mono); font-size: 12px; }
.career-table .career-role strong { color: var(--navy); }
.career-table .company-link { color: var(--blue); text-decoration: none; font-weight: 500; }
.career-table .company-link:hover { text-decoration: underline; }
.career-table .company-info { font-size: 12px; color: var(--txt3); margin-top: 2px; }
.career-table .career-highlights ul { margin: 0; padding-left: 18px; }
.career-table .career-highlights li { margin-bottom: 3px; }

.info-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin: 24px 0 8px;
}
.info-card {
  background: var(--wh);
  padding: 22px 24px;
  border-radius: 10px;
  border: 1px solid var(--ln);
}
.info-card h3 { font-size: 18px !important; margin: 0 0 12px !important; }
.info-card ul { margin: 0; padding-left: 18px; font-size: 14px; line-height: 1.7; color: var(--txt2); }
.info-card li { margin-bottom: 4px; }
.lang-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.lang-tag {
  display: inline-block;
  font-size: 12px; font-weight: 500;
  padding: 4px 10px;
  background: var(--bg2);
  color: var(--txt2);
  border-radius: 4px;
}

.scorecard {
  width: 100%; border-collapse: collapse;
  font-size: 14px; font-family: var(--sans);
  margin: 16px 0;
}
.scorecard td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--ln);
  vertical-align: middle;
}
.scorecard .sc-cat-header {
  background: var(--bg2);
  font-weight: 700;
  color: var(--navy);
  font-size: 13px;
  padding: 10px 12px;
  letter-spacing: .5px;
}
.scorecard .sc-label { width: 30%; color: var(--navy); font-weight: 500; }
.scorecard .sc-score { width: 8%; text-align: center; font-family: var(--mono); font-weight: 600; color: var(--navy); }
.scorecard .sc-bar { width: 22%; }
.scorecard .sc-bar-track {
  height: 8px; width: 100%; max-width: 160px;
  background: var(--bg2);
  border-radius: 4px; overflow: hidden;
}
.scorecard .sc-bar-fill { height: 100%; border-radius: 4px; }
.scorecard .sc-rationale { font-size: 13px; color: var(--txt3); line-height: 1.5; }

.tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.tag {
  display: inline-block;
  font-size: 13px;
  padding: 6px 12px;
  border-radius: 4px;
  background: rgba(90,146,181,.10);
  color: var(--navy);
  font-family: var(--sans);
}
.tag.risk { background: rgba(196,106,74,.10); color: #8a3e22; }

@media (max-width: 768px) {
  .cand-nav, .cand-page { padding-left: 20px; padding-right: 20px; }
  .cand-page .header { flex-direction: column; gap: 16px; }
  .cand-page .header-score { text-align: left; }
  .career-table { display: block; overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .info-grid { grid-template-columns: 1fr; }
  .scorecard { display: block; overflow-x: auto; -webkit-overflow-scrolling: touch; }
}
`

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

function renderHeaderPhoto(candidate: Candidate): string {
  if (candidate.photoUrl?.trim()) {
    return `<img class="header-photo" src="${escAttr(candidate.photoUrl)}" alt="${escAttr(candidate.name)}">`
  }
  return `<div class="header-photo-placeholder">${esc(getInitials(candidate.name))}</div>`
}

function renderHeader(
  candidate: Candidate,
  deck: Deck,
  strings: OutputStrings,
): string {
  const ageSuffix = candidate.age && candidate.age > 0 ? ` (${esc(candidate.age)})` : ''
  const role = candidate.currentRole?.trim()
  const company = candidate.currentCompany?.trim()
  const linkedin = candidate.linkedinUrl?.trim()

  const roleLine = role && company
    ? `${esc(role)} ${esc(strings.cpRoleAt)} ${linkedin ? `<a href="${escAttr(linkedin)}" target="_blank" rel="noopener noreferrer">${esc(company)}</a>` : esc(company)}`
    : esc(role || company || '')

  const personaBadge = candidate.archetypeTag?.trim()
    ? `<div class="persona-badge">${esc(candidate.archetypeTag)}</div>`
    : ''

  void deck // currently unused; kept for future "client name" header context
  const score = Math.round(candidate.overallScore || 0)

  return `<header class="header">
  ${renderHeaderPhoto(candidate)}
  <div class="header-info">
    <h1>${esc(candidate.name)}${ageSuffix}</h1>
    ${roleLine ? `<h2>${roleLine}</h2>` : ''}
    ${personaBadge}
  </div>
  <div class="header-score">
    <div class="score-pct">${esc(score)}%</div>
    <div class="score-label">${esc(strings.cpHardFactorsScore)}</div>
  </div>
</header>`
}

function renderSummary(candidate: Candidate): string {
  if (!candidate.summary?.trim()) return ''
  return `<div class="summary">${esc(candidate.summary)}</div>`
}

function renderCareerTable(
  history: readonly CareerEntry[] | undefined,
  strings: OutputStrings,
): string {
  if (!history || history.length === 0) return ''
  const rows = history
    .map((e) => {
      const highlights = e.highlights.length > 0
        ? `<div class="career-highlights"><ul>${e.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul></div>`
        : ''
      return `<tr>
  <td class="career-period">${esc(e.period)}</td>
  <td class="career-role"><strong>${esc(e.role)}</strong></td>
  <td>${esc(e.company)}</td>
  <td>${highlights}</td>
</tr>`
    })
    .join('')
  return `<h3>${esc(strings.cpCareerOverview)}</h3>
<table class="career-table">
  <thead><tr>
    <th style="width:14%">${esc(strings.cpColPeriod)}</th>
    <th style="width:22%">${esc(strings.cpColRole)}</th>
    <th style="width:24%">${esc(strings.cpColCompany)}</th>
    <th style="width:40%">${esc(strings.cpColHighlights)}</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>`
}

function renderInfoGrid(
  education: readonly EducationEntry[] | undefined,
  languages: readonly string[] | undefined,
  strings: OutputStrings,
): string {
  const hasEducation = education && education.length > 0
  const hasLanguages = languages && languages.length > 0
  if (!hasEducation && !hasLanguages) return ''

  const educationCard = hasEducation
    ? `<div class="info-card">
  <h3>${esc(strings.cpEducation)}</h3>
  <ul>${education.map((e) => `<li>${esc(e.degree)} — ${esc(e.institution)} <span style="color:var(--txt3)">(${esc(e.period)})</span></li>`).join('')}</ul>
</div>`
    : '<div></div>'

  const languagesCard = hasLanguages
    ? `<div class="info-card">
  <h3>${esc(strings.cpLanguages)}</h3>
  <div class="lang-tags">${languages.map((l) => `<span class="lang-tag">${esc(l)}</span>`).join('')}</div>
</div>`
    : '<div></div>'

  return `<div class="info-grid">${educationCard}${languagesCard}</div>`
}

function renderHardFactorsScorecard(
  candidate: Candidate,
  deck: Deck,
  strings: OutputStrings,
): string {
  const scorecard = deck.sections.scorecard
  const hardFactorCriteria: ScorecardCriterion[] = [
    ...scorecard.mustHaves.map((c) => ({ ...c })),
    ...scorecard.niceToHaves.map((c) => ({ ...c })),
  ]

  if (hardFactorCriteria.length === 0 || !candidate.scores || candidate.scores.length === 0) {
    return ''
  }

  const scoreById = new Map<string, CandidateScore>()
  for (const s of candidate.scores) scoreById.set(s.criterionId, s)

  const renderRow = (c: ScorecardCriterion): string => {
    const s = scoreById.get(c.id)
    if (!s) return ''
    const score = Math.max(0, Math.min(5, s.score))
    const pct = (score / 5) * 100
    const isLow = score <= 2
    const fillColor = isLow ? '#c4694a' : 'var(--blue)'
    return `<tr>
  <td class="sc-label">${esc(c.text)}</td>
  <td class="sc-score">${esc(score)}/5</td>
  <td class="sc-bar"><div class="sc-bar-track"><div class="sc-bar-fill" style="width:${esc(pct)}%;background:${fillColor}"></div></div></td>
  <td class="sc-rationale">${esc(s.rationale ?? '')}</td>
</tr>`
  }

  const mustHaveRows = scorecard.mustHaves.map(renderRow).filter(Boolean).join('')
  const niceToHaveRows = scorecard.niceToHaves.map(renderRow).filter(Boolean).join('')

  if (!mustHaveRows && !niceToHaveRows) return ''

  return `<h3>${esc(strings.cpScorecardHardOnly)}</h3>
<table class="scorecard">
  <tbody>
    ${mustHaveRows ? `<tr><td colspan="4" class="sc-cat-header">${esc(strings.scMustHaves)}</td></tr>${mustHaveRows}` : ''}
    ${niceToHaveRows ? `<tr><td colspan="4" class="sc-cat-header">${esc(strings.scNiceToHaves)}</td></tr>${niceToHaveRows}` : ''}
  </tbody>
</table>`
}

function renderTagBlock(title: string, items: readonly string[] | undefined, isRisk = false): string {
  if (!items || items.length === 0) return ''
  const tagClass = isRisk ? 'tag risk' : 'tag'
  const tags = items.map((t) => `<span class="${tagClass}">${esc(t)}</span>`).join('')
  return `<h3>${esc(title)}</h3>
<div class="tags">${tags}</div>`
}

// ---------------------------------------------------------------------------
// Public entry
// ---------------------------------------------------------------------------

export function renderCandidate(
  candidate: Candidate,
  deck: Deck,
  slugMap: Map<string, string>,
  brand: Brand,
  strings: OutputStrings,
): string {
  const title = `${candidate.name} — ${deck.clientName || strings.cpFallbackProposal}`

  const candidates = deck.sections.candidates.candidates
  const myIndex = candidates.findIndex((c) => c.id === candidate.id)
  const prev = myIndex > 0 ? candidates[myIndex - 1] : null
  const next = myIndex < candidates.length - 1 ? candidates[myIndex + 1] : null
  const prevSlug = prev ? slugMap.get(prev.id) ?? prev.id : null
  const nextSlug = next ? slugMap.get(next.id) ?? next.id : null

  const navLeft = prevSlug
    ? `<a href="${escAttr(prevSlug)}.html">${esc(strings.cpNavPrev)}</a>`
    : `<span class="nav-disabled">${esc(strings.cpNavPrev)}</span>`
  const navRight = nextSlug
    ? `<a href="${escAttr(nextSlug)}.html">${esc(strings.cpNavNext)}</a>`
    : `<span class="nav-disabled">${esc(strings.cpNavNext)}</span>`

  const body = `<nav class="cand-nav">
  <a href="../index.html">${esc(strings.cpNavBack)}</a>
  <span class="nav-sep">|</span>
  ${navLeft}
  <span class="nav-sep">|</span>
  <span class="nav-counter">${esc(myIndex + 1)} / ${esc(candidates.length)}</span>
  <span class="nav-sep">|</span>
  ${navRight}
</nav>
<main class="cand-page">
  ${renderHeader(candidate, deck, strings)}
  ${renderSummary(candidate)}
  ${renderCareerTable(candidate.careerHistory, strings)}
  ${renderInfoGrid(candidate.education, candidate.languages, strings)}
  ${renderHardFactorsScorecard(candidate, deck, strings)}
  ${renderTagBlock(strings.cpStrengths, candidate.strengths)}
  ${renderTagBlock(strings.cpRisks, candidate.risks, true)}
</main>`

  return `<!DOCTYPE html>
<html lang="${deck.locale}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(strings.cpMetaDescription)}">
<meta name="robots" content="noindex, nofollow">
${brandFontLinks}
<style>
${brandCss}
${globalCss}
${primitivesCss}
${candidatePageCss}
</style>
</head>
<body>
<div id="pc">
${renderConfidentialityBar(strings)}
${body}
${renderFooter(brand, strings)}
</div>
<script>
${allScripts}
</script>
</body>
</html>`
}
