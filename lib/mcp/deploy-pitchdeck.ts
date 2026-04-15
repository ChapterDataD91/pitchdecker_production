// ---------------------------------------------------------------------------
// Typed wrapper around the Cicero MCP `deployPitchdeck` tool.
//
// Flow:
//   1. Call the MCP tool → returns { viewer_url, pin, upload_url, sas_token, ... }
//   2. PUT each file to the SAS upload URL (x-ms-blob-type: BlockBlob)
//   3. Return the viewer URL + PIN to the caller
//
// The MCP tool returns a JSON-stringified payload as the first text content
// block — see /Users/daan/cicero_mcp/src/tools/deployPitchdeck.ts L47-63.
// ---------------------------------------------------------------------------

import { getCiceroClient } from './cicero-client'

interface DeployPitchdeckResponse {
  viewer_url: string
  pin: string
  upload_url: string
  sas_token: string
  client_name: string
  expires_in_days: number
  instructions?: string
}

export interface PublishFile {
  /** Relative path under the deck blob prefix (e.g. "index.html" or "candidates/foo.html") */
  path: string
  /** File contents */
  content: string
  /** Content-Type header; defaults to "text/html; charset=utf-8" */
  contentType?: string
}

export interface PublishDeckResult {
  viewerUrl: string
  pin: string
  expiresInDays: number
}

/**
 * Call the MCP deployPitchdeck tool and upload the given files to the returned
 * SAS URL. Returns the viewer URL + PIN for the consultant to share.
 *
 * Throws if the MCP call fails or any file upload returns a non-2xx status.
 */
export async function publishDeckArtifacts(
  clientName: string,
  files: readonly PublishFile[],
  options: { expiresInDays?: number } = {},
): Promise<PublishDeckResult> {
  if (files.length === 0) {
    throw new Error('publishDeckArtifacts: no files to upload')
  }
  const hasIndex = files.some((f) => f.path === 'index.html')
  if (!hasIndex) {
    throw new Error('publishDeckArtifacts: files must include index.html at the root')
  }

  // --- 1. Invoke the MCP tool ---------------------------------------------
  const cicero = await getCiceroClient()
  const toolResult = await cicero.callTool({
    name: 'deployPitchdeck',
    arguments: {
      client_name: clientName,
      ...(options.expiresInDays !== undefined
        ? { expires_in_days: options.expiresInDays }
        : {}),
    },
  })

  const content = toolResult.content as Array<{ type: string; text?: string }>
  const text = content
    .filter((c) => c.type === 'text' && typeof c.text === 'string')
    .map((c) => c.text as string)
    .join('\n')

  if (!text) {
    throw new Error('deployPitchdeck returned no text content')
  }

  let payload: DeployPitchdeckResponse
  try {
    payload = JSON.parse(text) as DeployPitchdeckResponse
  } catch (err) {
    throw new Error(
      `deployPitchdeck returned non-JSON text: ${text.slice(0, 200)}${err instanceof Error ? ` (${err.message})` : ''}`,
    )
  }

  const { viewer_url, pin, upload_url, sas_token, expires_in_days } = payload
  if (!upload_url || !sas_token || !viewer_url || !pin) {
    throw new Error(
      `deployPitchdeck response missing required fields: ${Object.keys(payload).join(', ')}`,
    )
  }

  // --- 2. PUT each file to the SAS URL ------------------------------------
  const baseUrl = upload_url.replace(/\/+$/, '')
  const sas = sas_token.startsWith('?') ? sas_token : `?${sas_token}`

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

  // --- 3. Return viewer URL + PIN -----------------------------------------
  return {
    viewerUrl: viewer_url,
    pin,
    expiresInDays: expires_in_days,
  }
}
