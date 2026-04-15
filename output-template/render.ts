// ---------------------------------------------------------------------------
// Public render entry point.
//
// Takes a typed `Deck` and returns a `RenderResult`:
//   - html: the main index.html (one self-contained file)
//   - candidates: array of per-candidate HTML pages (slug + html)
//
// Pure, synchronous. Only imports from `@/lib/types` outside of this module.
// ---------------------------------------------------------------------------

import type { Deck } from '@/lib/types'

import { brand as defaultBrand, brandCss, brandFontLinks, globalCss } from './brand'
import type { Brand } from './brand'
import { primitivesCss } from './primitives'
import {
  renderHero,
  renderIntroSection,
  renderConfidentialityBar,
  renderFooter,
} from './primitives/hero'
import { allScripts } from './scripts'
import { renderAccordion } from './layout'
import type { RenderMode } from './layout'
import { ensureUniqueSlugs } from './slug'
import { renderCandidate } from './candidate/profile'
import { esc } from './primitives/escape'

export interface RenderedCandidate {
  slug: string
  html: string
}

export interface RenderResult {
  html: string
  candidates: RenderedCandidate[]
}

export interface RenderOptions {
  mode?: RenderMode // 'preview' | 'publish' (default: 'preview')
  brand?: Brand // override brand (for tests / future multi-tenant)
}

function renderMainHtml(
  deck: Deck,
  brand: Brand,
  slugMap: Map<string, string>,
  mode: RenderMode,
): string {
  const title = `${brand.name} — ${deck.clientName || 'Proposal'}`
  const description = `Strictly confidential executive search proposal${
    deck.clientName ? ' for ' + deck.clientName : ''
  }`

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="noindex, nofollow">
${brandFontLinks}
<style>
${brandCss}
${globalCss}
${primitivesCss}
</style>
</head>
<body>
<div id="pc">
${renderConfidentialityBar(brand)}
${renderHero(deck.sections.cover, brand)}
${renderIntroSection(deck.sections.cover, brand)}
<section class="secs"><div class="w">
${renderAccordion(deck, brand, slugMap, mode)}
</div></section>
<div style="text-align:center;padding:20px 0">
  <a href="#" onclick="window.scrollTo({top:0,behavior:'smooth'});return false" style="display:inline-block;width:40px;height:40px;border-radius:50%;background:var(--bg2);color:var(--txt3);text-decoration:none;line-height:40px;font-size:18px;transition:all .3s" onmouseover="this.style.background='var(--blue)';this.style.color='#fff'" onmouseout="this.style.background='var(--bg2)';this.style.color='var(--txt3)'">↑</a>
</div>
${renderFooter(brand)}
</div>
<script>
${allScripts}
</script>
</body>
</html>`
}

export function renderDeck(deck: Deck, options: RenderOptions = {}): RenderResult {
  const brand = options.brand ?? defaultBrand
  const mode: RenderMode = options.mode ?? 'preview'

  const slugMap = ensureUniqueSlugs(deck.sections.candidates.candidates)

  const html = renderMainHtml(deck, brand, slugMap, mode)

  const candidates: RenderedCandidate[] = deck.sections.candidates.candidates.map((c) => {
    const slug = slugMap.get(c.id) ?? c.id
    return {
      slug,
      html: renderCandidate(c, deck, slugMap, brand),
    }
  })

  return { html, candidates }
}
