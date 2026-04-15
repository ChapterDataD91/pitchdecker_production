# Plan: image upload pipeline

**Status:** Backlog. Today, every image field in the deck (hero, banner, client logo, team-non-Algolia, candidate photos, team-Algolia is the exception) renders a placeholder in the published deck. Editor has no upload UI for these.

**Touches:** new API routes for upload, blob client wiring, editor upload widgets in `CoverEditor`, `TeamEditor`, `CandidatesEditor`, possibly `cicero_mcp` if uploads route through MCP.

## Where placeholders show today

| Field | Source today | Placeholder when empty |
|---|---|---|
| `cover.heroImageUrl` | nothing (editor stub) | "HERO IMAGE" cream gradient block |
| `cover.bannerImageUrl` | nothing (editor stub) | sand-gradient angled band |
| `cover.clientLogoUrl` | nothing (editor stub) | navy block with client name in white uppercase |
| `team[].photoUrl` | Algolia consultants → real URLs ✅; manual entries → empty | cream-blue gradient with initials |
| `candidates[].photoUrl` | nothing (editor stub) | initials in circle |

The Algolia path works end-to-end (CDN URLs survive blob → viewer). Everything else needs an upload pipeline.

## Decisions to make first

1. **Upload destination.**
   - **(a) Deck's own blob prefix.** Each deck gets `clientSlug/token/v1/assets/...`. Lifetime tied to viewer expiry (14 days). Simplest model: one home, one TTL. Loses re-use across decks (uploading the same client logo twice).
   - **(b) Long-lived shared user-uploads container.** Editor uploads to `pitchdecker-uploads/<deck-id>/<filename>` with a long-lived SAS or anonymous read. Survives republishes. More moving parts (cleanup policy, ACLs).
   - **(c) Mixed.** Logos/team photos in shared (re-usable across decks); hero/banner/candidate photos in deck blob (one-off per mandate).
   - **Recommendation:** start with (a) for simplicity. Promote to (c) when consultants complain about re-uploading the same client logo for every mandate from the same client.

2. **Who handles the upload.**
   - **(a) Editor uploads directly via SAS.** Editor calls `cicero_mcp.deployPitchdeck` (or a new `requestUploadSas`), gets a SAS, PUTs the file. Same pattern as today's HTML upload. Editor side carries upload retry logic.
   - **(b) MCP server uploads on behalf.** Editor sends file content to MCP tool, MCP PUTs to blob. Server-side validation (extension, size, content sniffing). Larger MCP payloads but more controlled.
   - **Recommendation:** (a) for MVP, mirror the existing pattern. Cleaner upgrade path to (b) later if validation becomes important.

3. **SAS lifetime.**
   - Hero/banner/logos uploaded *before* publish need to be readable by the viewer for 14 days. So SAS lifetime ≥ viewer lifetime, OR images get re-issued on publish.
   - Editor preview also needs the image to render *during* editing — could be days/weeks before publish.
   - **Recommendation:** anonymous-read container for image assets, no SAS at read time. SAS only on the write side. Removes the lifetime puzzle entirely.

4. **Image processing.**
   - Demo hero is ~1600×900px. Banner is wider. Logo is small. Candidate/team photos are 240×240 typical.
   - **Should the editor enforce resize at upload?** Yes — drop a 5MB iPhone photo straight into the deck and you bloat the published HTML's image references.
   - **Recommendation:** client-side resize+compress before upload (e.g., max 1920px wide, JPEG q85). Server still validates size cap as a safety net.

5. **Replace vs. version.**
   - When the consultant re-uploads a hero image, do we overwrite or version it?
   - Overwrite: simpler. URL stays stable. CDN cache becomes a problem.
   - Version: append a hash or timestamp suffix. Old URL still works (good for already-published decks). Slightly more orphan blobs.
   - **Recommendation:** version (hash-based filename). Cleanup is a separate cron problem, not a hot-path concern.

## Suggested implementation order

1. **Decide on the five questions above** with the user.
2. **Stand up an image-upload API route.** `POST /api/upload/image` accepting `multipart/form-data`. Stores to chosen destination, returns `{ url }`.
3. **Reusable upload component.** `<ImageUpload>` React component: drag-drop zone + preview + remove. Used by `CoverEditor` (3 instances), `TeamEditor` (per member when no Algolia photo), `CandidatesEditor` (per candidate).
4. **Wire each editor's image fields** through `<ImageUpload>` to the new API.
5. **Test:** upload + publish + view round-trip. Image URL must resolve from the viewer URL (no auth headers required).

## Files in scope (when work begins)

**New:**
- `app/api/upload/image/route.ts` — multipart upload handler
- `lib/blob/upload.ts` — blob client wrapper for image uploads (separate from `lib/mcp/deploy-pitchdeck.ts` which does HTML deploys)
- `components/ui/ImageUpload.tsx` — drag-drop upload + preview component

**Modified:**
- `components/editor/sections/CoverEditor.tsx` — wire hero/banner/clientLogo upload widgets
- `components/editor/sections/TeamEditor.tsx` — per-member photo upload (override or supplement Algolia)
- `components/editor/sections/CandidatesEditor.tsx` — per-candidate photo upload
- `lib/types.ts` — possibly add `imageMetadata` (uploadedAt, dimensions, sourceFilename) if helpful for future cleanup tooling

## Files NOT in scope

- `output-template/` — already handles the placeholder/image branching. Zero changes when this lands.

## Out-of-band considerations

- **CDN.** When traffic justifies it, front the image container with Azure CDN. Out of scope for MVP.
- **Image accessibility.** Alt text. The renderer uses `cover.clientName` / `member.name` / `candidate.name` as alt today — fine. For hero/banner, consider a separate `alt` field on the schema if SEO/screen-readers matter to the published deck (probably not — these are PIN-gated).
- **Image deletion / orphan cleanup.** Not urgent. A weekly cron that lists blobs older than expired decks is enough.

## Trigger to actually start

Any of:
1. A consultant runs through a real mandate end-to-end and the placeholders block their workflow.
2. The output template gets shown to a real client (placeholders embarrassing).
3. We need analytics on which images get used most (to decide on the shared vs. deck-local destination).

Until then: placeholders are the right behaviour. They communicate "image goes here" without faking content.
