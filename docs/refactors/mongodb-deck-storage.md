# Handoff: swap in-memory `deckStorage` for MongoDB

> **You are reading this in a fresh Claude Code session with no prior context.** Read the whole file before touching anything. Stop at the "Before you start" section and ask the user for the inputs listed there.

## Why we're doing this

Today, decks live in a `Map` inside `lib/deck-storage.ts`. Two problems:

1. **Volatile.** Every `npm run dev` restart wipes everything. With Phase B-D porting (lots of editor-side work to fill sections), the consultant loses their work whenever a code change triggers a hot reload.
2. **Next.js 16 + Turbopack module isolation.** Server components and API route handlers have *separate module graphs*, so each gets its own `Map` instance. We confirmed this in logs: a deck POSTed via `/api/deck` is invisible to a server component reading `deckStorage` directly. Today's preview page works around it by fetching back through `/api/deck/[id]` over HTTP. That workaround disappears once data lives outside the Node module graph.

External persistence (MongoDB) solves both. After this refactor, the explanatory comment in `app/deck/[id]/preview/page.tsx` about the workaround can come out, and the preview page can read deck data directly server-side.

`mongodb: ^7.1.1` is already in `package.json`. There's existing scaffolding under `lib/db/` (check what's there before reinventing).

## What this is NOT

- **Not a schema redesign.** The Deck shape stays exactly as defined in `lib/types.ts`. One Mongo document = one whole `Deck`.
- **Not a feature change.** No new endpoints, no UI changes, no new fields. Behaviour-identical from the editor's perspective.
- **Not a migration script.** In-memory is volatile; nothing to migrate. Just start fresh against Mongo.
- **Not touching auth, validation, or section editors.** Out of scope.

## API surface to preserve

`lib/deck-storage.ts` exports `deckStorage` with these methods. They are called from many places (API routes). All call sites must continue to work without changes:

```ts
deckStorage.getAll(): DeckSummary[]
deckStorage.get(id: string): Deck | undefined
deckStorage.create(id: string, clientName: string, roleTitle: string): Deck
deckStorage.update(id: string, partial: Partial<Omit<Deck, 'id' | 'sections'>>): Deck | undefined
deckStorage.updateSection<K extends keyof DeckSections>(deckId, sectionKey, data): Deck | undefined
deckStorage.getSection<K extends keyof DeckSections>(deckId, sectionKey): DeckSections[K] | undefined
deckStorage.delete(id: string): boolean
deckStorage.isSectionComplete(deck: Deck, sectionId: SectionId): boolean
deckStorage.computeCompletedSections(deck: Deck): number
```

**Constraint:** the public method signatures must stay identical *including being synchronous*. If you absolutely cannot avoid making them async (because the Mongo driver is async), you'll need to update every caller and that's a much bigger blast radius. **Try first to keep them sync** by using a small in-memory cache on top of Mongo (read-through), with writes that fire-and-forget in the background. If that's too sketchy, async is the fallback — but check with the user before committing to it.

A reasonable compromise: convert to `async` everywhere it's safe (most callers are already in `async` API route handlers — check `app/api/deck/**/route.ts` and `app/api/publish/[id]/route.ts`). Write a quick grep first to inventory callers and make sure none are sync-only contexts (e.g., constructors, render-time helpers).

## Files in scope

- `lib/deck-storage.ts` — rewrite the implementation, keep the export shape.
- `lib/db/mongodb.ts` (or wherever the existing Mongo client lives — check `lib/db/` first).
- `app/api/deck/route.ts`, `app/api/deck/[id]/route.ts`, `app/api/deck/[id]/sections/[sectionType]/route.ts`, `app/api/publish/[id]/route.ts` — only if you converted methods to async; otherwise no changes.
- `app/deck/[id]/preview/page.tsx` — once Mongo is in, you can replace the `loadDeck` function (which fetches via HTTP) with a direct `deckStorage.get(id)` call, and delete the explanatory comment about Next.js module isolation. **Verify this works in dev** before claiming done — that was the original symptom.

## Files explicitly out of scope (do not touch)

- Anything under `output-template/` (Phase B is happening in parallel in another terminal — collisions here will be painful).
- Anything under `components/editor/sections/` (also Phase B territory).
- `lib/types.ts` — schema is locked for this refactor.
- `lib/validators/` — no Zod schema changes.

If you find yourself wanting to touch any of the above, stop and ask the user.

## Before you start: questions for the user

Ask all of these in one batch:

1. **Connection string.** Is there an existing `MONGODB_URI` (or similar) in `.env.local` already set? If yes, share it. If no, what should the new dev Mongo target be (Atlas? local Docker?).
2. **Database name.** What database should decks live in?
3. **Collection name.** What should the collection be called? (Suggestion: `decks`, but defer to user.)
4. **`_id` strategy.** Today decks have a UUID `id` field generated by the API route. Should that stay (UUID stored in `_id`)? Or should we let Mongo generate `ObjectId`s and keep `id` as a separate field? The first is simpler.
5. **Existing `lib/db/mongodb.ts` (or similar)?** Read it first if it exists — it may already define a connection helper.
6. **Sync vs async preference.** Per the constraint above. Default: try to keep `deckStorage.*` sync via a read-through cache. Fall back to async if needed.

## Suggested implementation (for context, not prescriptive)

Single collection, one document per deck. Document shape: the existing `Deck` interface verbatim, with `_id: string` mirroring `Deck.id`.

```js
{
  _id: "uuid-string",
  id: "uuid-string",          // duplicate of _id for Deck.id compatibility
  clientName: "...",
  roleTitle: "...",
  createdAt: "ISO",
  updatedAt: "ISO",
  status: "draft" | "in-progress" | "complete",
  sectionStatuses: { cover: "empty", ... },
  sections: { cover: {...}, team: {...}, ... }
}
```

Indexes:
- `_id` (default).
- `updatedAt` descending (for dashboard listing).
- (Future) `createdBy` once auth is wired.

Minimal Mongo client wrapper if not already present (mirror `lib/mcp/cicero-client.ts` singleton pattern):

```ts
// lib/db/mongodb.ts
import { MongoClient, Db } from 'mongodb'

let client: MongoClient | null = null
let db: Db | null = null

export async function getDb(): Promise<Db> {
  if (db) return db
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI not set')
  client = new MongoClient(uri)
  await client.connect()
  db = client.db(process.env.MONGODB_DB ?? 'pitchdecker')
  return db
}
```

Then `deckStorage` becomes a thin layer over `db.collection('decks')`.

## Verification checklist

Run these and only mark this done when all pass:

1. `npx tsc --noEmit` — clean.
2. `npm run lint` — no new errors in your changes.
3. `npm run build` — clean.
4. **End-to-end with a fresh restart:**
   - `npm run dev`
   - `curl -X POST http://localhost:3000/api/deck -H "Content-Type: application/json" -d '{"clientName":"Persistence Test","roleTitle":"CEO"}'` — get back a deck id.
   - Kill `npm run dev`, restart it.
   - `curl http://localhost:3000/api/deck` — the test deck must still be there. (This is the persistence proof.)
5. **Preview page works without the HTTP-fetch workaround:**
   - Edit `app/deck/[id]/preview/page.tsx` to replace the `loadDeck` HTTP fetch with a direct `deckStorage.get(id)` call. Delete the workaround comment.
   - Visit `/deck/{id}/preview` — must return 200 with the iframe-embedded shell. (This is the "Next.js module isolation no longer matters" proof.)
6. Sections endpoint: `curl http://localhost:3000/api/deck/{id}/sections/cover` — returns the cover section.

## Definition of done

- All verification steps pass.
- `lib/deck-storage.ts` reads/writes to Mongo.
- `app/deck/[id]/preview/page.tsx` reads directly from `deckStorage` (HTTP workaround removed).
- The original explanatory comment about Next.js module isolation is gone from the codebase (grep for it; should be zero hits).
- No new dependencies added (mongodb is already in package.json).
- Commit message describes scope and verification.

## What to tell the other terminal session when you're done

The other Claude session is doing Phase B section porting concurrently in `output-template/sections/*` and `lib/types.ts`. Notify the user: *"Mongo refactor complete, signal Phase-B session to rebase / pull."* No merge conflicts expected because we touched non-overlapping files, but the other session should re-run `npm run build` to confirm.
