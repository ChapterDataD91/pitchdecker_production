# Candidate Matching — Architecture Plan

Plan for wiring database-driven candidate matching into step 10 ("Candidates") of the pitch deck builder. Parked for later pickup.

## Problem

Today consultants upload CVs/LinkedIn PDFs by hand. We have ~65k candidates in our
databases (Postgres gold tables + Mongo CVs/notes) with rich quality signals from
prior placements. The "Query candidate database — SOON" stub in
`components/editor/sections/CandidatesEditor.tsx:723` is pure disabled UI.

Goal: let Claude reason over that corpus agentically — multiple paths to Rome
(structured SQL, semantic vector, placement-funnel pattern, notes deep-dive) —
and return a ranked, scored shortlist against the deck's Scorecard and Search
Profile.

## Key insight

Retrieval is agentic, not a fixed pipeline. Data prep must therefore optimize
for "what shape lets Claude navigate this intelligently," not "what's the one
best embedding." That drives the whole design.

## Data layer prep

### Two embeddings per candidate (not one)

Embedding a whole CV as a single vector averages out signal — a senior CFO with
junior marketing history loses to a mid-career match.

1. **`profile_embedding`** — from an LLM-synthesized 150–200 word executive
   summary of the candidate. Best semantic match for exec search because it
   captures trajectory and archetype, not incidental keywords.
2. **`cv_raw_embedding`** — full CV, chunked to token limit, mean-pooled.
   Fallback for keyword-specific matches the synthesis loses (e.g. "SAP S/4HANA
   migration").

Store both in Mongo, mirroring the existing `company_vector_search` pattern in
cicero_mcp (`src/tools/semanticSearch.ts`). Index separately so the agent can
pick per query.

**Cost (one-off):**
- Embeddings: 65k × ~2500 tokens × 2 ≈ 325M tokens × $0.13/M ≈ **$42**
- Synthesis (Haiku): ~$300 for the full pass
- Total: under $400, hours of wall time via batch API

**Don't embed notes yet.** Noise-heavy, relationship-specific. Keep as
on-demand fetch for top-20 candidates only.

### Denormalized `candidate_profiles` collection

The load-bearing piece. One Mongo document per candidate, rebuilt nightly,
containing everything the agent needs to judge fit and quality without chasing
five tables.

```
candidate_profiles {
  candidate_id,
  synthesized_profile,        // the 150w summary
  profile_embedding,
  cv_raw_embedding,
  core: { name, current_role, current_company, location,
          country, seniority, specialization, languages,
          age, working_experience_years, role_count,
          average_tenure, total_tenure },
  career: [{ title, company, years, tenure }],
  education: [{ degree, institution, field, year }],
  placement_signals: {
    total_submissions, times_placed, times_runner_up,
    times_offer_declined, times_interview_client,
    last_submission_date, last_note_date,
    avg_days_to_interview, strongest_stage_reached
  },
  recent_note_summary,        // LLM-distilled from notes, last 12 months
  owner_consultant_id,
  updated_at
}
```

The synthesized_profile is the single most important field — human-readable,
LLM-friendly, small enough to pass 50 of them into context at once.

### Refresh cadence

- Nightly: placement_signals, recent_note_summary, core facts
- Weekly or on-change: synthesized_profile + embeddings (CVs rarely change)
- On-demand: specific candidate refresh tool

## Agent tool surface (to add to cicero_mcp)

Give Claude a menu with clear axes so it can pivot based on what the scorecard
looks like:

- **`describe_candidate_corpus`** — facet counts (specializations, seniority,
  industries, countries). Lets the agent plan before querying.
- **`search_candidates_semantic(query, structured_prefilter?, limit=50)`** —
  `profile_embedding` nearest-neighbor with Postgres prefilter on
  specialization/seniority/country/languages. `cv_raw_embedding` as a fallback
  flag.
- **`search_candidates_structured(filters)`** — pure Postgres. For
  "Dutch-speaking CFOs in Amsterdam with 10+ years."
- **`search_candidates_by_placement_pattern({similar_to_job_id?, exit_buckets?,
  min_stage?})`** — funnel-based retrieval (runners-up pool,
  offer_declined pool). Exit_bucket == "offer_declined" is gold: client
  wanted them, they said no.
- **`find_similar_candidates(seed_candidate_id, k=20)`** — vector kNN from a
  seed. "More like this one."
- **`get_candidate_detail(id)`** — full document + CV + recent notes. Only
  called on top picks.

Agent reasoning pattern becomes natural: scorecard emphasizes sector depth →
semantic; mostly structured must-haves → structured; mentions a specific
competitor → placement pattern.

## Speed budget

- Retrieval call: ~300ms (Atlas vector + Postgres prefilter on 65k)
- Agent reasoning loop of 3–6 tool calls: 2–4s
- Final LLM scoring of top 20–30 against scorecard, streamed: 15–25s
- **Total: under 30s** for a ranked, scored shortlist with evidence

## Deck-side integration

Reuse existing patterns already proven in the editor:

- CV parsing pipeline (`/api/upload/candidate/route.ts`) — the `Candidate` type
  in `lib/types.ts:309` already has everything we need. DB-sourced candidates
  produce the same shape, flagged with a `source: 'database' | 'upload'`
  discriminator.
- Scoring via `return_scores` tool (`/api/ai/candidate/score`) — unchanged.
- UX pattern from ScorecardEditor.tsx:158 ("Import from search profile") —
  snapshot → transform → onChange → undo banner. Reuse for batch candidate
  suggestions.

Query-side signals available in the deck (`lib/types.ts`):
- Scorecard (richest — 4 weighted categories)
- Search Profile (weighted criteria + personality traits)
- Personas (named archetypes)
- Cover (role title, client, intro)
- Salary (implicit seniority band)

## Concrete build order

1. **Enrichment ETL** — idempotent nightly job. Reads Postgres + Mongo CV +
   notes, synthesizes profile via Haiku, embeds both vectors, upserts
   `candidate_profiles`. Start with 500-candidate dev slice to validate
   synthesis quality before the full 65k run.
2. **Mongo vector indexes** on `profile_embedding` and `cv_raw_embedding`.
3. **Six MCP tools** in cicero_mcp, mirroring patterns in `semanticSearch.ts`
   and `queryPlacementCandidates.ts`.
4. **Editor endpoint** (`/api/candidate/match`) that agentically calls the MCP
   tools, streams results, reuses existing scoring pipeline.
5. **UI**: replace the stub in CandidatesEditor.tsx:723 with a modal: detected
   role/seniority/industries (editable) → stream ranked candidates with
   evidence → checkbox select → promote.

## The one thing to get right

**The synthesis prompt.** If the 150-word profile nails trajectory and
archetype, semantic search feels brilliant and the agent can reason about fit.
If it's generic, semantic search pulls irrelevant people and the whole system
feels dumb.

Spend real time iterating the synthesis prompt against 20 hand-picked
candidates (varied seniority, specialization, outcomes) before scaling.

## Settled decisions

- Auth to MCP — will be fixed separately, not a design blocker here.
- Attribution surfacing ("Gijs owns this candidate") — not a concern for v1.

## Open questions for later

- Does the agent need access to notes embeddings too, or is on-demand
  `get_candidate_detail` sufficient? Lean on-demand until proven otherwise.
- How do we handle GDPR / candidate consent for DB-surfaced candidates who
  haven't been contacted recently? May need a recency gate in retrieval.
- Batch pre-scoring against common scorecard templates for speed — probably
  not worth it (scorecards too bespoke), revisit if latency complaints.

## References

- Editor-side candidate types: `lib/types.ts:309`
- Existing upload pipeline: `app/api/upload/candidate/route.ts`
- Existing scoring pipeline: `app/api/ai/candidate/score/route.ts`
- Stub to replace: `components/editor/sections/CandidatesEditor.tsx:723`
- Cicero MCP vector pattern to mirror: `/Users/daan/cicero_mcp/src/tools/semanticSearch.ts`
- Cicero MCP funnel tool to extend: `/Users/daan/cicero_mcp/src/tools/queryPlacementCandidates.ts`
- Cicero MCP Mongo wiring: `/Users/daan/cicero_mcp/src/db/mongodb.ts`
