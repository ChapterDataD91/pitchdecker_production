# `/output-template/` — Client-facing deck renderer

This module renders a typed `Deck` into self-contained HTML files that are uploaded to Azure Blob by the publish flow and served behind PIN by an Azure Function. **It is a separate design system from the editor.**

## Design system firewall

- The editor (Notion-inspired: Inter, white bg, `#2563EB` accent) and the output template (Top of Minds huisstijl: coranto-2 serif, cream `#f5f1ea` bg, dusty-blue `#5a92b5`) share a repo but not a stylesheet.
- Files inside `/output-template/**` may **only** import from `@/lib/types`. No `@/components`, no `@/app`, no `@/lib/theme`, no Tailwind, no `next/font`.
- Files outside may only import from `@/output-template` (the barrel) — not from internal paths.
- Both rules are enforced by ESLint `no-restricted-imports`.

## Public API

```ts
import { renderDeck } from '@/output-template'

const result = renderDeck(deck, { mode: 'publish' }) // or 'preview'
// result.html                     ← index.html string
// result.candidates[i].slug       ← URL-safe slug
// result.candidates[i].html       ← candidates/{slug}.html string
```

`renderDeck` is a pure, synchronous function. It takes a `Deck` and returns strings. It does not fetch, upload, or touch the filesystem.

## Modes

- **`preview`** (default): every section is rendered, even empty ones — they show an "Empty section — rendered in Phase X" placeholder. Per-section render errors are caught and rendered as visible error blocks. Used by `/app/deck/[id]/preview/page.tsx`.
- **`publish`**: empty sections are omitted entirely and section-level errors propagate out. The publish route should gate on section completeness before calling; this mode is a last-line defence.

## Folder layout

```
brand.ts             Top of Minds identity: palette, typography, logo, footer, font <link>s, CSS custom properties
primitives/          Pure render helpers + scoped CSS blocks
  escape.ts          HTML escaping — ALL user-supplied strings must route through esc()
  hero.ts            Hero header, confidentiality bar, footer
  accordion.ts       Section shell (.sec / .sh / .sb)
  callout.ts         .bx, .gd, .cd, .cols, .lb
  personCard.ts      Team / consultant card (.tc)
  personaCard.ts     Persona archetype card (.pr + pool-size badges)
  candidateCard.ts   Candidate grid card (.cand-card)
  table.ts           Generic data table (.tb)
  scorecard.ts       Selection Scorecard table (.sc)
  timelineItem.ts    Vertical timeline
  scoreBar.ts        Animated score bar
  initials.ts        Avatar with initials fallback
  index.ts           Barrel + aggregated primitivesCss
sections/            One file per accordion section — pure function (data, brand, …) → string
candidate/
  profile.ts         Per-candidate page renderer
scripts/             Vanilla JS strings inlined into <script> at render time
layout.ts            Section order, dispatcher, accordion composer
slug.ts              Candidate slug generation with collision handling
render.ts            Public entry — assembles head + body into final HTML
index.ts             Public barrel (re-exports renderDeck + types only)
```

## Adding a section (Phase B+)

1. Open the relevant file under `sections/`.
2. Replace the `sectionPlaceholder(...)` call with real `esc()`-escaped HTML composed from `primitives/`.
3. If a primitive is missing, add it to `primitives/` and append its CSS to `primitives/index.ts`.
4. If the section exposes a field that's not yet in `@/lib/types`, schema-gap it: add the field to `lib/types.ts` + its Zod schema + the editor, then reference it here.

## Multi-tenant (future)

Not yet. When a second recruiter is onboarded:
1. `git mv output-template output-templates/topofminds`
2. Copy to `output-templates/{new-brand}`; change `brand.ts`, `brandCss`, swap divergent section renderers.
3. Add a `template` option to `renderDeck(deck, { template: 'topofminds' })`.

Do not generalise earlier — the abstraction should emerge from the second concrete case, not from guessing.

## Visual target

`/Users/daan/PitchDecker/Top of Minds — PitchDecker Demo Proposal.html` is the authoritative demo. Where `.claude/skills/deck-template/huisstijl-reference.md` disagrees with the demo, the demo wins (the doc will be updated in Phase E).
