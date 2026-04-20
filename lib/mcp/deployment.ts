// ---------------------------------------------------------------------------
// Typed wrappers around the Cicero MCP deployment tools.
//
// Exports:
//   - publishDeckArtifacts(clientName, files)    → deploy_pitchdeck
//   - updateDeckArtifacts(token, files)          → update_pitchdeck (revoked/expired
//                                                  classified so the caller can
//                                                  gracefully fall back to deploy)
//   - rollbackDeployment(token, version)         → rollback_pitchdeck
//   - revokeDeployment(token)                    → revoke_pitchdeck
//   - renameDeployment(token, newClientName)     → rename_pitchdeck
//   - listDeployments()                          → list_pitchdecks
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

export type ManagementErrorReason =
  | 'revoked'
  | 'expired'
  | 'not_found'
  | 'invalid_version'
  | 'unknown'

function classifyError(error: string): ManagementErrorReason {
  const lower = error.toLowerCase()
  if (lower.includes('revoked')) return 'revoked'
  if (lower.includes('expired')) return 'expired'
  if (lower.includes('not found') || lower.includes('permission')) return 'not_found'
  if (lower.includes('invalid version')) return 'invalid_version'
  return 'unknown'
}

function classifyUpdateError(error: string): UpdateDeckResult & { ok: false } {
  const reason = classifyError(error)
  // UpdateDeckResult doesn't include 'invalid_version' — fold it into 'unknown'.
  const narrowed: 'revoked' | 'expired' | 'not_found' | 'unknown' =
    reason === 'invalid_version' ? 'unknown' : reason
  return { ok: false, reason: narrowed, error }
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

// ---------------------------------------------------------------------------
// Management operations — rollback, revoke, rename
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type ManagementResult<Extra = {}> =
  | ({ ok: true } & Extra)
  | { ok: false; reason: ManagementErrorReason; error: string }

interface RollbackResponseOk {
  success: true
  version: number
  latest_version: number
  viewer_url: string
  client_name: string
  message: string
}

interface RevokeResponseOk {
  success: true
  token: string
  client_name: string
  message: string
}

interface RenameResponseOk {
  success: true
  token: string
  client_name: string
  message: string
}

interface ManagementResponseErr {
  success: false
  error: string
}

/**
 * Roll the live viewer back to an earlier version (cicero updates blob_prefix).
 * Previous versions remain in blob storage — nothing is destroyed.
 */
export async function rollbackDeployment(
  token: string,
  version: number,
): Promise<ManagementResult<{ version: number; latestVersion: number }>> {
  const cicero = await getCiceroClient()
  const toolResult = await cicero.callTool({
    name: 'rollback_pitchdeck',
    arguments: { token, version },
  })
  const payload = parseToolResultJson<RollbackResponseOk | ManagementResponseErr>(
    toolResult,
    'rollback_pitchdeck',
  )
  if (payload.success === false) {
    return { ok: false, reason: classifyError(payload.error), error: payload.error }
  }
  return { ok: true, version: payload.version, latestVersion: payload.latest_version }
}

/**
 * Permanently revoke access to the deployment. Irreversible from the MCP's
 * side — a new publish has to mint a fresh token + PIN.
 */
export async function revokeDeployment(
  token: string,
): Promise<ManagementResult> {
  const cicero = await getCiceroClient()
  const toolResult = await cicero.callTool({
    name: 'revoke_pitchdeck',
    arguments: { token },
  })
  const payload = parseToolResultJson<RevokeResponseOk | ManagementResponseErr>(
    toolResult,
    'revoke_pitchdeck',
  )
  if (payload.success === false) {
    return { ok: false, reason: classifyError(payload.error), error: payload.error }
  }
  return { ok: true }
}

/**
 * Rename the client label on the deployment. Changes only cicero's stored
 * client_name (shown on the PIN page and in listPitchdecks). Does not touch
 * the published deck content — callers that want to sync deck.clientName
 * should do that separately.
 */
export async function renameDeployment(
  token: string,
  newClientName: string,
): Promise<ManagementResult<{ clientName: string }>> {
  const cicero = await getCiceroClient()
  const toolResult = await cicero.callTool({
    name: 'rename_pitchdeck',
    arguments: { token, new_client_name: newClientName },
  })
  const payload = parseToolResultJson<RenameResponseOk | ManagementResponseErr>(
    toolResult,
    'rename_pitchdeck',
  )
  if (payload.success === false) {
    return { ok: false, reason: classifyError(payload.error), error: payload.error }
  }
  return { ok: true, clientName: payload.client_name }
}

// ---------------------------------------------------------------------------
// List deployments — used for reconciliation
// ---------------------------------------------------------------------------

export interface DeploymentSummary {
  token: string
  clientName: string
  viewerUrl: string
  status: 'active' | 'revoked' | 'expired'
  version: number
  expiresAt: string
  createdAt: string
  lastAccessed: string | null
  accessCount: number
}

interface ListPitchdecksResponse {
  total: number
  pitchdecks: Array<{
    token: string
    client_name: string
    viewer_url: string
    status: string
    current_version: number
    expires_at: string
    created_at: string
    last_accessed: string | null
    access_count: number
  }>
}

function normaliseStatus(s: string): 'active' | 'revoked' | 'expired' {
  if (s === 'revoked' || s === 'expired') return s
  return 'active'
}

/**
 * Lists all deployments the calling principal can see. In HTTP auth mode
 * cicero filters to decks created by that principal; in stdio/dev mode it
 * returns everything. Used for reconciliation on preview open.
 */
export async function listDeployments(): Promise<DeploymentSummary[]> {
  const cicero = await getCiceroClient()
  const toolResult = await cicero.callTool({
    name: 'list_pitchdecks',
    arguments: {},
  })
  const payload = parseToolResultJson<ListPitchdecksResponse>(
    toolResult,
    'list_pitchdecks',
  )
  return payload.pitchdecks.map((p) => ({
    token: p.token,
    clientName: p.client_name,
    viewerUrl: p.viewer_url,
    status: normaliseStatus(p.status),
    version: p.current_version || 1,
    expiresAt: p.expires_at,
    createdAt: p.created_at,
    lastAccessed: p.last_accessed,
    accessCount: p.access_count,
  }))
}
