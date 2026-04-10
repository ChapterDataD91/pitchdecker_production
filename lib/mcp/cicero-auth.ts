// ---------------------------------------------------------------------------
// Cicero MCP server auth — provides headers for requests to cicero.
//
// Dev:  SKIP_AUTH_TO_CICERO=true → returns empty headers (cicero also runs
//       with SKIP_AUTH=true locally on port 3001).
// Prod: Uses Azure client credentials flow via @azure/identity. The library
//       caches tokens and refreshes on expiry internally.
// ---------------------------------------------------------------------------

import { ClientSecretCredential } from '@azure/identity'

let credential: ClientSecretCredential | null = null

function getCredential(): ClientSecretCredential {
  if (credential) return credential

  const tenantId = process.env.AZURE_TENANT_ID
  const clientId = process.env.AZURE_CLIENT_ID
  const clientSecret = process.env.AZURE_CLIENT_SECRET

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      'Azure credentials missing for cicero auth. Required: AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET',
    )
  }

  credential = new ClientSecretCredential(tenantId, clientId, clientSecret)
  return credential
}

export async function getCiceroAuthHeaders(): Promise<Record<string, string>> {
  if (process.env.SKIP_AUTH_TO_CICERO === 'true') {
    return {}
  }

  const ciceroAppId = process.env.CICERO_APP_ID
  if (!ciceroAppId) {
    throw new Error('CICERO_APP_ID is not set')
  }

  const token = await getCredential().getToken(`api://${ciceroAppId}/.default`)
  if (!token) {
    throw new Error('Failed to acquire cicero token from Azure')
  }

  return { Authorization: `Bearer ${token.token}` }
}
