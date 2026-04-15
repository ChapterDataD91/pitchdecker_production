# Deck ownership & sharing

**Status:** Deferred. SSO is live in front of the app, but no per-user
authorization exists yet. Everyone in the Top of Minds tenant can currently
see, edit, publish, and delete every deck.

**Decision made (2026-04-15):** consultants collaborate, so decks should be
**team-wide visible** within the tenant. Ownership is tracked for
**attribution + audit**, not access control. This is the minimum change that
enables "who last touched this" without getting in the way of shared work.

## What changes

### 1. New auth helper — `lib/auth.ts`

Reads the headers App Service injects after SSO:

```ts
export interface CurrentUser {
  id: string         // x-ms-client-principal-id (Entra object ID)
  email: string      // x-ms-client-principal-name (UPN)
}

export function getCurrentUser(request: Request): CurrentUser {
  const id = request.headers.get('x-ms-client-principal-id')
  const email = request.headers.get('x-ms-client-principal-name')

  if (!id || !email) {
    // Local dev: no SSO headers present. Return a stub so localhost works.
    if (process.env.NODE_ENV !== 'production') {
      return { id: 'dev-user', email: 'dev@local' }
    }
    throw new Error('No authenticated user in request headers')
  }
  return { id, email }
}
```

### 2. Deck type — add owner fields

`lib/types.ts`:

```ts
export interface Deck {
  id: string
  clientName: string
  roleTitle: string
  createdAt: string
  updatedAt: string
  status: DeckStatus
  sectionStatuses: SectionStatuses
  sections: DeckSections

  // Attribution (set once, on create)
  ownerId: string
  ownerEmail: string

  // Audit (updated on every save)
  lastEditedById: string
  lastEditedByEmail: string
  lastEditedAt: string
}
```

`createEmptyDeck(...)` needs an additional `owner: CurrentUser` parameter to
populate these.

### 3. Deck storage — attribution-only (no filter)

`lib/deck-storage.ts`:

- `create(id, clientName, roleTitle, owner)` — sets `ownerId`, `ownerEmail`,
  and seeds the `lastEditedBy*` fields identically.
- `update(id, patch, editor)` — every write bumps `lastEditedById`,
  `lastEditedByEmail`, `lastEditedAt`. Never touches `ownerId`.
- `getAll()` — **unchanged**. Returns all decks in the tenant. No filter.
- `get(id)` — **unchanged**.
- `delete(id)` — **unchanged**. (Consider gating this later; for now anyone
  can delete anything. Match the collaborative model.)

Add a Mongo index on `ownerId` for future use (cheap, pays off if we ever do
filtering views like "My decks" vs. "All decks"):

```ts
await collection.createIndex({ ownerId: 1 })
```

### 4. API routes — pass the user through

Four routes need the one-line addition of `const user = getCurrentUser(req)`
and pass `user` down:

- `app/api/deck/route.ts` — `POST` uses `user` as the owner; `GET` unchanged.
- `app/api/deck/[id]/route.ts` — `PATCH` / `PUT` stamps `user` as editor.
- `app/api/deck/[id]/sections/[sectionType]/route.ts` — section updates also
  stamp editor.
- `app/api/deck/[id]/documents/route.ts` — documents already have a
  `userId: null` TODO at line 65; wire it to `user.id` at the same time.

### 5. UI surfacing (optional, but valuable)

In the dashboard deck card and the deck TopBar:

- Show avatar/initials of `ownerEmail` (the creator)
- Show "Last edited by {lastEditedByEmail} · {relative time}" underneath

Both are derivable from data we're already returning — pure presentation
change, no backend work.

### 6. Mongo backfill

Existing decks in the `pitchdecker` collection have no owner fields. Options:

- **Wipe (demo data):** drop the collection. Fresh start.
- **Backfill script:** one-time set `ownerId = '<your-entra-id>'`,
  `ownerEmail = 'daan@topofminds.com'`, `lastEditedBy*` = same. Good if any
  real client work is in there.

## What this does NOT add

- **Access control.** Any tenant user can open/edit/delete any deck. That is
  intentional — collaborative model.
- **Roles.** No distinction between consultant, researcher, admin.
- **Deck-level sharing toggle.** No "private to me" option. If a consultant
  wants a private draft, add a `visibility: 'private' | 'team'` field as a
  follow-up — not this pass.
- **Audit log.** We stamp the *last* editor. A full history (who changed
  what when) would be a separate change-log collection.

## Follow-up work this unblocks

1. **Cicero MCP `updatePitchdeck` ownership check.** That tool already
   accepts a `createdBy` param but our publish flow passes nothing, so the
   ownership gate is bypassed. Once `ownerId` exists in the deck, the
   publish route can forward it as `createdBy` — closes the "anyone with
   the token can overwrite the deployed HTML" gap.

2. **"My decks" vs. "All decks" filter on the dashboard.** Purely a
   presentation toggle on top of `getAll()`; data is already there.

3. **Private drafts.** Add `visibility` field; dashboard filters out
   `visibility: 'private'` decks not owned by the current user.

## Cost / time estimate

- Auth helper: 15 min
- Types + factory: 10 min
- Storage layer: 25 min
- Route wiring: 20 min
- UI (attribution chip + last-edited line): 30 min
- Backfill script: 15 min

**~2 hours end to end**, deployable as one PR.

## Open questions for when this is picked up

- Do we want "locked while being edited by someone else" presence? (Mongo
  change stream + a lightweight lock field; not hard, but scope creep.)
- Should `delete` be gated to owner-only even in collaborative mode? My
  gut says yes — easy to nuke someone else's work accidentally. One extra
  line.
- How do we handle an ex-employee's decks after Entra disables their
  account? Ownership transfer tool, or claim-by-admin flow.
