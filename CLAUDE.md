# Pitch Deck Builder — Authoring Tool

## What this is
The interface consultants at Top of Minds (executive search firm) use to
CREATE pitch decks for search mandates. This is the builder/editor tool,
not the client-facing output.

## Design Direction
- Clean, modern, Notion-inspired — not cold SaaS, not warm/cream either
- Think: Notion meets Linear — calm, spacious, precise
- White background (#FFFFFF) with near-black text (#111827)
- Blue accent (#2563EB) for interactive states, links, and buttons
- Cool grey (#6B7280) for secondary text, subtle borders (#E5E7EB)
- Functional color family (sand, sage, rose, lilac, slate, sienna, teal, copper)
  for tags, categories, and grouping
- Inter font for everything (geometric sans-serif, loaded via next/font)
- Feels fast and responsive — no lag, no unnecessary steps
- The tool should feel like it respects the consultant's time

## Tech Stack
- Next.js 16+ (App Router), React 18, TypeScript
- Tailwind CSS with custom theme (design tokens in tailwind.config)
- Framer Motion for transitions (slide-outs, content swaps, drags)
- @dnd-kit for drag-and-drop (criteria reorder, candidate ranking)
- Zustand for editor state
- React Hook Form + Zod for form validation
- Data from real SQL (Azure) and MongoDB databases via API routes and MCP tools

## Project Structure
```
/app
  /page.tsx                       # Dashboard — list of decks
  /deck/[id]/page.tsx             # Deck editor (sidebar + content)
  /deck/[id]/preview/page.tsx     # Preview mode
  /api/
    /deck/[id]/route.ts           # Deck CRUD
    /deck/[id]/sections/          # Per-section data endpoints
    /publish/[id]/route.ts        # Generate + publish to Blob
    /upload/candidate/route.ts    # CV/LinkedIn upload + parsing
    /analytics/[id]/route.ts      # View tracking

/components
  /layout/
    Shell.tsx                     # Main layout wrapper
    TopBar.tsx                    # Deck title, back, preview, save status
    ProgressBar.tsx               # Overall completion indicator
    Sidebar.tsx                   # Section navigation (fixed left panel)

  /editor/
    SectionHeader.tsx             # Section title + description in content area
    /sections/                    # One editor component per deck section
      CoverEditor.tsx
      TeamEditor.tsx
      SearchProfileEditor.tsx
      SalaryEditor.tsx
      CredentialsEditor.tsx
      TimelineEditor.tsx
      AssessmentEditor.tsx
      PersonasEditor.tsx
      ScorecardEditor.tsx
      CandidatesEditor.tsx
      FeeEditor.tsx

  /ui/                            # Shared UI primitives
    Badge.tsx
    ScoreIndicator.tsx
    PersonCard.tsx
    SlideOutPanel.tsx
    Toast.tsx
    LoadingDots.tsx
    EmptyState.tsx

/lib
  types.ts                        # TypeScript interfaces for all sections
  theme.ts                        # Design tokens
  store/                          # Zustand stores
    editor-store.ts
    dashboard-store.ts
  hooks/                          # Custom hooks for data fetching, state
  validators/                     # Zod schemas

/public
  /team/                          # Team member photos (dev only — prod uses CDN)
  /candidates/                    # Candidate photos (dev only — prod uses CDN)
```

## Rules
- All data flows through typed API routes — never create mock JSON files,
  seed scripts, or fake data fixtures
- If a database is not yet connected, API routes return empty arrays/objects
  and the UI shows proper empty states — never hardcode sample data as a workaround
- Every section editor component receives data as props + onChange callback
- No UI libraries (no shadcn, no Material UI) — custom components only
- Typography: Inter (geometric sans-serif) loaded via next/font for all text.
  Semibold/bold for headings, regular for body. No serif fonts.
- All colors via CSS variables or Tailwind theme extension — never hardcoded hex
- Framer Motion for all animations
- Strict TypeScript — no `any` types
- Mobile responsive from the start (desktop-first design)
- Auto-save everything — no save button. Status indicator: "Saved" / "Saving..."
- Every interactive element needs hover, focus, and active states
- Every async action needs loading, success, and error states
- Every list needs an empty state (helpful, not just blank)

## Interaction Model
Sidebar + content editor: a fixed left sidebar (~240px) listing all 11 deck
sections with completion indicators. Clicking a section shows its editor in
the main content area on the right. Only one section visible at a time.
The sidebar provides instant navigation and always-visible progress. Section types:

- **Database pickers** (Team, Credentials): slide-out panels with search/filter
- **Structured input** (Search Profile, Scorecard): categorized lists with weights
- **Upload + enrichment** (Candidates): upload CV/LinkedIn → parse → review → score
- **Template-based** (Timeline, Assessment): start from template, adjust inline
- **Simple forms** (Salary, Fee, Cover): form fields, optional benchmarks

## What NOT to do
- Don't anchor to the Cicero Vacancy Writer — we're deliberately starting fresh
- Don't make it look like a dashboard — it should feel editorial
- Don't generate fake/mock data — always query real databases
- Don't use generic UI libraries — every component is custom
- Don't skip loading/empty/error states
- Don't use warm/cream colors — the palette is clean white and cool grey
- Don't use serif fonts — Inter is the only typeface
