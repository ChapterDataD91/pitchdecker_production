# PitchDecker

**Pitch deck authoring tool for Top of Minds** — an executive search firm that creates pitch decks for search mandates. Consultants use PitchDecker to build structured, professional pitch decks that present their team, methodology, candidate profiles, and fee proposals to prospective clients.

---

## Table of Contents

- [Overview](#overview)
- [User Experience](#user-experience)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Deck Sections](#deck-sections)
- [AI Integration](#ai-integration)
- [Output Template](#output-template)
- [Publishing & Deployment](#publishing--deployment)
- [API Reference](#api-reference)
- [Data Layer](#data-layer)
- [Design System](#design-system)
- [External Services](#external-services)
- [Roadmap](#roadmap)

---

## Overview

PitchDecker is a full-stack Next.js application that replaces manual pitch deck creation with a guided, section-by-section editor. Each pitch deck contains 11 structured sections — from cover page to fee proposal — that together form a complete search mandate presentation.

The app is two distinct surfaces sharing one repository:

1. **The editor** — Notion-inspired authoring tool (this is what consultants use).
2. **The output template** — the published, client-facing pitch deck in the Top of Minds huisstijl, generated from a typed `Deck` object and deployed to Azure Blob behind a PIN-gated Function viewer.

The two are deliberately firewalled: separate design systems, separate brand objects, no styling crosses the boundary (enforced by `no-restricted-imports` in ESLint).

**Current status:** Editor + AI assists + MongoDB persistence + output template + publish round-trip are all functional. Image upload UI and editor surfaces for a few new schema fields (assessment add-ons, candidate strengths/risks) are the remaining backlog items — see `docs/refactors/`.

---

## User Experience

### Dashboard

When a consultant opens PitchDecker, they land on a dashboard showing all their pitch decks. Each deck card displays the client name, role title, completion progress (e.g., "4/11 sections complete"), and status. A **"+ New Deck"** button opens a modal where the consultant enters a client name and role title to create a new deck.

### Deck Editor

The editor uses a **sidebar + content area** layout:

- **Left sidebar (240px):** Lists all 11 deck sections with numbered labels and completion indicators (checkmark for complete, colored dot for in-progress, empty for untouched). A progress bar at the top shows overall completion. Clicking a section instantly switches the content area.

- **Top bar:** Shows the deck title (click to edit inline), section completion count, and a real-time save status indicator ("Saved" / "Saving..." with animated pulse).

- **Content area:** Displays the active section's editor. Each section has its own specialized editor component tailored to its content type. Changes auto-save with a 500ms debounce — there is no save button.

### Section Editor Types

Consultants interact with five distinct editor patterns:

| Pattern | Sections | How it works |
|---------|----------|--------------|
| **Database pickers** | Team, Credentials | Slide-out panels with search and filter to select from existing data (e.g., search Algolia for consultants, query `cicero_mcp` for placements) |
| **Structured input** | Search Profile, Scorecard | Categorized lists with weighted criteria; AI assists for suggestion + bulk accept |
| **Upload + enrichment** | Candidates | Upload CV, parse with AI, score against the scorecard |
| **Template-based** | Timeline, Assessment | Start from a template (e.g., 12-week search, Hogan assessor preset), adjust inline |
| **Simple forms** | Cover, Salary, Fee | Form fields with optional benchmarks |

### AI Assistance

AI is woven throughout the editor, not just one section:

- **Search Profile:** Multi-modal suggest panel (text / document / voice / web search) returns weighted criteria.
- **Scorecard, Personas, Timeline, Credentials:** Each has a "suggest" endpoint that uses the existing deck context to propose new entries.
- **Team:** AI-assisted bio rewrite that tightens copy without losing facts.
- **Candidates:** CV upload → structured profile parsing → automatic scoring against the deck's scorecard.
- **Salary:** Benchmark lookup against comparable roles.
- **Companies / placements:** Match against published Top of Minds pages and the cicero MCP placement index.
- **Conversational chat:** Embedded chat that can call the cicero MCP toolset to answer free-form questions about the mandate.

All AI responses use **Claude** (`claude-sonnet-4-6` for text and structured tool use; an image-capable model for document analysis).

### Preview

`/deck/[id]/preview` renders the actual published-deck HTML inside a sandboxed iframe, with editor chrome (back button, candidate-page switcher) wrapped around it. Because the iframe is sandboxed with its own document, the output template's CSS cannot leak into the editor and vice versa. The consultant sees exactly what the client will see.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router, Turbopack) | 16.2.2 |
| UI | React | 19.2.4 |
| Language | TypeScript (strict) | 5.x |
| Editor styling | Tailwind CSS | 4.x |
| Output template styling | Inline `<style>` (no Tailwind) | — |
| Animation | Framer Motion (editor only) | 12.38.0 |
| Drag & Drop | @dnd-kit (core + sortable) | 6.3.1 / 10.0.0 |
| State | Zustand | 5.0.12 |
| Forms | React Hook Form + Zod | 7.72.0 / 4.3.6 |
| AI | Anthropic SDK (`@anthropic-ai/sdk`) | 0.82.0 |
| MCP client | `@modelcontextprotocol/sdk` | 1.29.0 |
| Document parsing | pdf-parse, mammoth | 2.4.5 / 1.12.0 |
| Audio transcription | AssemblyAI | 4.29.0 |
| Persistent storage | MongoDB Node driver | 7.1.1 |
| Postgres client | `pg` | 8.20.0 |
| Azure auth | `@azure/identity` | 4.13.1 |
| IDs | uuid | 13.0.0 |

**No UI libraries** — all editor components (modals, badges, toasts, slide-out panels) are custom-built. The output template is dependency-free HTML + inline CSS + inline JS — no React, no bundler.

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- A reachable `cicero_mcp` server (the upstream MCP for placements, candidate enrichment, and `deployPitchdeck`). Locally: clone `cicero_mcp` and run with `SKIP_AUTH=true`.
- A MongoDB connection (Atlas or local) for deck persistence.

### Environment Variables

Create a `.env.local` file with the required keys:

```env
# AI features
ANTHROPIC_API_KEY=your_anthropic_key
ASSEMBLYAI_API_KEY=your_assemblyai_key

# Algolia consultant search
ALGOLIA_APP_ID=your_algolia_app_id
ALGOLIA_API_KEY=your_algolia_api_key
ALGOLIA_CDN_BASE=https://cdn.media.topofminds.index.nl/

# Cicero MCP (placements, deploy)
CICERO_URL=http://localhost:3001/mcp     # or the deployed Container Apps URL
SKIP_AUTH_TO_CICERO=true                 # dev only

# MongoDB
MONGODB_URI=mongodb+srv://...
MONGODB_DB=pitchdecker
```

### Run Locally

```bash
npm install
npm run dev
```

Or use the provided startup script:

```bash
./start-local.sh
```

The app runs at `http://localhost:3000`.

### Build for Production

```bash
npm run build
npm run start
```

### Lint

```bash
npm run lint
```

---

## Project Structure

```
pitchdecker_production/
├── app/
│   ├── layout.tsx                          # Root layout (Inter font, metadata from config/brand.ts)
│   ├── page.tsx                            # Dashboard — deck list & creation
│   ├── globals.css                         # Global styles & Tailwind imports
│   ├── deck/
│   │   └── [id]/
│   │       ├── page.tsx                    # Deck editor (sidebar + content)
│   │       └── preview/
│   │           ├── page.tsx                # Server component — fetches deck, renders via @/output-template
│   │           └── PreviewShell.tsx        # Client iframe wrapper with sandbox + candidate switcher
│   └── api/
│       ├── ai/
│       │   ├── analyze-text/route.ts                 # Text → Claude suggestions
│       │   ├── analyze-document/route.ts             # File upload → Claude analysis
│       │   ├── transcribe/route.ts                   # Audio → AssemblyAI transcript
│       │   ├── web-search/route.ts                   # Web search → Claude analysis
│       │   ├── chat/route.ts                         # Conversational chat (calls cicero MCP tools)
│       │   ├── search-profile/suggest/route.ts       # Suggest must-haves / nice-to-haves
│       │   ├── scorecard/suggest/route.ts            # Suggest leadership / success-factor criteria
│       │   ├── personas/suggest/route.ts             # Suggest 3 archetype profiles
│       │   ├── timeline/suggest-phases/route.ts      # Suggest 12-week phase template
│       │   ├── credentials/suggest-axes/route.ts     # Suggest credential axes
│       │   ├── credentials/find-placements/route.ts  # Query cicero MCP for matching placements
│       │   ├── team/rewrite-bio/route.ts             # Tighten consultant bios
│       │   └── candidate/score/route.ts              # Score uploaded candidate against scorecard
│       ├── analytics/[id]/route.ts                   # View tracking (stub)
│       ├── benchmark/salary/route.ts                 # Salary benchmark lookup
│       ├── companies/match/route.ts                  # Match company name to published Top of Minds page
│       ├── consultants/route.ts                      # Algolia consultant search
│       ├── deck/
│       │   ├── route.ts                              # GET list / POST create
│       │   └── [id]/
│       │       ├── route.ts                          # GET / PUT / DELETE deck
│       │       ├── documents/route.ts                # GET / POST context documents
│       │       ├── documents/[docId]/route.ts        # DELETE single document
│       │       └── sections/[sectionType]/route.ts   # GET / PUT section data
│       ├── publish/[id]/route.ts                     # Render deck → upload via cicero deployPitchdeck
│       └── upload/candidate/route.ts                 # CV upload + parse
│
├── components/
│   ├── ai/                                 # AI input & suggestion UI
│   ├── editor/
│   │   ├── SectionHeader.tsx
│   │   └── sections/                       # 11 section editors
│   │       ├── CoverEditor.tsx
│   │       ├── TeamEditor.tsx
│   │       ├── SearchProfileEditor.tsx
│   │       ├── SalaryEditor.tsx
│   │       ├── CredentialsEditor.tsx
│   │       ├── TimelineEditor.tsx
│   │       ├── AssessmentEditor.tsx
│   │       ├── PersonasEditor.tsx
│   │       ├── ScorecardEditor.tsx
│   │       ├── CandidatesEditor.tsx
│   │       ├── FeeEditor.tsx
│   │       ├── candidates/                 # CV upload + candidate detail panel
│   │       │   ├── UploadZone.tsx
│   │       │   └── CandidateDetailPanel.tsx
│   │       └── team/
│   │           ├── ConsultantPicker.tsx    # Algolia search slide-out
│   │           └── TeamMemberCard.tsx      # Draggable team card
│   ├── layout/
│   │   ├── Shell.tsx                       # Main layout wrapper
│   │   ├── TopBar.tsx                      # Deck title, save status, navigation
│   │   ├── ProgressBar.tsx                 # Animated completion bar
│   │   └── Sidebar.tsx                     # Section nav, reads brand from @/config/brand
│   └── ui/                                 # Shared primitives (Badge, Toast, SlideOutPanel, etc.)
│
├── output-template/                        # Client-facing deck renderer (firewalled from editor)
│   ├── brand.ts                            # Top of Minds huisstijl tokens, fonts, logo SVG
│   ├── render.ts                           # Public entry — renderDeck(deck) → { html, candidates[] }
│   ├── index.ts                            # Barrel — only `renderDeck` and brand re-exported
│   ├── layout.ts                           # Section dispatcher + accordion order
│   ├── slug.ts                             # Candidate slug generator (collision-safe)
│   ├── primitives/                         # Pure render helpers + scoped CSS blocks
│   ├── sections/                           # 11 section renderers, one file each
│   ├── candidate/profile.ts                # Per-candidate page renderer
│   ├── scripts/                            # Inlined vanilla JS (accordion, progress bar, animations)
│   └── README.md                           # Firewall rules and adding-a-section guide
│
├── config/
│   └── brand.ts                            # Editor-side identity (sidebar label, page title)
│
├── docs/
│   └── refactors/                          # Backlog: cicero deploy one-call, Mongo handoff, image pipeline
│
├── lib/
│   ├── types.ts                            # TypeScript interfaces — single source of truth for Deck shape
│   ├── theme.ts                            # Editor design tokens (Tailwind-aligned)
│   ├── ai-types.ts                         # AI suggestion & response types
│   ├── deck-storage.ts                     # MongoDB-backed deck CRUD (preserves sync helper API)
│   ├── ai/
│   │   ├── claude-client.ts                # Anthropic SDK wrapper
│   │   └── prompts.ts                      # System prompts for Claude
│   ├── db/
│   │   └── mongodb.ts                      # Singleton Mongo client
│   ├── mcp/
│   │   ├── cicero-client.ts                # MCP client singleton (HTTP transport)
│   │   ├── cicero-auth.ts                  # Auth header builder
│   │   └── deploy-pitchdeck.ts             # Typed wrapper for cicero `deployPitchdeck` + SAS upload loop
│   ├── hooks/
│   │   ├── useAIPanel.ts
│   │   └── useAudioRecorder.ts
│   ├── store/
│   │   ├── editor-store.ts                 # Zustand: deck state + auto-save
│   │   └── dashboard-store.ts              # Zustand: deck list state
│   └── validators/                         # Zod schemas (kept in sync with lib/types.ts)
│
├── .claude/                                # Claude Code context, skills, and plans
├── eslint.config.mjs                       # no-restricted-imports firewall between editor & output-template
├── package.json
├── next.config.ts
├── tsconfig.json
├── start-local.sh                          # Local dev startup
└── start-docker.sh                         # Docker startup
```

---

## Architecture

### Two design systems, one repo

The editor and the published deck are visually and architecturally separate:

| Surface | Design system | Lives in | Imports allowed |
|---------|--------------|----------|-----------------|
| Editor | Notion-inspired (white bg, Inter, blue `#2563EB`) | `app/`, `components/`, `lib/`, `config/brand.ts` | NOT `@/output-template/*` (only the barrel `@/output-template`) |
| Output template | Top of Minds huisstijl (cream `#f5f1ea`, coranto-2, dusty-blue `#5a92b5`) | `output-template/` | ONLY `@/lib/types`. No `@/components`, no `@/lib/theme`, no Tailwind, no `next/font`. |

Enforced by `no-restricted-imports` in `eslint.config.mjs`. The two brand objects (`config/brand.ts` for editor chrome, `output-template/brand.ts` for the published deck) are independent — changing one does not affect the other.

### Data Flow

```
User Input → Component → Zustand Store → API Route → MongoDB
                                ↑                        ↓
                          Auto-save (500ms debounce)   Response

Publish:
Editor → POST /api/publish/[id] → renderDeck(deck) → cicero MCP deployPitchdeck →
        Azure Blob (SAS upload) → returns viewer URL + PIN to consultant.
```

1. **Components** receive section data as props and call `onChange` on edits.
2. **Editor Store** (Zustand) updates local state immediately (optimistic) and debounces a PUT request per section (500ms).
3. **API Routes** validate input and delegate to the storage layer.
4. **Storage** uses MongoDB (`lib/db/mongodb.ts` singleton + `lib/deck-storage.ts` adapter). Each deck = one document; sections are nested.
5. **Publish** fetches the deck server-side, calls `renderDeck` (pure function in `output-template/`), and routes the resulting HTML files through `lib/mcp/deploy-pitchdeck.ts` which calls the cicero MCP and PUTs each file to the returned SAS URL.

### State Management

Two Zustand stores manage editor application state (the published deck has no client-side state):

**`useEditorStore`** — active deck editing:
- `deck`, `activeSection`, `saveStatus`, `updateSection`, `getSectionStatus`
- Per-section debounce timers prevent concurrent edits from interfering

**`useDashboardStore`** — deck list:
- `decks`, `fetchDecks`, `createDeck(clientName, roleTitle)`

### Operational gotchas

- **Next.js 16 + Turbopack module isolation.** Server components and API route handlers compile into separate module graphs in dev. Module-level state (e.g. an in-memory `Map`) is NOT shared between them. The Mongo-backed storage layer sidesteps this entirely; both surfaces reach the same external store.
- **Turbopack stale dev cache.** Editing a file imported transitively by a server component sometimes does not propagate without a full dev restart. Symptom: rendered output shows old content despite the source being correct. Fix: kill the dev process, `rm -rf .next`, restart `npm run dev`.

---

## Deck Sections

Each pitch deck contains 11 sections, presented in a fixed order:

| # | Section | Type | Description | Completion Rule |
|---|---------|------|-------------|-----------------|
| 1 | **Cover** | Simple form | Client name, role title, tagline, intro paragraph, hero/banner/logo image | Both client name and role title filled |
| 2 | **Team** | Database picker | Lead team + network members from Algolia consultant index | At least 1 lead team member |
| 3 | **Search Profile** | Structured input + AI | Must-have and nice-to-have criteria with weights (1-5) + personality profile | At least 1 must-have criterion |
| 4 | **Salary** | Simple form | Base range, bonus, LTIP, benefits, other compensation | Base salary low > 0 |
| 5 | **Credentials** | Database picker | Track-record axes; placements queried from cicero MCP | At least 1 axis with placements |
| 6 | **Timeline** | Template-based | Process phases (active + holiday) with durations and confidentiality note | At least 1 phase |
| 7 | **Assessment** | Template-based | Provider-agnostic pillars (Hogan preset), assessor card, optional sample report + MT add-on | Assessor name + at least 1 pillar + process description |
| 8 | **Personas** | Structured input + AI | 3 archetypes with pool-size badges (narrow/moderate/strong) | At least 1 archetype |
| 9 | **Scorecard** | Structured input + AI | Weighted criteria across 4 categories (Must-Haves / Nice-to-Haves / Leadership / Success Factors) | At least 1 criterion in any category |
| 10 | **Candidates** | Upload + enrichment | Sample shortlist with scores, rankings, strengths, risks; renders to per-candidate pages in the published deck | At least 1 candidate |
| 11 | **Fee Proposal** | Simple form | Flat fee + currency + instalments[] + guarantee months + optional add-ons | `fee.amount > 0` |

---

## AI Integration

### How It Works

The AI pipeline uses **Claude** (Anthropic) to analyze consultant-provided content and extract structured suggestions across multiple sections. For domain queries (placements, company matches), the Claude chat tool calls the cicero MCP server.

```
Input (text/doc/voice/web/section-context) → API Route → Claude (+ MCP tools) → Structured Suggestions → User Review → Section Data
```

### Per-section AI surfaces

| Section | Endpoint | Behaviour |
|---------|----------|-----------|
| Search Profile | `/api/ai/search-profile/suggest`, `/api/ai/analyze-text`, `/api/ai/analyze-document`, `/api/ai/transcribe`, `/api/ai/web-search` | Multi-modal suggest (text/document/voice/web). Returns weighted criteria with reasoning. |
| Scorecard | `/api/ai/scorecard/suggest` | Suggest leadership and success-factor criteria from the existing search profile. |
| Personas | `/api/ai/personas/suggest` | Generate 3 archetype profiles with pool sizes. |
| Timeline | `/api/ai/timeline/suggest-phases` | Propose a 12-week phase template tailored to the mandate. |
| Credentials | `/api/ai/credentials/suggest-axes`, `/api/ai/credentials/find-placements` | Suggest credential axes; query cicero MCP for matching placements. |
| Team | `/api/ai/team/rewrite-bio` | Tighten consultant bios without losing facts. |
| Candidates | `/api/ai/candidate/score`, `/api/upload/candidate` | Parse uploaded CV → score against scorecard → return enriched candidate object. |
| Cross-section | `/api/ai/chat` | Conversational chat with full cicero MCP toolset; can search placements, candidates, jobs across the firm. |

### Suggestion Structure

Each AI suggestion includes:

```typescript
interface AISuggestion {
  id: string;
  text: string;
  weight: 1 | 2 | 3 | 4 | 5;
  category: 'mustHave' | 'niceToHave';
  reasoning?: string;
  status: 'pending' | 'accepted' | 'dismissed';
}
```

### Claude Configuration

- **Model:** `claude-sonnet-4-6` (text/web/structured tool use); image-capable model for document analysis
- **Tool patterns:** `provide_suggestions` with forced tool choice for structured output; cicero MCP toolset auto-loaded for chat
- **Context-aware prompts:** Include client name, role title, and existing section data for deduplication
- **Web search:** `web_search_20250305` tool (max 5 searches per request)

---

## Output Template

`/output-template/` is a separate module that renders a typed `Deck` object into a self-contained HTML document plus per-candidate HTML pages. It has its own brand object, its own CSS, and its own scripts. Nothing from the editor's design system crosses the boundary.

### Public API

```ts
import { renderDeck } from '@/output-template'

const result = renderDeck(deck, { mode: 'publish' }) // or 'preview'
// result.html                     ← index.html string
// result.candidates[i].slug       ← URL-safe slug
// result.candidates[i].html       ← candidates/{slug}.html string
```

`renderDeck` is a pure, synchronous function. It does not fetch, upload, or touch the filesystem.

### Modes

- **`preview`** (default): every section is rendered, even empty ones — they show a placeholder. Per-section render errors are caught and rendered as visible error blocks. Used by `/app/deck/[id]/preview/page.tsx`.
- **`publish`**: empty sections are omitted entirely and section-level errors propagate out.

### Multi-tenant

Deliberately not built. When a second recruiter is onboarded, fork `/output-template/` to `/output-templates/{tenant}/` rather than introducing a generic brand/template engine speculatively. See `output-template/README.md` for the migration sketch.

---

## Publishing & Deployment

### Publish flow

1. Consultant clicks Publish → `POST /api/publish/[id]`.
2. Route fetches the deck from MongoDB.
3. Validates: every section's `sectionStatuses[key] !== 'empty'`. Returns `400` with `emptySections[]` if not.
4. Calls `renderDeck(deck, { mode: 'publish' })` → `{ html, candidates[] }`.
5. Calls `publishDeckArtifacts()` which:
   - invokes the cicero MCP `deployPitchdeck` tool with the client name,
   - receives `{ viewer_url, pin, upload_url, sas_token, expires_in_days }`,
   - PUTs `index.html` + `candidates/{slug}.html` to the SAS URL with `x-ms-blob-type: BlockBlob`.
6. Returns `{ viewerUrl, pin, expiresInDays }` to the consultant.

The viewer URL points at an Azure Function (`/view/{token}`) that serves the HTML behind the PIN. The Function lives in the upstream `cicero_mcp` infrastructure.

### Backlog

See `docs/refactors/`:
- **`cicero-mcp-deploy-one-call.md`** — collapse the two-step (call MCP, then PUT files) into a single tool call where MCP handles the upload server-side.
- **`image-upload-pipeline.md`** — the upload UI for hero/banner/logo/team-non-Algolia/candidate photos. Today these render as initials / gradient placeholders.
- **`mongodb-deck-storage.md`** — handoff doc for the original Mongo migration (already executed; kept for reference).

---

## API Reference

### Deck Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/deck` | List all decks |
| POST | `/api/deck` | Create deck (`{ clientName, roleTitle }`) |
| GET | `/api/deck/[id]` | Get full deck |
| PUT | `/api/deck/[id]` | Update deck metadata |
| DELETE | `/api/deck/[id]` | Delete deck |
| GET | `/api/deck/[id]/sections/[type]` | Get section |
| PUT | `/api/deck/[id]/sections/[type]` | Update section |
| GET | `/api/deck/[id]/documents` | List context documents |
| POST | `/api/deck/[id]/documents` | Upload context document |
| DELETE | `/api/deck/[id]/documents/[docId]` | Remove a context document |

### AI & Analysis

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/analyze-text` | Text → Claude suggestions |
| POST | `/api/ai/analyze-document` | File upload → Claude suggestions |
| POST | `/api/ai/transcribe` | Audio → AssemblyAI transcript |
| POST | `/api/ai/web-search` | Web search → Claude suggestions |
| POST | `/api/ai/chat` | Conversational chat (cicero MCP tools available) |
| POST | `/api/ai/search-profile/suggest` | Suggest must-haves / nice-to-haves |
| POST | `/api/ai/scorecard/suggest` | Suggest leadership / success-factor criteria |
| POST | `/api/ai/personas/suggest` | Suggest 3 archetype profiles |
| POST | `/api/ai/timeline/suggest-phases` | Suggest 12-week phase template |
| POST | `/api/ai/credentials/suggest-axes` | Suggest credential axes |
| POST | `/api/ai/credentials/find-placements` | Query cicero MCP for matching placements |
| POST | `/api/ai/team/rewrite-bio` | Tighten consultant bio |
| POST | `/api/ai/candidate/score` | Score candidate against scorecard |

### Other

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/api/consultants?q=...` | Search Algolia for consultants | Live |
| GET | `/api/companies/match?q=...` | Match company name to published Top of Minds page | Live |
| GET | `/api/benchmark/salary?...` | Salary benchmark lookup | Live |
| POST | `/api/upload/candidate` | Upload + parse CV | Live |
| POST | `/api/publish/[id]` | Render deck → upload via cicero deployPitchdeck | Live |
| GET | `/api/analytics/[id]` | View analytics | Stub |

---

## Data Layer

### MongoDB-backed storage

Decks live in MongoDB (collection `pitchdecker`, one document per deck). The document mirrors the `Deck` interface verbatim, with `_id` duplicating `Deck.id` (UUID).

`lib/deck-storage.ts` exposes the same API surface as the original in-memory layer:

- `getAll()` — returns deck summaries with computed completion counts
- `get(id)`, `create(id, clientName, roleTitle)`, `update(id, partial)`, `delete(id)`
- `getSection(deckId, sectionKey)`, `updateSection(deckId, sectionKey, data)` — section-level CRUD with merge semantics
- `isSectionComplete(deck, sectionId)`, `computeCompletedSections(deck)` — pure helpers, sync

The Mongo client itself is a singleton in `lib/db/mongodb.ts` (lazy connect, reused across requests).

### Why Mongo (and not the in-memory `Map`)

Two reasons:
1. **Persistence across dev restarts.** In-memory storage was wiping every code change.
2. **Next.js + Turbopack module isolation.** Server components and API route handlers got separate `Map` instances in dev — a deck POSTed to one was invisible to the other. External storage sidesteps this entirely.

### Postgres + Blob

Postgres clients are wired (`pg`) for future bronze/silver/gold tier reads. Azure Blob Storage is used by the publish flow indirectly (via cicero MCP) — the editor itself does not write to blob.

---

## Design System

### Editor visual direction

Clean, modern, Notion-meets-Linear aesthetic. White background, cool greys, blue accent. The tool should feel calm, spacious, and respectful of the consultant's time.

### Editor colors

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#FFFFFF` | Page background |
| Text | `#111827` | Primary text (near-black) |
| Text Secondary | `#6B7280` | Labels, descriptions |
| Accent | `#2563EB` | Interactive elements, links, buttons |
| Border | `#E5E7EB` | Subtle dividers |
| Success | `#059669` | Completion indicators |
| Warning | `#D97706` | Caution states |
| Error | `#DC2626` | Error states |

**Functional colors** (8 pairs for tags and categories): sand, sage, rose, lilac, slate, sienna, teal, copper.

### Editor typography

- **Font:** Inter (geometric sans-serif, loaded via `next/font`)
- **Headings:** Semibold/bold
- **Body:** Regular weight
- **Sizes:** 12px (xs) through 48px (4xl)

### Output-template visual direction

Authoritative tokens live in `output-template/brand.ts` — these are the Top of Minds huisstijl, completely separate from the editor's design system:

- Background: cream `#f5f1ea`
- Primary text: near-black `#111111`
- Accent: dusty blue `#5a92b5`
- Sand: `#c4a87a`
- Fonts: coranto-2 (Adobe Typekit, headings + body); Barlow (UI labels); JetBrains Mono (numbers, scores)
- Cards use `border-radius` 10–12px; badges 3–6px; circles 50%

The `.claude/skills/deck-template/huisstijl-reference.md` document is historical reference only — where it disagrees with the demo HTML or `output-template/brand.ts`, the latter wins.

### Animation

Editor uses Framer Motion with consistent curves:

| Curve | Values | Usage |
|-------|--------|-------|
| Content | `[0.16, 1, 0.3, 1]` | Page transitions, content swaps |
| Slide-out | `[0.32, 0.72, 0, 1]` | Panel entrances |
| Fade | `[0.4, 0, 0.2, 1]` | Opacity transitions |

| Duration | Value | Usage |
|----------|-------|-------|
| Micro | 150ms | Button states, hover |
| Layout | 200ms | Section transitions |
| Overlay | 300ms | Modals, slide-outs |

The output template uses vanilla CSS keyframes + IntersectionObserver — no Framer Motion. Lives in `output-template/scripts/`.

### Key UI Patterns

- **Auto-save:** No save button. Status indicator shows "Saved" / "Saving..." / error
- **Empty states:** Every list has a helpful empty state with description and CTA
- **Loading states:** `LoadingDots` component for all async operations
- **Slide-out panels:** Right-sliding panels with backdrop for pickers and AI panel
- **Drag-and-drop:** `@dnd-kit` with pointer + keyboard sensors, visual drag handles

---

## External Services

| Service | Purpose | Integration | Status |
|---------|---------|-------------|--------|
| **Anthropic Claude** | Text analysis, web search, image analysis, chat | `@anthropic-ai/sdk` | Live |
| **AssemblyAI** | Audio transcription | `assemblyai` | Live |
| **Algolia** | Consultant search index, company match | REST API (fetch) | Live |
| **MongoDB** | Persistent deck storage | `mongodb` driver | Live |
| **Cicero MCP** | Placement queries, candidate enrichment, `deployPitchdeck` | `@modelcontextprotocol/sdk` over HTTP | Live |
| **Azure Blob Storage** | Published deck hosting | Indirect (via cicero `deployPitchdeck` → SAS upload) | Live |
| **Azure Function viewer** | Serves published HTML behind PIN at `/view/{token}` | Lives in cicero_mcp infrastructure | Live |
| **Azure PostgreSQL** | Bronze/silver/gold data tier reads | `pg` (wired, not yet used by app) | Planned |
| **Bullhorn** | ATS / CRM integration | Not yet connected | Planned |
| **Getty Images** | Stock photography for hero/banner | Not yet connected | Planned (depends on image upload pipeline) |

---

## Roadmap

### Done

- Dashboard with deck list and creation
- Sidebar + content area editor layout
- All 11 section editors functional (most with AI assist)
- Auto-save with debounced persistence
- AI suggest endpoints across Search Profile, Scorecard, Personas, Timeline, Credentials, Team, Candidates
- Cross-section conversational chat with cicero MCP tools
- Algolia consultant search and company match
- MongoDB persistence for decks
- Output template (`/output-template/`) — full huisstijl render of all 11 sections + per-candidate pages
- Preview iframe with sandbox isolation
- Publish workflow: render → cicero MCP `deployPitchdeck` → SAS upload → viewer URL + PIN
- Editor / output-template firewall via ESLint
- Editor brand config (`config/brand.ts`) decoupled from output brand

### In flight / backlog

See `docs/refactors/`:
- **Image upload pipeline** — UI for hero / banner / client logo / team (non-Algolia) / candidate photos. Today these render as initials or gradient placeholders.
- **Cicero MCP deploy refactor** — collapse the two-step contract (call MCP, then PUT files) into one server-side call.
- **Editor UI for new schema fields** — `AssessmentEditor` doesn't yet expose `sampleReport` / `mtAssessment` / `providerName` UI; `CandidatesEditor` doesn't yet have UI for `strengths` / `risks`. The fields exist in the schema and render correctly when populated via API.

### Not yet planned

- Postgres data tier integration (bronze/silver/gold reads)
- Bullhorn CRM
- View analytics tracking
- Multi-tenant — deferred until a second recruiter exists; the firewall and brand-config split keep that path open.

---

## Development Notes

### Scripts

```bash
npm run dev      # Start dev server (Next.js with Turbopack hot reload)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint with Next.js + TypeScript rules + firewall rules
```

### Key Conventions

- **Two design systems, one repo.** Editor (Tailwind + Inter + Notion palette) and output template (inline CSS + coranto-2 + huisstijl) share no styling. ESLint enforces.
- **No mock data in editor surfaces.** API routes return empty arrays/objects when no data exists; UI shows proper empty states. (The `/output-template/` renders placeholders for missing images, but never fakes content.)
- **No UI libraries** — every editor component is custom-built; the output template is dependency-free HTML.
- **Strict TypeScript** — no `any` types allowed.
- **All editor colors via theme** — never hardcoded hex values in editor files. The output template owns its own palette in `output-template/brand.ts`.
- **Desktop-first responsive** — mobile support from the start.
- **Auto-save everything** — no manual save buttons anywhere.
- **Cross-tenant abstractions are deliberately deferred** until a second client exists.

### Path Aliases

`@/*` maps to the project root, so imports look like:

```typescript
import { useEditorStore } from '@/lib/store/editor-store';
import { Badge } from '@/components/ui/Badge';
import { renderDeck } from '@/output-template'; // barrel only — internal paths are firewalled
import { editorBrand } from '@/config/brand';
```

---

Built for [Top of Minds](https://topofminds.com) — executive search, reimagined.
