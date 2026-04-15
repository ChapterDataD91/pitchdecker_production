# Refactor: collapse `deployPitchdeck` to a one-call contract

**Status:** Backlog. Defer until the two-step contract starts hurting (e.g., when image assets, watermarking, or server-side validation join the picture).

**Touches:** `cicero_mcp/src/tools/deployPitchdeck.ts` (upstream repo) and `pitchdecker_production/lib/mcp/deploy-pitchdeck.ts` (this repo).

## Today: two-step contract

The editor calls the MCP tool, gets a SAS URL back, then PUTs each file itself.

```
[editor]  --call deployPitchdeck({client_name})-->  [cicero_mcp]
                                                          |
          <--{viewer_url, pin, upload_url, sas_token}-----+
[editor]  --PUT index.html?sas-->  [Azure Blob]
[editor]  --PUT candidates/x.html?sas-->  [Azure Blob]
[editor]  --PUT candidates/y.html?sas-->  [Azure Blob]
                                          ...
```

The editor wrapper (`lib/mcp/deploy-pitchdeck.ts`) handles the upload loop. ~100 lines. Today the deploy *logic* (slug, token, PIN, DB row, container, SAS) is single-source-of-truth in cicero_mcp; only the upload step lives editor-side.

## Tomorrow: one-call contract

The editor sends the files; cicero_mcp does the upload too.

```
[editor]  --call deployPitchdeck({client_name, files: [...]})-->  [cicero_mcp]
                                                                       |
                                                                       +--PUT to Blob (server-side)
                                                                       |
          <--{viewer_url, pin, expires_in_days, files_uploaded}--------+
```

## Why we'll want this

- **Server-side enforcement.** Extension whitelist (`.html` only), max file size, max file count, content-type validation. Today the editor is trusted; tomorrow it might not be (3rd-party tooling, multi-tenant).
- **Watermarking / post-processing.** If we ever want to inject viewer-specific content (e.g., `Prepared for {viewer}` watermark), it's one place to do it.
- **Image assets.** When team / candidate / hero photos move into the deck blob folder, the upload becomes much more involved. Better to centralise.
- **Smaller editor surface.** `lib/mcp/deploy-pitchdeck.ts` collapses to a 20-line wrapper. The PUT loop, retry, error-mapping all moves server-side where it's tested in one place.
- **Future deploy targets.** If we ever want to publish to something other than Azure Blob (e.g., Cloudflare Pages, S3, a static-site CDN), the editor doesn't know about any of it.

## Why we're not doing it now

- Today's wrapper works.
- The MCP request payload would carry the full HTML (~50–500KB per file). MCP over HTTP/SSE handles this fine, but there's no urgency to validate that until we actually hit it.
- Refactoring the cicero_mcp tool is upstream work; we'd want it released and pinned before swapping the editor side.

## When to do it

Trigger any of:
1. We add a second deploy target (S3, etc.).
2. We add image assets to the published deck folder.
3. We add multi-tenant editor users where the editor can't be trusted to upload only `.html`.
4. The two-step contract has a real bug (race condition, partial-upload state).

## Implementation sketch

### `cicero_mcp/src/tools/deployPitchdeck.ts`

Add a new shape (keep the old one for backwards compat for one release):

```ts
export interface DeployPitchdeckParams {
  client_name: string
  expires_in_days?: number
  files?: Array<{
    path: string          // e.g. "index.html", "candidates/foo.html"
    content_b64: string   // base64-encoded UTF-8 (MCP transport is text)
    content_type?: string // default "text/html; charset=utf-8"
  }>
}
```

If `files` is present:
1. Validate path (no `..`, must match `^[a-zA-Z0-9/_-]+\.html$` initially).
2. Generate token + PIN + SAS as today.
3. Use `@azure/storage-blob` server-side (already a dep) to PUT each file directly into the container under `blobPrefix`.
4. Insert DB row.
5. Return `{ viewer_url, pin, expires_in_days, files_uploaded: number }` — no `upload_url` / `sas_token` in the response when files were sent.

If `files` is absent: behave as today (return SAS for editor to upload).

### `pitchdecker_production/lib/mcp/deploy-pitchdeck.ts`

Simplify to:

```ts
export async function publishDeckArtifacts(
  clientName: string,
  files: readonly PublishFile[],
  options: { expiresInDays?: number } = {},
): Promise<PublishDeckResult> {
  const cicero = await getCiceroClient()
  const result = await cicero.callTool({
    name: 'deployPitchdeck',
    arguments: {
      client_name: clientName,
      expires_in_days: options.expiresInDays,
      files: files.map(f => ({
        path: f.path,
        content_b64: Buffer.from(f.content, 'utf-8').toString('base64'),
        content_type: f.contentType ?? 'text/html; charset=utf-8',
      })),
    },
  })
  const payload = JSON.parse(extractText(result))
  return {
    viewerUrl: payload.viewer_url,
    pin: payload.pin,
    expiresInDays: payload.expires_in_days,
  }
}
```

PUT loop deleted. Error mapping simplified (one upstream call).

## Tests / verification

- `cicero_mcp` side: existing two-step tests stay; add a one-call test that posts a synthetic 50KB HTML and asserts the blob exists + DB row is correct.
- `pitchdecker_production` side: integration test that publish endpoint returns `{ viewerUrl, pin }` end-to-end against a local cicero_mcp.
