// ---------------------------------------------------------------------------
// Typed wrappers around the Cicero MCP deployment tools.
//
// Exports:
//   - publishDeckArtifacts(clientName, files)  → deployPitchdeck
//   - updateDeckArtifacts(token, files)        → updatePitchdeck (revoked/expired
//                                                classified so the caller can
//                                                gracefully fall back to deploy)
//
// Each cicero tool returns a JSON-stringified payload as the first text
// content block (see /Users/daan/cicero_mcp/src/tools/*.ts).
// ---------------------------------------------------------------------------

import { getCiceroClient } from './cicero-client'

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface PublishFile {
  /** Relative path under the deck blob prefix (e.g. "index.html" or "candidates/foo.html") */
  path: string
  /** File contents */
  content: string
  /** Content-Type header; defaults to "text/html; charset=utf-8" */
  contentType?: string
}

export interface PublishDeckResult {
  token: string
  viewerUrl: string
  pin: string
  version: 1
  expiresAt: string
  expiresInDays: number
}

export type UpdateDeckResult =
  | {
      ok: true
      viewerUrl: string
      version: number
      expiresAt: string
    }
  | {
      ok: false
      reason: 'revoked' | 'expired' | 'not_found' | 'unknown'
      error: string
    }

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

interface DeployResponse {
  token: string
  viewer_url: string
  pin: string
  upload_url: string
  sas_token: string
  client_name: string
  expires_in_days: number
  expires_at?: string
}

interface UpdateResponseOk {
  success: true
  version: number
  viewer_url: string
  upload_url: string
  sas_token: string
  client_name: string
  expires_at: string
}

interface UpdateResponseErr {
  success: false
  error: string
}

type UpdateResponse = UpdateResponseOk | UpdateResponseErr

function parseToolResultJson<T>(toolResult: unknown, toolName: string): T {
  const content = (toolResult as { content?: Array<{ type: string; text?: string }> })
    .content as Array<{ type: string; text?: string }> | undefined
  if (!content) throw new Error(`${toolName} returned no content`)

  const text = content
    .filter((c) => c.type === 'text' && typeof c.text === 'string')
    .map((c) => c.text as string)
    .join('\n')

  if (!text) throw new Error(`${toolName} returned no text content`)

  try {
    return JSON.parse(text) as T
  } catch (err) {
    throw new Error(
      `${toolName} returned non-JSON text: ${text.slice(0, 200)}${
        err instanceof Error ? ` (${err.message})` : ''
      }`,
    )
  }
}

async function uploadFilesToSas(
  uploadUrl: string,
  sasToken: string,
  files: readonly PublishFile[],
): Promise<void> {
  const baseUrl = uploadUrl.replace(/\/+$/, '')
  const sas = sasToken.startsWith('?') ? sasToken : `?${sasToken}`

  for (const file of files) {
    const safePath = file.path.replace(/^\/+/, '')
    const fileUrl = `${baseUrl}/${safePath}${sas}`
    const contentType = file.contentType ?? 'text/html; charset=utf-8'

    const res = await fetch(fileUrl, {
      method: 'PUT',
      headers: {
        'x-ms-blob-type': 'BlockBlob',
        'Content-Type': contentType,
      },
      body: file.content,
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(
        `Blob upload failed for ${safePath}: ${res.status} ${res.statusText} — ${body.slice(0, 200)}`,
      )
    }
  }
}

function classifyUpdateError(error: string): UpdateDeckResult & { ok: false } {
  const lower = error.toLowerCase()
  let reason: 'revoked' | 'expired' | 'not_found' | 'unknown' = 'unknown'
  if (lower.includes('revoked')) reason = 'revoked'
  else if (lower.includes('expired') || lower.includes('has expired')) reason = 'expired'
  else if (lower.includes('not found')) reason = 'not_found'
  return { ok: false, reason, error }
}

function validateFiles(files: readonly PublishFile[], fnName: string): void {
  if (files.length === 0) {
    throw new Error(`${fnName}: no files to upload`)
  }
  const hasIndex = files.some((f) => f.path === 'index.html')
  if (!hasIndex) {
    throw new Error(`${fnName}: files must include index.html at the root`)
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * First-time publish. Creates a new deployment (new token + PIN) via the
 * cicero deployPitchdeck tool and uploads the given files to the returned
 * SAS URL. Throws on MCP error or any non-2xx upload response.
 */
export async function publishDeckArtifacts(
  clientName: string,
  files: readonly PublishFile[],
  options: { expiresInDays?: number } = {},
): Promise<PublishDeckResult> {
  validateFiles(files, 'publishDeckArtifacts')

  const cicero = await getCiceroClient()
  const toolResult = await cicero.callTool({
    name: 'deploy_pitchdeck',
    arguments: {
      client_name: clientName,
      ...(options.expiresInDays !== undefined
        ? { expires_in_days: options.expiresInDays }
        : {}),
    },
  })

  const payload = parseToolResultJson<DeployResponse>(toolResult, 'deploy_pitchdeck')
  const { token, viewer_url, pin, upload_url, sas_token, expires_in_days, expires_at } = payload

  if (!token || !upload_url || !sas_token || !viewer_url || !pin) {
    throw new Error(
      `deployPitchdeck response missing required fields: ${Object.keys(payload).join(', ')}`,
    )
  }

  await uploadFilesToSas(upload_url, sas_token, files)

  const expiresAt =
    expires_at ?? new Date(Date.now() + expires_in_days * 86400000).toISOString()

  return {
    token,
    viewerUrl: viewer_url,
    pin,
    version: 1,
    expiresAt,
    expiresInDays: expires_in_days,
  }
}

/**
 * Re-publish to an existing deployment — same viewer URL and PIN, cicero
 * increments the version and issues a fresh SAS URL for the new blob prefix.
 *
 * Returns `{ ok: false }` when cicero rejects (revoked / expired / not_found);
 * the caller is expected to fall back to publishDeckArtifacts in those cases.
 */
export async function updateDeckArtifacts(
  token: string,
  files: readonly PublishFile[],
): Promise<UpdateDeckResult> {
  validateFiles(files, 'updateDeckArtifacts')

  const cicero = await getCiceroClient()
  const toolResult = await cicero.callTool({
    name: 'update_pitchdeck',
    arguments: { token },
  })

  const payload = parseToolResultJson<UpdateResponse>(toolResult, 'update_pitchdeck')

  if (payload.success === false) {
    return classifyUpdateError(payload.error)
  }

  const { viewer_url, upload_url, sas_token, version, expires_at } = payload
  if (!upload_url || !sas_token || !viewer_url) {
    throw new Error(
      `updatePitchdeck response missing required fields: ${Object.keys(payload).join(', ')}`,
    )
  }

  await uploadFilesToSas(upload_url, sas_token, files)

  return {
    ok: true,
    viewerUrl: viewer_url,
    version,
    expiresAt: expires_at,
  }
}
