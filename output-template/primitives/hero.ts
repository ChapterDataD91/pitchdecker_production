// ---------------------------------------------------------------------------
// Hero chrome + hero banner image.
// Renders the big opening block: left side (logo, badge, title, sub, meta),
// right side (hero illustration), followed by the full-width clipped banner.
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
.hero-right img { width: 100%; height: 100%; object-fit: contain; object-position: center; display: block; }
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
.hero .client-logo {
  height: 64px; width: auto; max-width: 300px;
  display: block; margin-top: 32px;
  object-fit: contain; align-self: flex-start;
}

/* Full-width banner image, with the signature clip-path */
.hero-banner {
  position: relative; width: 100%;
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

@media (max-width: 768px) {
  .hero { flex-direction: column; min-height: auto; }
  .hero-left { flex: none; width: 100%; padding: 40px 20px 32px; }
  .hero-right { flex: none; width: 100%; min-height: 220px; }
  .hero-right .hero-placeholder { min-height: 220px; }
  .hero h1 { font-size: 30px; letter-spacing: -.3px; }
  .hero .sub { font-size: 14px; max-width: 100%; }
  .hero .meta { flex-direction: column; gap: 10px; font-size: 13px; }
  .hero-logo { width: 44px; height: 44px; margin-bottom: 20px; }
  .client-logo { height: 140px; margin-top: 20px; }
  .hero-banner img, .hero-banner .hero-banner-placeholder { height: 220px; }
}
@media (max-width: 480px) {
  .hero h1 { font-size: 26px; }
  .hero-left { padding: 32px 16px 24px; }
  .hero-banner img, .hero-banner .hero-banner-placeholder { height: 180px; }
}
`

export function renderHero(cover: CoverSection, brand: Brand): string {
  const { stats } = cover
  const heroImage = cover.heroImageUrl?.trim()
    ? `<img src="${escAttr(cover.heroImageUrl)}" alt="${escAttr(cover.roleTitle)}">`
    : `<div class="hero-placeholder">Hero image</div>`

  // NOTE: cover.bannerImageUrl is a Phase-B schema addition. Guarded here so
  // the shell renders cleanly against Phase-A types.
  const bannerUrl = (cover as unknown as { bannerImageUrl?: string }).bannerImageUrl
  const banner = bannerUrl && bannerUrl.trim() !== ''
    ? `<div class="hero-banner"><img src="${escAttr(bannerUrl)}" alt="${escAttr(cover.clientName)}"></div>`
    : ''

  const clientLogoUrl = (cover as unknown as { clientLogoUrl?: string }).clientLogoUrl
  const clientLogo = clientLogoUrl && clientLogoUrl.trim() !== ''
    ? `<img class="client-logo" src="${escAttr(clientLogoUrl)}" alt="${escAttr(cover.clientName)} logo">`
    : ''

  return `<header class="hero">
  <div class="hero-left">
    <div class="hero-logo">${brand.logoSvg}</div>
    <div class="badge">Executive Search Proposal</div>
    <h1>${esc(cover.roleTitle || 'Role title')} for ${esc(cover.clientName || 'Client')}</h1>
    <p class="sub">${esc(cover.introParagraph || '')}</p>
    <div class="meta">
      <span><b>${esc(stats.criteriaCount)}</b> weighted criteria</span>
      <span><b>${esc(stats.timelineWeeks)} weeks</b> total timeline</span>
      <span><b>${esc(stats.candidateCount)}</b> candidate profiles</span>
    </div>
    ${clientLogo}
  </div>
  <div class="hero-right">${heroImage}</div>
</header>
${banner}
<div class="hero-divider"></div>`
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
