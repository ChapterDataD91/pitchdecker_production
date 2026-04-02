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
- [API Reference](#api-reference)
- [Data Layer](#data-layer)
- [Design System](#design-system)
- [External Services](#external-services)
- [Roadmap](#roadmap)

---

## Overview

PitchDecker is a full-stack Next.js application that replaces manual pitch deck creation with a guided, section-by-section editor. Each pitch deck contains 11 structured sections — from cover page to fee proposal — that together form a complete search mandate presentation.

The tool is designed for internal use by Top of Minds consultants. It is **not** the client-facing output (that will be a separate published HTML template in a later phase).

**Current status:** Phase 1 — the editor UI, AI-assisted content generation, and in-memory storage are functional. Database persistence, publishing, and the client-facing template are planned for subsequent phases.

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
| **Database pickers** | Team, Credentials | Slide-out panels with search and filter to select from existing data (e.g., search Algolia for consultants) |
| **Structured input** | Search Profile, Scorecard | Categorized lists with weighted criteria, add/remove/reorder |
| **Upload + enrichment** | Candidates | Upload CV or LinkedIn URL, parse with AI, review and score |
| **Template-based** | Timeline, Assessment | Start from a template, adjust inline |
| **Simple forms** | Cover, Salary, Fee | Form fields with optional benchmarks |

### AI Assistance

The Search Profile editor includes an **AI Assist** panel that slides in from the right. Consultants can feed context through four input modes:

1. **Text** — Paste a job description, briefing notes, or any text
2. **Document** — Upload a PDF, DOCX, or image (max 10MB)
3. **Voice** — Record audio that gets transcribed via AssemblyAI
4. **Web Search** — Enter a query; Claude searches the web for relevant context

Claude analyzes the input and returns structured suggestions — each with a text, weight (1-5), category (must-have / nice-to-have), and reasoning. Consultants review suggestions individually or in bulk (Accept All / Dismiss All). Accepted suggestions are added directly to the appropriate section column.

### Preview

A preview page exists at `/deck/[id]/preview` but is currently a placeholder. Phase 3 will implement the client-facing pitch deck output using the Top of Minds brand template.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.2 |
| UI | React | 19.2.4 |
| Language | TypeScript (strict) | 5.x |
| Styling | Tailwind CSS | 4.x |
| Animation | Framer Motion | 12.38.0 |
| Drag & Drop | @dnd-kit (core + sortable) | 6.3.1 / 10.0.0 |
| State | Zustand | 5.0.12 |
| Forms | React Hook Form + Zod | 7.72.0 / 4.3.6 |
| AI | Anthropic SDK (@anthropic-ai/sdk) | 0.82.0 |
| Transcription | AssemblyAI | 4.29.0 |
| Document parsing | pdf-parse, mammoth | 2.4.5 / 1.12.0 |
| IDs | uuid | 13.0.0 |

**No UI libraries** — all components (modals, badges, toasts, slide-out panels) are custom-built.

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Environment Variables

Create a `.env.local` file with the required API keys:

```env
# Required for AI features
ANTHROPIC_API_KEY=your_anthropic_key
ASSEMBLYAI_API_KEY=your_assemblyai_key

# Required for consultant search
ALGOLIA_APP_ID=your_algolia_app_id
ALGOLIA_API_KEY=your_algolia_api_key
ALGOLIA_CDN_BASE=https://cdn.media.topofminds.index.nl/
```

### Run Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Or use the provided startup script:

```bash
chmod +x start-local.sh
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
│   ├── layout.tsx                          # Root layout (Inter font, metadata)
│   ├── page.tsx                            # Dashboard — deck list & creation
│   ├── globals.css                         # Global styles & Tailwind imports
│   ├── deck/
│   │   └── [id]/
│   │       ├── page.tsx                    # Deck editor (sidebar + content)
│   │       └── preview/
│   │           └── page.tsx                # Preview placeholder (Phase 3)
│   └── api/
│       ├── ai/
│       │   ├── analyze-document/route.ts   # File upload → Claude analysis
│       │   ├── analyze-text/route.ts       # Text → Claude suggestions
│       │   ├── transcribe/route.ts         # Audio → AssemblyAI transcript
│       │   └── web-search/route.ts         # Web search → Claude analysis
│       ├── analytics/[id]/route.ts         # View tracking (stub)
│       ├── consultants/route.ts            # Algolia consultant search
│       ├── deck/
│       │   ├── route.ts                    # GET list / POST create
│       │   └── [id]/
│       │       ├── route.ts               # GET / PUT / DELETE deck
│       │       └── sections/
│       │           └── [sectionType]/route.ts  # GET / PUT section data
│       ├── publish/[id]/route.ts           # Publish to Blob (stub)
│       └── upload/candidate/route.ts       # CV upload (stub)
│
├── components/
│   ├── ai/                                 # AI input & suggestion UI (8 files)
│   │   ├── AIPanel.tsx                     # Right-sliding AI panel container
│   │   ├── AIInputTabs.tsx                 # Tab switcher (text/doc/voice/web)
│   │   ├── TextInput.tsx                   # Text analysis input
│   │   ├── DocumentUpload.tsx              # Drag-drop file upload
│   │   ├── VoiceInput.tsx                  # Audio recording with timer
│   │   ├── WebSearchInput.tsx              # Web search query input
│   │   ├── SuggestionCard.tsx              # Individual suggestion with accept/dismiss
│   │   └── SuggestionList.tsx              # Suggestion list with bulk actions
│   ├── editor/
│   │   ├── SectionHeader.tsx               # Section number, title, description
│   │   └── sections/                       # 11 section editors
│   │       ├── CoverEditor.tsx
│   │       ├── TeamEditor.tsx              # Drag-and-drop team composition
│   │       ├── SearchProfileEditor.tsx     # AI-assisted criteria editor
│   │       ├── SalaryEditor.tsx
│   │       ├── CredentialsEditor.tsx
│   │       ├── TimelineEditor.tsx
│   │       ├── AssessmentEditor.tsx
│   │       ├── PersonasEditor.tsx
│   │       ├── ScorecardEditor.tsx
│   │       ├── CandidatesEditor.tsx
│   │       ├── FeeEditor.tsx
│   │       └── team/
│   │           ├── ConsultantPicker.tsx     # Algolia search slide-out
│   │           └── TeamMemberCard.tsx       # Draggable team card
│   ├── layout/
│   │   ├── Shell.tsx                       # Main layout wrapper
│   │   ├── TopBar.tsx                      # Deck title, save status, navigation
│   │   ├── ProgressBar.tsx                 # Animated completion bar
│   │   └── Sidebar.tsx                     # Section navigation (fixed left)
│   └── ui/                                 # Shared primitives
│       ├── Badge.tsx                        # Color-coded tag badge
│       ├── CreateDeckDialog.tsx             # New deck modal with validation
│       ├── EmptyState.tsx                   # Centered empty state with CTA
│       ├── LoadingDots.tsx                  # Animated loading indicator
│       ├── SlideOutPanel.tsx                # Right-sliding panel with backdrop
│       └── Toast.tsx                        # Auto-dismissing notification
│
├── lib/
│   ├── types.ts                            # All TypeScript interfaces (418 lines)
│   ├── ai-types.ts                         # AI suggestion & response types
│   ├── theme.ts                            # Design tokens & section metadata
│   ├── deck-storage.ts                     # In-memory deck CRUD
│   ├── ai/
│   │   ├── claude-client.ts                # Anthropic SDK wrapper
│   │   └── prompts.ts                      # System prompts for Claude
│   ├── hooks/
│   │   ├── useAIPanel.ts                   # AI panel state & API calls
│   │   └── useAudioRecorder.ts             # Microphone recording hook
│   └── store/
│       ├── editor-store.ts                 # Zustand: deck state + auto-save
│       └── dashboard-store.ts              # Zustand: deck list state
│
├── .claude/                                # Claude Code context & skills
├── package.json
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts                      # (in initial_instruction/)
├── start-local.sh                          # Local dev startup script
└── start-docker.sh                         # Production startup script
```

---

## Architecture

### Data Flow

```
User Input → Component → Zustand Store → API Route → Storage
                                ↑                        ↓
                          Auto-save (500ms debounce)   Response
```

1. **Components** receive section data as props and call `onChange` on edits
2. **Editor Store** (Zustand) updates local state immediately (optimistic) and debounces a PUT request per section (500ms)
3. **API Routes** validate input and delegate to the storage layer
4. **Storage** currently uses an in-memory `Map<string, Deck>` — will be replaced with database persistence

### State Management

Two Zustand stores manage application state:

**`useEditorStore`** — active deck editing:
- `deck` — full deck object (null until loaded)
- `activeSection` — which section editor is visible
- `saveStatus` — 'idle' | 'saving' | 'saved' | 'error'
- `updateSection(key, data)` — optimistic update + debounced PUT
- `getSectionStatus(id)` — computed completion status
- Per-section debounce timers prevent concurrent edits from interfering

**`useDashboardStore`** — deck list:
- `decks` — array of deck summaries
- `fetchDecks()` / `createDeck(clientName, roleTitle)`

### Component Architecture

Each section editor follows a consistent pattern:

```tsx
interface SectionEditorProps {
  data: SectionType;
  onChange: (data: Partial<SectionType>) => void;
}
```

The deck editor page maps the active section to its editor component via a `SECTION_EDITORS` record and renders it with `AnimatePresence` for smooth transitions.

---

## Deck Sections

Each pitch deck contains 11 sections, presented in a fixed order:

| # | Section | Type | Description | Completion Rule |
|---|---------|------|-------------|-----------------|
| 1 | **Cover** | Simple form | Client name, role title, intro paragraph, hero image | Both client name and role title filled |
| 2 | **Team** | Database picker | Lead team + network members from Algolia consultant index | At least 1 lead team member |
| 3 | **Search Profile** | Structured input + AI | Must-have and nice-to-have criteria with weights (1-5) | At least 1 must-have criterion |
| 4 | **Salary** | Simple form | Base range, bonus, LTIP, benefits, other compensation | Base salary low > 0 |
| 5 | **Credentials** | Database picker | Track record axes with relevant placements | At least 1 axis with placements |
| 6 | **Timeline** | Template-based | Process phases with durations and milestones | At least 1 phase |
| 7 | **Assessment** | Template-based | Evaluation methods (behavioral, case study, psychometric, etc.) | At least 1 method enabled |
| 8 | **Personas** | Structured input | Candidate archetypes with characteristics | At least 1 archetype |
| 9 | **Scorecard** | Structured input | Weighted evaluation criteria across 4 categories | At least 1 criterion in any category |
| 10 | **Candidates** | Upload + enrichment | Sample shortlist with scores and rankings | At least 1 candidate |
| 11 | **Fee Proposal** | Simple form | Fee structure, percentage, milestones, terms | Fee percentage > 0 |

---

## AI Integration

### How It Works

The AI pipeline uses **Claude** (Anthropic) to analyze consultant-provided content and extract structured suggestions for the Search Profile section.

```
Input (text/doc/voice/web) → API Route → Claude → Structured Suggestions → User Review → Section Data
```

### Input Modes

| Mode | Route | Service | Flow |
|------|-------|---------|------|
| Text | `/api/ai/analyze-text` | Claude (claude-sonnet-4-6) | Text → system prompt + tool use → suggestions |
| Document | `/api/ai/analyze-document` | pdf-parse / mammoth + Claude | File → text extraction → analysis |
| Voice | `/api/ai/transcribe` | AssemblyAI → Claude | Audio → transcript → analysis |
| Web Search | `/api/ai/web-search` | Claude (web_search tool) | Query → web search → analysis |

### Suggestion Structure

Each AI suggestion includes:

```typescript
interface AISuggestion {
  id: string;              // UUID
  text: string;            // The criterion text
  weight: 1 | 2 | 3 | 4 | 5;  // Importance (5=critical, 1=minor)
  category: 'mustHave' | 'niceToHave';
  reasoning?: string;      // Why this was suggested
  status: 'pending' | 'accepted' | 'dismissed';
}
```

### Claude Configuration

- **Model:** claude-sonnet-4-6 (text/web), claude-sonnet-4-20250514 (images)
- **Tool:** `provide_suggestions` with forced tool choice for structured output
- **Context-aware prompts:** Include client name, role title, existing criteria (for deduplication)
- **Web search:** Uses `web_search_20250305` tool (max 5 searches per request)

---

## API Reference

### Deck Management

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/api/deck` | List all decks | — | `{ decks: DeckSummary[] }` |
| POST | `/api/deck` | Create deck | `{ clientName, roleTitle }` | `{ id, deck: Deck }` |
| GET | `/api/deck/[id]` | Get full deck | — | `{ deck: Deck }` |
| PUT | `/api/deck/[id]` | Update deck metadata | Partial `Deck` | `{ success: true }` |
| DELETE | `/api/deck/[id]` | Delete deck | — | `{ success: true }` |
| GET | `/api/deck/[id]/sections/[type]` | Get section | — | `{ section: SectionData }` |
| PUT | `/api/deck/[id]/sections/[type]` | Update section | Partial section | `{ success: true }` |

### AI & Analysis

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| POST | `/api/ai/analyze-text` | Analyze text | `{ text, context }` | `AIAnalysisResponse` |
| POST | `/api/ai/analyze-document` | Analyze file | FormData (file + context) | `AIAnalysisResponse` |
| POST | `/api/ai/transcribe` | Transcribe audio | FormData (audio) | `{ transcript }` |
| POST | `/api/ai/web-search` | Web search + analysis | `{ query, context }` | `AIAnalysisResponse` |

### Other

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/api/consultants?q=...` | Search Algolia for consultants | Implemented |
| GET | `/api/analytics/[id]` | View analytics | Stub (empty) |
| POST | `/api/publish/[id]` | Publish deck | Stub (501) |
| POST | `/api/upload/candidate` | Upload CV/LinkedIn | Stub (501) |

---

## Data Layer

### Current: In-Memory Storage

All deck data is stored in a JavaScript `Map<string, Deck>` in `lib/deck-storage.ts`. Data is **ephemeral** — it is lost when the server restarts. This is intentional for Phase 1 development.

The storage layer provides:
- `getAll()` — returns deck summaries with computed completion counts
- `get(id)` / `create(id, clientName, roleTitle)` / `update(id, partial)` / `delete(id)`
- `getSection(deckId, sectionKey)` / `updateSection(deckId, sectionKey, data)` — section-level CRUD with merge semantics
- `isSectionComplete(deck, sectionId)` — per-section completion rules
- `computeCompletedSections(deck)` — total complete count (0-11)

### Planned: Persistent Databases

Environment variables are already configured for:
- **PostgreSQL (Azure):** Three-tier database (bronze, silver, gold) on `yojimbo.postgres.database.azure.com`
- **MongoDB:** `aimee-prod.stjbrda.mongodb.net` cluster
- **Azure Blob Storage:** Account `valefor` for published deck output and file uploads

These will be connected in Phase 2.

---

## Design System

### Visual Direction

Clean, modern, Notion-meets-Linear aesthetic. White background, cool greys, blue accent. The tool should feel calm, spacious, and respectful of the consultant's time.

### Colors

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

### Typography

- **Font:** Inter (geometric sans-serif, loaded via `next/font`)
- **Headings:** Semibold/bold
- **Body:** Regular weight
- **Sizes:** 12px (xs) through 48px (4xl)

### Animation

All animations use Framer Motion with consistent curves:

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

### Key UI Patterns

- **Auto-save:** No save button. Status indicator shows "Saved" / "Saving..." / error
- **Empty states:** Every list has a helpful empty state with description and CTA
- **Loading states:** `LoadingDots` component for all async operations
- **Slide-out panels:** Right-sliding panels with backdrop for pickers and AI panel
- **Drag-and-drop:** `@dnd-kit` with pointer + keyboard sensors, visual drag handles

---

## External Services

| Service | Purpose | SDK / Integration | Status |
|---------|---------|-------------------|--------|
| **Anthropic Claude** | Text analysis, web search, image analysis | `@anthropic-ai/sdk` | Active |
| **AssemblyAI** | Audio transcription | `assemblyai` | Active |
| **Algolia** | Consultant search index | REST API (fetch) | Active |
| **Azure PostgreSQL** | Persistent data storage (3 DBs) | Not yet connected | Planned |
| **MongoDB** | Document storage | Not yet connected | Planned |
| **Azure Blob Storage** | Published deck hosting, file uploads | Not yet connected | Planned |
| **Bullhorn** | ATS / CRM integration | Not yet connected | Planned |
| **Getty Images** | Stock photography | Not yet connected | Planned |

---

## Roadmap

### Phase 1 — Editor UI & AI (Current)

- [x] Dashboard with deck list and creation
- [x] Sidebar + content area editor layout
- [x] 11 section editor components
- [x] Auto-save with debounced persistence
- [x] AI-assisted search profile editing (text, document, voice, web search)
- [x] Consultant search via Algolia
- [x] Drag-and-drop team composition
- [x] Design system and animation framework
- [ ] Complete interactivity for all section editors (some are read-only)

### Phase 2 — Backend Integration

- [ ] Connect PostgreSQL databases (bronze/silver/gold)
- [ ] Connect MongoDB for document storage
- [ ] Azure Blob Storage for file uploads
- [ ] Bullhorn CRM integration for candidate data
- [ ] Candidate CV/LinkedIn upload and parsing
- [ ] View analytics tracking

### Phase 3 — Client-Facing Output

- [ ] Pitch deck HTML template (Top of Minds brand)
- [ ] Publish workflow (generate + upload to Blob + CDN)
- [ ] Preview mode in editor
- [ ] Shareable link generation

---

## Development Notes

### Scripts

```bash
npm run dev      # Start dev server (Next.js with hot reload)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint with Next.js + TypeScript rules
```

### Key Conventions

- **No mock data** — API routes return empty arrays/objects when no data exists; UI shows proper empty states
- **No UI libraries** — every component is custom-built
- **Strict TypeScript** — no `any` types allowed
- **All colors via theme** — never hardcoded hex values
- **Desktop-first responsive** — mobile support from the start
- **Auto-save everything** — no manual save buttons anywhere

### Path Aliases

`@/*` maps to the project root, so imports look like:

```typescript
import { useEditorStore } from '@/lib/store/editor-store';
import { Badge } from '@/components/ui/Badge';
```

---

Built for [Top of Minds](https://topofminds.com) — executive search, reimagined.
