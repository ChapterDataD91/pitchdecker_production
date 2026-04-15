# Top of Minds — Huisstijl

> ⚠️ **Deprecated as source of truth.** This document was captured from an
> earlier prototype (`proposal-tuesday-3.html`, March 2026) and has since
> drifted from the actual demo proposal. Where this file disagrees with the
> live demo at `/Users/daan/PitchDecker/Top of Minds — PitchDecker Demo
> Proposal.html`, **the demo wins**.
>
> The authoritative tokens (palette, fonts, spacing) now live in:
>
> - `/output-template/brand.ts` — runtime token values (`--blue: #5a92b5`,
>   etc.)
> - `/output-template/primitives/*.ts` — per-component CSS
>
> Notable corrections vs. the text below:
> - Accent blue is **`#5a92b5`** (dusty mid-blue), not `#B9D9EB` (pale).
> - Cards, callouts, and tags **do** use `border-radius` (10–12px on cards,
>   3–6px on badges, 50% on circles). Section §7's "no border-radius" rule
>   is wrong.
> - `.tc` cards have `border: 1px solid var(--ln)`; the "no borders" rule
>   in §7 is also wrong.
>
> Keep this file as historical reference for the broader brand voice
> (typography, image conventions, tone of voice) — but for any token or
> visual decision, read `/output-template/brand.ts` first.

---

Vastgelegd op basis van `proposal-tuesday-3.html` en `CLAUDE.md` (maart 2026).

---

## 1. Kleurpalet

### Proposal (interactief HTML-voorstel)

| Variabele | Hexcode | Gebruik |
|-----------|---------|---------|
| `--bg` | `#F5F5EF` | Paginaachtergrond |
| `--navy` | `#2A384E` | Primaire tekstkleur, koppen |
| `--navy2` | `#2A384E` | Secundaire tekstkleur |
| `--blue` | `#B9D9EB` | Accentkleur (hover, iconen, links) |
| `--bl` | `#B9D9EB` | Lichtblauwe achtergrond (tags) |
| `--sand` | `#c4a87a` | Zandgoud accent (gradiënt, decoratief) |
| `--txt` | `#2A384E` | Bodytekst |
| `--txt2` | `#2A384E` | Lichte bodytekst |
| `--txt3` | `#2A384E` | Subtitels, labels, metadata |
| `--btn` | `#E1E3E0` | Buttons op zandachtergrond |
| `--wh` | `#ffffff` | Wit (kaarten, achtergronden) |
| `--rd` | `#FF9466` | Rood/oranje accent (waarschuwingen) |
| `--danger` | `#B34747` | Verwijderen, delete knoppen, gevaar |
| Confidential bar | `#2A384E` | Donkerblauwe topbalk |

### Kandidaatpagina's

| Kleur | Hexcode | Gebruik |
|-------|---------|---------|
| Donkerblauw (primair) | `#2a384e` | Achtergronden, primaire knoppen |
| Donkerblauw tint | `#4a6287` | Links, labels |
| Zand/achtergrond | `#f5f5ef` | Paginaachtergrond |
| Donker zand | `#e7e7d9` | Secundaire achtergrond |
| Lichtblauw (accent) | `#B9D9EB` | Accentkaarten |
| Buttonkleur | `#E1E3E0` | Buttons op zandachtergrond |
| Grijs | `#7c8188` | Subtitels, footertekst |
| Oranje accent | `rgba(255,148,102,0.4)` | Decoratief, niet functioneel |

---

## 2. Typografie

### Lettertypen

| Lettertype | Type | Gebruik | Importbron |
|------------|------|---------|------------|
| **coranto-2** | Serif | Koppen, titels, namen | Adobe Fonts (niet via Google Fonts) |
| **Barlow** | Sans-serif | Body, UI, labels, navigatie | Google Fonts |
| **Roboto Mono** | Monospace | Scores, data, nummers | Google Fonts |

Google Fonts import (voor Barlow en Roboto Mono):
```
https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;500;600;700&family=Roboto+Mono:wght@400;500;600;700&display=swap
```

### Groottes & gewichten (proposal)

| Element | Familie | Grootte | Gewicht |
|---------|---------|---------|---------|
| Hero `h1` | coranto-2 | 44px | 400 |
| Sectietitel `.st` | coranto-2 | 26px | 400 |
| Kandidaatnaam `.tc-name` | coranto-2 | 19px | 400 |
| Body `.sb p` | coranto-2/Barlow | 17px | 400 |
| Intro body | Barlow | 16.5px | 400 |
| Label `.lb` | Barlow | 10px | 700 (uppercase, 2.5px spacing) |
| Rol `.tc-role` | Barlow | 12px | 600 (uppercase, 1.5px spacing) |
| Sectienummer `.sn` | Roboto Mono | 12px | 600 |
| Data `.ts` | Roboto Mono | 13px | — |
| Tag `.tg` | — | 9.5px | 600 (uppercase, 1px spacing) |

### Groottes & gewichten (kandidaatpagina's)

| Element | Familie | Grootte |
|---------|---------|---------|
| Naam/kop | coranto-2 | — (nooit bold) |
| Bodytekst | Barlow | Min. 22px (liefst groter) |
| Data/scores | Roboto Mono | — |

### Typografische regels

- **coranto-2 altijd `font-weight: 400`** — nooit bold
- **Geen italics** — uitzondering: coranto-2 italic alleen voor citaten/quotes
- **Geen ALL CAPS** — uitzondering: kleine labels (uppercase met ruime letter-spacing)
- `line-height: 1.78` voor bodytekst in het proposal
- `line-height: 1.7` voor Barlow bodytekst op kandidaatpagina's
- Font-feature-settings voor koppen: `"liga" 1, "dlig" 1, "kern" 1`
- `-webkit-font-smoothing: antialiased` op het hoofdelement

---

## 3. Layout & Grid

| Instelling | Waarde |
|------------|--------|
| Max-breedte content | `920px` |
| Horizontale padding | `44px` (desktop), `20px` (mobiel) |
| Container klasse | `.w { max-width: 920px; margin: 0 auto; padding: 0 44px }` |

### Sectiestructuur (accordion)

- `.sec` — volledige sectie (border-top + border-bottom)
- `.sh` — klikbare sectieheader (padding: 36px 0; hover: padding-left: 8px)
- `.sl` — header links (icoon + titel samen, gap: 20px)
- `.sn` — sectienummer (cirkel 42×42px, Roboto Mono)
- `.st` — sectietitel (coranto-2, 26px)
- `.sb` — sectieinhoud (padding-left: 56px bij open)
- `.sv` — chevron-icoon (180° rotatie bij open)

---

## 4. Componenten

### Kaarten

#### Teamkaart `.tc`
```css
background: #fff;
border-radius: 12px;
border: 1px solid var(--ln);
overflow: hidden;
transition: all .3s;
```
Hover: `border-color: var(--blue); box-shadow: 0 12px 32px rgba(22,45,70,.08)`

#### Tekstblok `.bx` (quote/callout)
```css
background: #fff;
border-left: 3px solid var(--blue);
padding: 24px 28px;
border-radius: 0 12px 12px 0;
box-shadow: 0 2px 8px rgba(0,0,0,.04);
```

#### Zandblok `.gd`
```css
background: linear-gradient(135deg, rgba(196,168,122,.07), rgba(196,168,122,.02));
border: 1px solid rgba(196,168,122,.18);
padding: 22px 26px;
border-radius: 10px;
```

#### Kolomkaart `.cd`
```css
background: #fff;
padding: 26px;
border-radius: 10px;
border: 1px solid var(--ln);
```

#### Kandidaatkaart `.pr`
Hover: `border-color: var(--blue); box-shadow: 0 4px 16px rgba(90,146,181,.06); border-left: 3px solid var(--blue)`

### Tijdlijn `.tl`
- Verticale lijn: `left: 18px; width: 2px; background: var(--ln)`
- Tijdlijn-dot `.td`: cirkel 38×38px, `border: 2px solid var(--blue)`, Roboto Mono

### Tags `.tg`
| Klasse | Achtergrond | Tekstkleur |
|--------|-------------|------------|
| `.t1` (groen) | `#daf0ea` | `#1a6b5a` |
| `.t2` (blauw) | `#B9D9EB` | `#2e5d8b` |
| `.t3` (oranje) | `#f0e4d4` | `#8b5a2e` |

### Tabel `.tb`
- Header: 10px, 700, uppercase, 1.5px letter-spacing
- Even rijen: `background: rgba(245,241,234,.5)`
- Hover: `background: rgba(90,146,181,.06)`
- Hover-overgang: `.2s transition`

### Score-balk `.svb`
- Hoogte: 12px, `border-radius: 6px`
- Achtergrond: `var(--bg2)`
- Vulling: `linear-gradient(90deg, var(--blue), var(--sand))`
- Animatie: `fillIn .8s ease-out`

### Footer `.ft`
```css
background: #fff;
padding: 56px 0;
text-align: center;
border-top: 1px solid var(--ln);
font-size: 14px;
```
Logo: `height: 110px`

---

## 5. Animaties

| Animatie | Definitie | Toepassing |
|----------|-----------|------------|
| `pageLoad` | `from { opacity: 0 } to { opacity: 1 }` | Paginacontainer (0.6s ease) |
| Sectie-openingsingang | `opacity: 0 → 1; translateY(24px → 0)` | `.sec` (0.7s ease) |
| Accordion open/dicht | `max-height 0 → 12000px` | `.sb` (0.55s cubic-bezier(.4,0,.2,1)) |
| Chevron rotatie | `rotate(0 → 180deg)` | `.sv` (0.35s cubic-bezier) |
| Score-balk | `right: 80% → 20%` | `.svb-fill` (0.8s ease-out) |
| Voortgangsbalk | `width` via scroll | `position: fixed; top: 0; height: 2px` |

---

## 6. Foto's & afbeeldingen

### Kandidaatfoto's (kandidaatpagina's)
- Formaat: **160×160px, vierkant**
- Geen `border-radius` — altijd rechthoekig/vierkant

### Teamfoto's (proposal)
- Hoogte: `240px`, `object-fit: cover`
- Positie: `object-position: center 40%`

### Hero-afbeelding
- Clip-path: `polygon(0 calc(100vw * 0.0875), 100% 0, 100% calc(100% - 100vw * 0.0875), 0 100%)`
- Hoogte: `calc(380px + 100vw * 0.175)`

### Logos
- Klantlogo in intro: `height: 220px`
- Top of Minds footer-logo: `height: 110px`

---

## 7. Hoeken & borders

- **Geen borders** — we gebruiken nooit borders op elementen
- **Geen afgeronde hoeken** — we gebruiken nooit `border-radius` op elementen; alles is strak en rechthoekig

---

## 8. Persona labels (kandidaatpagina's)

| Persona | Criteria | Kleur |
|---------|----------|-------|
| Health-Tech | healthcare ≥ 3 EN tech ≥ 3 | `#4a6287` |
| SaaS Leader | tech ≥ 4 EN CEO ≥ 4 | `#2a384e` |
| Buy & Build | M&A ≥ 3 EN PE ≥ 3 | `#7c8188` |
| Health Innovator | healthcare ≥ 3 | `#4a6287` |
| Tech CEO | tech ≥ 3 | `#4a6287` |
| Growth CEO | CEO ≥ 4 | `#2a384e` |
| Generalist | overig | `#7c8188` |

---

## 9. Tone of voice

- Professioneel maar warm en persoonlijk
- Niet corporate-stijf, wel serieus
- Beknopt en to-the-point
- **Engels** voor internationale klanten, **Nederlands** voor lokale markt
- Geen jargon; gebruik actieve zinnen

---

## 10. Printmodus

Bij afdrukken (`@media print`):
- Achtergrond wordt wit
- `.cb`, `.hero`, `.ft`, `.print-btn` worden verborgen
- Alle secties worden uitgevouwen (`.sb` wordt zichtbaar)
- Max-breedte: `100%`, padding: `0 20px`
- Links behouden tekstkleur, geen onderstreping

---

## 11. Responsive (mobiel ≤ 768px)

- Horizontale padding: `20px`
- Confidential bar: `12px 20px`, `10px` font
- Teamgrid en kolomgrid: `1fr` (stacked)
- Hero: gestapelde layout

---

## 12. CSS-klassenreferentie

| Klasse | Omschrijving |
|--------|-------------|
| `.w` | Content-wrapper (max 920px) |
| `.cb` | Confidential topbalk (donkerblauw) |
| `.hero` | Hero/headerblok |
| `.badge` | Opdrachtlabel boven hero |
| `.intro` | Introtekstblok |
| `.secs` | Container voor alle accordeonsecties |
| `.sec` | Individuele sectie |
| `.sh` | Sectieheader (klikbaar) |
| `.sn` | Sectienummer (cirkel) |
| `.st` | Sectietitel |
| `.sb` | Sectieinhoud (verborgen/zichtbaar) |
| `.sv` | Chevron-icoon in sectieheader |
| `.team` | Teamkaartenrij (2-koloms grid) |
| `.tc` | Teamkaart |
| `.tc-img` | Teamfoto |
| `.tc-name` | Teamnaam (coranto-2) |
| `.tc-role` | Teamrol (uppercase, blauw) |
| `.tc-bio` | Teambiografie |
| `.lb` | Sectielabel (uppercase, blauw) |
| `.bx` | Callout/citaatblok (blauw-linker-border) |
| `.gd` | Zand-achtergrondblok |
| `.cols` | 2-koloms grid |
| `.cd` | Kolomkaart |
| `.tb` | Tabel |
| `.tg` | Tag/badge |
| `.t1/.t2/.t3` | Tagkleuren (groen/blauw/oranje) |
| `.tl` | Tijdlijn-container |
| `.ti` | Tijdlijn-item |
| `.td` | Tijdlijn-dot (cirkel) |
| `.pr` | Kandidaatkaart (proposal) |
| `.sv2` | Score-visualisatieblok |
| `.svb` | Score-balk container |
| `.svb-fill` | Score-balkopvulling (gradient) |
| `.ft` | Footer |
