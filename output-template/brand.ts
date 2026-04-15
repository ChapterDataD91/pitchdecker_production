// ---------------------------------------------------------------------------
// Top of Minds — client-facing deck brand.
//
// SINGLE SOURCE OF TRUTH for the output template's visual identity.
// Do NOT reach into the editor's design system (@/lib/theme, Tailwind, etc.).
//
// Values extracted from:
//   /Users/daan/PitchDecker/Top of Minds — PitchDecker Demo Proposal.html
// The demo proposal is the authoritative visual target (supersedes
// .claude/skills/deck-template/huisstijl-reference.md where they disagree).
// ---------------------------------------------------------------------------

export interface BrandPalette {
  bg: string
  bg2: string
  navy: string
  navy2: string
  blue: string
  blueLight: string
  bluePale: string
  sand: string
  sandLight: string
  text: string
  textMuted: string
  textSubtle: string
  line: string
  white: string
  warn: string
}

export interface BrandTypography {
  serif: string
  sans: string
  mono: string
  bodyLineHeight: number
}

export interface BrandFooter {
  cities: string[]
  website: string
  confidentialityLabel: string
}

export interface Brand {
  name: string
  legalName: string
  logoSvg: string
  palette: BrandPalette
  typography: BrandTypography
  typekitKitId: string
  googleFontsHref: string
  footer: BrandFooter
}

// ---------------------------------------------------------------------------
// Top of Minds logo (inline SVG, from the demo hero)
// ---------------------------------------------------------------------------

const TOP_OF_MINDS_LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 447.9 447.9"><defs><style>.tom-st0{fill:#2a384e}.tom-st1{fill:#fff}</style></defs><rect class="tom-st1" width="447.9" height="447.9"/><rect class="tom-st0" x="6.6" y="6.6" width="434.8" height="434.8"/><g><polygon class="tom-st1" points="309.6 338.4 272.7 338.4 272.7 247.1 271.2 247.1 227 322.5 217.3 322.5 173.1 247.1 172.2 247.1 172.2 338.4 138.3 338.4 138.3 182.8 171.4 182.8 223.1 269.6 223.6 269.6 275.1 182.8 309.6 182.8 309.6 338.4"/><polygon class="tom-st1" points="309.6 143.9 254.3 143.9 223.2 196.2 192 143.9 138.3 143.9 138.3 109.5 309.6 109.5 309.6 143.9"/></g></svg>`

// ---------------------------------------------------------------------------
// Brand object
// ---------------------------------------------------------------------------

export const brand: Brand = {
  name: 'Top of Minds',
  legalName: 'Top of Minds Executive Search',
  logoSvg: TOP_OF_MINDS_LOGO,
  palette: {
    bg: '#f5f1ea',
    bg2: '#ede8df',
    navy: '#111111',
    navy2: '#1a1a1a',
    blue: '#5a92b5',
    blueLight: '#d4e8f2',
    bluePale: '#e8f2f8',
    sand: '#c4a87a',
    sandLight: '#d4bc94',
    text: '#111111',
    textMuted: '#1a1a1a',
    textSubtle: '#333333',
    line: '#ddd7cc',
    white: '#ffffff',
    warn: '#c4694a',
  },
  typography: {
    serif: `coranto-2, Georgia, serif`,
    sans: `'Barlow', 'Inter', 'Outfit', sans-serif`,
    mono: `'JetBrains Mono', monospace`,
    bodyLineHeight: 1.78,
  },
  typekitKitId: 'kvo1vdg',
  googleFontsHref:
    'https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
  footer: {
    cities: ['Amsterdam', 'Rotterdam', 'Frankfurt', 'Madrid'],
    website: 'www.topofminds.com',
    confidentialityLabel: 'Strictly Confidential',
  },
}

// ---------------------------------------------------------------------------
// <link>/<meta> tags for <head>
// ---------------------------------------------------------------------------

export const brandFontLinks: string = `<link rel="stylesheet" href="https://use.typekit.net/${brand.typekitKitId}.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${brand.googleFontsHref}" rel="stylesheet">`

// ---------------------------------------------------------------------------
// CSS custom properties (:root) — semantic tokens consumed by all CSS below
// ---------------------------------------------------------------------------

export const brandCss: string = `:root {
  --bg: ${brand.palette.bg};
  --bg2: ${brand.palette.bg2};
  --navy: ${brand.palette.navy};
  --navy2: ${brand.palette.navy2};
  --blue: ${brand.palette.blue};
  --bl: ${brand.palette.blueLight};
  --blp: ${brand.palette.bluePale};
  --sand: ${brand.palette.sand};
  --sandl: ${brand.palette.sandLight};
  --txt: ${brand.palette.text};
  --txt2: ${brand.palette.textMuted};
  --txt3: ${brand.palette.textSubtle};
  --ln: ${brand.palette.line};
  --wh: ${brand.palette.white};
  --rd: ${brand.palette.warn};
  --serif: ${brand.typography.serif};
  --sans: ${brand.typography.sans};
  --mono: ${brand.typography.mono};
}`

// ---------------------------------------------------------------------------
// Base/global CSS — reset + body + confidentiality bar + footer.
// Matches the demo proposal HTML exactly so sections drop in as-is.
// ---------------------------------------------------------------------------

export const globalCss: string = `
body { margin: 0; padding: 0; background: var(--bg); scroll-behavior: smooth; }

@keyframes pageLoad { from { opacity: 0 } to { opacity: 1 } }

#pc { animation: pageLoad .6s ease; }
#pc, #pc * { font-style: normal !important; }
#pc * { box-sizing: border-box; }

#pc {
  font-family: var(--serif);
  color: var(--txt);
  line-height: 1.78;
  font-size: 19px;
  background: var(--bg);
  -webkit-font-smoothing: antialiased;
  font-variant-ligatures: common-ligatures discretionary-ligatures;
  font-feature-settings: "liga" 1, "dlig" 1, "kern" 1;
}

#pc p { font-size: 19px; color: var(--txt2); line-height: 1.8; margin-bottom: 20px; }

/* Content wrapper */
.w { max-width: 1040px; margin: 0 auto; padding: 0 44px; }

/* Confidentiality bar */
.cb {
  background: #2A384E;
  padding: 14px 0;
  text-align: center;
  font-size: 13px;
  letter-spacing: .3px;
  color: rgba(255,255,255,.75);
  font-weight: 400;
  font-family: var(--serif);
}

/* Reading progress bar (inserted at runtime by scripts/progressBar) */
.progress-bar {
  position: fixed;
  top: 0; left: 0;
  height: 2px;
  background: var(--blue);
  z-index: 999;
  transition: width .1s;
  opacity: .6;
}

/* Footer */
.ft {
  background: var(--wh);
  color: var(--txt3);
  padding: 56px 0;
  text-align: center;
  font-size: 14px;
  line-height: 1.8;
  border-top: 1px solid var(--ln);
  font-style: normal;
}
.ft a { color: var(--navy); text-decoration: none; }
.ft .ft-cities { font-family: var(--sans); font-size: 14px; color: var(--navy); margin-bottom: 4px; }
.ft .ft-cities .sep { margin: 0 10px; font-size: 10px; vertical-align: middle; color: var(--navy); }
.ft .ft-web { font-family: var(--sans); font-size: 14px; margin-bottom: 32px; }
.ft .ft-conf { font-family: var(--sans); font-size: 13px; font-weight: 700; color: var(--navy); margin-top: 16px; }

/* Print */
@media print {
  #pc { background: #fff !important; }
  .cb, .hero, .ft, .progress-bar { display: none !important; }
  body { background: #fff !important; }
  a { color: inherit !important; text-decoration: none !important; }
  .w { max-width: 100%; padding: 0 20px; }
}
`
