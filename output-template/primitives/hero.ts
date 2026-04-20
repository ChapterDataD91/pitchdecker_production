// ---------------------------------------------------------------------------
// Hero chrome + hero banner image + intro section.
//
// Sequence (matches demo HTML L270-306):
//   1. Hero header (left: logo+badge+h1+tagline+meta+client-logo; right: hero image)
//   2. Hero banner (full-width, clip-path angled)
//   3. Sand-gradient divider
//   4. Intro section (client logo repeated + role-title label + intro paragraph)
//
// When clientLogoUrl is empty, the navy fallback block displays the client name
// in white uppercase (matches the demo's MedCore-logo treatment when the brand
// mark is text-only).
// ---------------------------------------------------------------------------

import type { Brand } from '../brand'
import type { CoverSection } from '@/lib/types'
import { esc, escAttr } from './escape'

export const heroCss = `
.hero {
  display: flex;
  min-height: 520px;
  background: var(--bg);
  overflow: hidden;
}
.hero-logo { width: 56px; height: 56px; display: block; margin-bottom: 28px; flex-shrink: 0; }
.hero-left { flex: 0 0 50%; display: flex; flex-direction: column; justify-content: center; padding: 64px 56px; }
.hero-right { flex: 0 0 40%; overflow: hidden; display: flex; align-items: center; justify-content: center; }
.hero-right img { width: 100%; height: 100%; object-fit: cover; object-position: center; display: block; }
.hero-right .hero-placeholder {
  width: 100%; height: 100%; min-height: 520px;
  background: linear-gradient(135deg, var(--bg2), var(--bg));
  display: flex; align-items: center; justify-content: center;
  color: var(--txt3); font-family: var(--sans); font-size: 13px;
  letter-spacing: 1.5px; text-transform: uppercase;
}
.hero h1 {
  font-family: var(--serif);
  font-size: 44px; font-weight: 400;
  color: var(--navy);
  line-height: 1.1;
  margin: 0 0 16px 0;
  letter-spacing: -.5px;
}
.hero h1 em { font-style: normal; color: var(--blue); }
.hero .sub {
  font-size: 15px; color: var(--txt2); font-weight: 400;
  line-height: 1.78; max-width: 480px;
  margin-bottom: 0;
  font-family: var(--serif);
}
.hero .badge {
  font-size: 16px; font-weight: 600; letter-spacing: .2px;
  color: var(--navy);
  margin-bottom: 6px;
  display: inline-block;
  font-family: var(--sans);
}
.hero .meta {
  margin-top: 28px;
  display: flex; gap: 32px;
  font-size: 15px; color: var(--txt3);
  font-family: var(--sans);
}
.hero .meta b { color: var(--navy); font-weight: 600; }

/* Client logo: real image OR navy fallback block. */
.hero .client-logo,
.intro-client-logo {
  height: 64px; width: auto; max-width: 300px;
  display: block; object-fit: contain;
}
.hero .client-logo { margin-top: 32px; align-self: flex-start; }
.intro-client-logo { margin: 0 0 24px 0; }

.client-logo-fallback {
  display: inline-flex; align-items: center; justify-content: center;
  height: 64px; padding: 0 28px; min-width: 180px;
  background: #2A384E;
  color: #fff;
  font-family: var(--sans);
  font-size: 14px; font-weight: 600;
  letter-spacing: 2.5px; text-transform: uppercase;
  border-radius: 6px;
}
.hero .client-logo-fallback { margin-top: 32px; align-self: flex-start; }
.intro .client-logo-fallback { margin-bottom: 24px; }

/* Full-width banner image, with the signature clip-path */
.hero-banner {
  position: relative; width: 100%;
  background: var(--bg);
  clip-path: polygon(0 calc(100vw * 0.0875), 100% 0, 100% calc(100% - 100vw * 0.0875), 0 100%);
}
.hero-banner img {
  width: 100%;
  height: calc(380px + 100vw * 0.175);
  object-fit: cover; object-position: center;
  display: block;
}
.hero-banner .hero-banner-placeholder {
  width: 100%;
  height: calc(380px + 100vw * 0.175);
  background: linear-gradient(135deg, var(--bg2), var(--sandl));
}

/* Thin sand-gradient divider under the banner */
.hero-divider {
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--sand), transparent);
  opacity: .4;
}

/* Intro section between banner and accordion */
.intro { padding: 72px 0 48px; }
.intro .role-label {
  font-family: var(--sans);
  font-size: 15px; font-weight: 500;
  color: var(--txt3);
  letter-spacing: 2px; text-transform: uppercase;
  margin: 16px 0 24px;
}
.intro p {
  font-size: 18px; color: var(--txt2);
  max-width: 680px;
  line-height: 1.78;
}
.intro p + p { margin-top: 14px; }
.intro .intro-divider {
  margin-bottom: 24px; padding-bottom: 24px;
  border-bottom: 1px solid var(--ln);
}

@media (max-width: 768px) {
  .hero { flex-direction: column; min-height: auto; }
  .hero-left { flex: none; width: 100%; padding: 40px 20px 32px; }
  .hero-right { flex: none; width: 100%; min-height: 220px; }
  .hero-right .hero-placeholder { min-height: 220px; }
  .hero h1 { font-size: 30px; letter-spacing: -.3px; }
  .hero .sub { font-size: 14px; max-width: 100%; }
  .hero .meta { flex-direction: column; gap: 10px; font-size: 13px; }
  .hero-logo { width: 44px; height: 44px; margin-bottom: 20px; }
  .client-logo, .client-logo-fallback { margin-top: 20px; }
  .hero-banner img, .hero-banner .hero-banner-placeholder { height: 220px; }
  .intro { padding: 40px 0 32px; }
  .intro p { font-size: 15px; }
}
@media (max-width: 480px) {
  .hero h1 { font-size: 26px; }
  .hero-left { padding: 32px 16px 24px; }
  .hero-banner img, .hero-banner .hero-banner-placeholder { height: 180px; }
  .client-logo-fallback { font-size: 12px; padding: 0 20px; min-width: 140px; height: 52px; }
}
`

/**
 * Renders the client logo if a URL exists, or a styled navy block bearing
 * the client name as a fallback. Returns empty string only if BOTH the URL
 * and the client name are absent (which would be an empty-cover edge case).
 */
function renderClientLogo(cover: CoverSection, location: 'hero' | 'intro'): string {
  if (cover.clientLogoUrl && cover.clientLogoUrl.trim() !== '') {
    const cls = location === 'hero' ? 'client-logo' : 'intro-client-logo'
    return `<img class="${cls}" src="${escAttr(cover.clientLogoUrl)}" alt="${escAttr(cover.clientName)} logo">`
  }
  if (!cover.clientName.trim()) return ''
  return `<div class="client-logo-fallback">${esc(cover.clientName)}</div>`
}

export function renderHero(cover: CoverSection, brand: Brand): string {
  const { stats } = cover
  const heroImage = cover.heroImageUrl?.trim()
    ? `<img src="${escAttr(cover.heroImageUrl)}" alt="${escAttr(cover.roleTitle)}">`
    : `<div class="hero-placeholder">Hero image</div>`

  const banner = cover.bannerImageUrl && cover.bannerImageUrl.trim() !== ''
    ? `<div class="hero-banner"><img src="${escAttr(cover.bannerImageUrl)}" alt="${escAttr(cover.clientName)}"></div>`
    : `<div class="hero-banner"><div class="hero-banner-placeholder"></div></div>`

  const tagline = cover.tagline?.trim()
    ? `<p class="sub">${esc(cover.tagline)}</p>`
    : ''

  return `<header class="hero">
  <div class="hero-left">
    <div class="hero-logo">${brand.logoSvg}</div>
    <div class="badge">Executive Search Proposal</div>
    <h1>${esc(cover.roleTitle || 'Role title')} for ${esc(cover.clientName || 'Client')}</h1>
    ${tagline}
    <div class="meta">
      <span><b>${esc(stats.criteriaCount)}</b> weighted criteria</span>
      <span><b>${esc(stats.timelineWeeks)} weeks</b> total timeline</span>
      <span><b>${esc(stats.candidateCount)}</b> candidate profiles</span>
    </div>
    ${renderClientLogo(cover, 'hero')}
  </div>
  <div class="hero-right">${heroImage}</div>
</header>
${banner}
<div class="hero-divider"></div>`
}

/**
 * Intro section between the hero banner and the accordion. Repeats the
 * client logo, shows the role-title label (Barlow uppercase), and renders
 * the longer introParagraph (split into multiple <p> on blank-line breaks).
 */
export function renderIntroSection(cover: CoverSection, _brand: Brand): string {
  const intro = cover.introParagraph?.trim()
  if (!intro && !cover.clientName.trim() && !cover.roleTitle.trim()) return ''

  const paragraphs = intro
    ? intro
        .split(/\n{2,}/)
        .map((block) => `<p>${esc(block.trim()).replace(/\n/g, '<br>')}</p>`)
        .join('')
    : ''

  const logo = renderClientLogo(cover, 'intro')
  const logoBlock = logo
    ? `<div class="intro-divider">${logo}</div>`
    : ''

  const roleLabel = cover.roleTitle.trim()
    ? `<div class="role-label">${esc(cover.roleTitle)}</div>`
    : ''

  return `<section class="intro"><div class="w">
${logoBlock}
${roleLabel}
${paragraphs}
</div></section>`
}

export function renderConfidentialityBar(brand: Brand): string {
  return `<div class="cb">${esc(brand.footer.confidentialityLabel)}</div>`
}

export function renderFooter(brand: Brand): string {
  const cities = brand.footer.cities
    .map((c, i) =>
      i === 0 ? esc(c) : `<span class="sep">|</span>${esc(c)}`,
    )
    .join(' ')
  return `<footer class="ft"><div class="w">
  <p style="margin-bottom:8px"><strong style="color:var(--navy)">${esc(brand.name)}</strong> <span style="color:var(--txt3)">— Executive Search</span></p>
  <p class="ft-cities">${cities}</p>
  <p class="ft-web"><a href="https://${escAttr(brand.footer.website)}" target="_blank" rel="noopener noreferrer" style="color:var(--sand);text-decoration:none;border-bottom:1px solid rgba(196,168,122,.3)">${esc(brand.footer.website)}</a></p>
  <p class="ft-conf">${esc(brand.footer.confidentialityLabel.toUpperCase())}</p>
</div></footer>`
}
