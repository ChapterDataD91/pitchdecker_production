// ---------------------------------------------------------------------------
// Reconciliation helper — pulls cicero's authoritative view via list_pitchdecks
// and patches the pitchdecker Mongo record when drift is detected.
//
// Drift happens when someone uses the Claude Desktop MCP client to rollback,
// revoke, rename, or otherwise alter a deck directly — pitchdecker never
// sees those calls, so the stored publishedDeployment pointer can fall out
// of sync. This helper is the safety net.
// ---------------------------------------------------------------------------

import { deckStorage } from './deck-storage'
import { listDeployments } from './mcp/deployment'
import type { Deck, PublishedDeployment } from './types'

export interface ReconcileReport {
  /** The up-to-date deployment pointer after reconciliation. */
  deployment: PublishedDeployment
  /** True when Mongo was actually patched. */
  changed: boolean
  /** Human-readable list of fields that drifted (empty when no change). */
  drifted: Array<'version' | 'status' | 'expiresAt' | 'clientName'>
}

/**
 * Reconcile a single deck's publishedDeployment against cicero.
 *
 * Returns null when the deck has no stored deployment (nothing to sync) or
 * when the token is missing. Throws if the MCP call itself fails — callers
 * that want to survive an MCP outage should catch and fall back to the
 * pre-existing Mongo value.
 */
export async function reconcileDeployment(
  deck: Deck,
): Promise<ReconcileReport | null> {
  const existing = deck.publishedDeployment
  if (!existing) return null

  const deployments = await listDeployments()
  const remote = deployments.find((d) => d.token === existing.token)

  const now = new Date().toISOString()

  if (!remote) {
    // Token no longer visible to us — treat as revoked/deleted upstream.
    if (existing.status === 'revoked') {
      const synced: PublishedDeployment = { ...existing, lastSyncedAt: now }
      await deckStorage.update(deck.id, { publishedDeployment: synced })
      return { deployment: synced, changed: false, drifted: [] }
    }
    const patched: PublishedDeployment = {
      ...existing,
      status: 'revoked',
      lastSyncedAt: now,
    }
    await deckStorage.update(deck.id, { publishedDeployment: patched })
    return { deployment: patched, changed: true, drifted: ['status'] }
  }

  const drifted: ReconcileReport['drifted'] = []
  if (remote.version !== existing.version) drifted.push('version')
  if (remote.status !== existing.status) drifted.push('status')
  if (remote.expiresAt !== existing.expiresAt) drifted.push('expiresAt')
  const clientNameDrifted = remote.clientName !== deck.clientName
  if (clientNameDrifted) drifted.push('clientName')

  if (drifted.length === 0) {
    const synced: PublishedDeployment = { ...existing, lastSyncedAt: now }
    await deckStorage.update(deck.id, { publishedDeployment: synced })
    return { deployment: synced, changed: false, drifted: [] }
  }

  const patched: PublishedDeployment = {
    ...existing,
    version: remote.version,
    status: remote.status,
    expiresAt: remote.expiresAt,
    lastSyncedAt: now,
  }

  // Apply top-level + cover clientName sync when cicero says the name
  // changed. Consistent with the rename endpoint's "option A sync" behavior.
  if (clientNameDrifted) {
    await deckStorage.updateSection(deck.id, 'cover', {
      clientName: remote.clientName,
    })
    await deckStorage.update(deck.id, {
      clientName: remote.clientName,
      publishedDeployment: patched,
    })
  } else {
    await deckStorage.update(deck.id, { publishedDeployment: patched })
  }

  return { deployment: patched, changed: true, drifted }
}

/**
 * Whether a deployment's lastSyncedAt is older than the given TTL (ms).
 * Used to decide if the preview-open auto-sync should fire.
 */
export function needsReconcile(
  deployment: PublishedDeployment | undefined,
  ttlMs: number = 60_000,
): boolean {
  if (!deployment) return false
  if (!deployment.lastSyncedAt) return true
  const last = new Date(deployment.lastSyncedAt).getTime()
  if (Number.isNaN(last)) return true
  return Date.now() - last > ttlMs
}
