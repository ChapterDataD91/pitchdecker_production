// ---------------------------------------------------------------------------
// Per-candidate profile page renderer — stub.
// Phase-D will flesh out: nav, header (photo/initials, name, score), summary,
// career table, education + languages, scorecard, strengths, risks.
//
// For Phase-A we return a minimal valid HTML doc with the brand chrome so the
// preview iframe can switch to a candidate page and see it render.
// ---------------------------------------------------------------------------

import type { Candidate, Deck } from '@/lib/types'
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
import { renderAvatar } from '../primitives/initials'

export function renderCandidate(
  candidate: Candidate,
  deck: Deck,
  slugMap: Map<string, string>,
  brand: Brand,
): string {
  const title = `${candidate.name} — ${deck.clientName || 'Proposal'}`

  const candidates = deck.sections.candidates.candidates
  const myIndex = candidates.findIndex((c) => c.id === candidate.id)
  const prev = myIndex > 0 ? candidates[myIndex - 1] : null
  const next = myIndex < candidates.length - 1 ? candidates[myIndex + 1] : null
  const prevSlug = prev ? slugMap.get(prev.id) ?? prev.id : null
  const nextSlug = next ? slugMap.get(next.id) ?? next.id : null

  const navLeft = prevSlug
    ? `<a href="${escAttr(prevSlug)}.html">← Previous</a>`
    : `<span class="nav-disabled">← Previous</span>`
  const navRight = nextSlug
    ? `<a href="${escAttr(nextSlug)}.html">Next →</a>`
    : `<span class="nav-disabled">Next →</span>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="Confidential candidate profile">
<meta name="robots" content="noindex, nofollow">
${brandFontLinks}
<style>
${brandCss}
${globalCss}
${primitivesCss}
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
  font-size: 36px; font-weight: 700;
  color: var(--navy);
  margin: 0 0 4px;
  line-height: 1.2;
}
.cand-page .header-info h2 {
  font-family: var(--serif);
  font-size: 18px; font-weight: 400;
  color: var(--txt2);
  margin: 0 0 8px;
}
.cand-page .header-score {
  flex-shrink: 0; text-align: right;
  font-family: var(--mono);
}
.cand-page .score-pct {
  font-size: 40px; font-weight: 700;
  color: var(--blue); line-height: 1;
}
.cand-page .score-label {
  font-size: 10px; letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--txt3);
  margin-top: 6px;
  font-family: var(--sans);
}
.cand-page .summary {
  padding: 20px 24px;
  background: rgba(212,232,242,.2);
  border-radius: 10px;
  border-left: 3px solid var(--blue);
  font-family: var(--sans);
  font-size: 15px; line-height: 1.7;
  margin-bottom: 28px;
}
</style>
</head>
<body>
<div id="pc">
${renderConfidentialityBar(brand)}
<nav class="cand-nav">
  <a href="../index.html">← Back to proposal</a>
  <span class="nav-sep">|</span>
  ${navLeft}
  <span class="nav-sep">|</span>
  <span class="nav-counter">${esc(myIndex + 1)} / ${esc(candidates.length)}</span>
  <span class="nav-sep">|</span>
  ${navRight}
</nav>
<main class="cand-page">
  <header class="header">
    ${renderAvatar({
      name: candidate.name || 'Candidate',
      photoUrl: candidate.photoUrl,
      sizePx: 120,
      shape: 'square',
    })}
    <div class="header-info">
      <h1>${esc(candidate.name || 'Candidate')}${candidate.age ? ` (${esc(candidate.age)})` : ''}</h1>
      <h2>${esc(candidate.currentRole || '')}${candidate.currentCompany ? ' at ' + esc(candidate.currentCompany) : ''}</h2>
    </div>
    <div class="header-score">
      <div class="score-pct">${esc(Math.round(candidate.overallScore || 0))}%</div>
      <div class="score-label">Hard factors score</div>
    </div>
  </header>
  <div class="summary">${esc(candidate.summary || 'Candidate profile — details coming in Phase D.')}</div>
  <div class="ot-empty">Career, scorecard, strengths &amp; risks — rendered in Phase D</div>
</main>
${renderFooter(brand)}
</div>
<script>
${allScripts}
</script>
</body>
</html>`
}
