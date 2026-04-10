// ---------------------------------------------------------------------------
// Cicero MCP client singleton — connects to the cicero MCP server over HTTP.
//
// Pattern mirrors lib/db/postgres.ts and lib/db/mongodb.ts: lazy init, one
// connection reused across requests.
//
// Dev:   CICERO_URL=http://localhost:3001/mcp (cicero running with SKIP_AUTH=true)
// Prod:  CICERO_URL=https://<container-app>.azurecontainerapps.io/mcp
// ---------------------------------------------------------------------------

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { getCiceroAuthHeaders } from './cicero-auth'

let client: Client | null = null
let connectPromise: Promise<Client> | null = null

export async function getCiceroClient(): Promise<Client> {
  if (client) return client

  // Prevent concurrent connection attempts (singleflight pattern)
  if (connectPromise) return connectPromise

  connectPromise = (async () => {
    const url = process.env.CICERO_URL
    if (!url) {
      throw new Error(
        'CICERO_URL is not set. In dev: set to http://localhost:3001/mcp and run cicero with SKIP_AUTH=true.',
      )
    }

    const headers = await getCiceroAuthHeaders()

    const transport = new StreamableHTTPClientTransport(new URL(url), {
      requestInit: { headers },
    })

    const c = new Client(
      { name: 'pitchdecker', version: '0.1.0' },
      { capabilities: {} },
    )

    await c.connect(transport)
    client = c
    return client
  })()

  try {
    return await connectPromise
  } catch (err) {
    // Clear the promise so the next call retries
    connectPromise = null
    throw err
  }
}

export async function closeCiceroClient(): Promise<void> {
  if (client) {
    await client.close()
    client = null
    connectPromise = null
  }
}
