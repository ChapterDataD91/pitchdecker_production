// ---------------------------------------------------------------------------
// POST /api/publish/[id]
//
// Smart publish: if the deck has an active deployment, call updatePitchdeck
// to re-publish to the same viewer URL + PIN (bumps version). Otherwise —
// or if the existing deployment is revoked/expired — call deployPitchdeck
// to mint a new token + PIN. Either way, persist the deployment pointer
// back onto the Deck document in Mongo.
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server'
import { deckStorage } from '@/lib/deck-storage'
import {
  publishDeckArtifacts,
  updateDeckArtifacts,
  type PublishFile,
} from '@/lib/mcp/deployment'
import { renderDeck } from '@/output-template'
import { SECTIONS } from '@/lib/theme'
import type { PublishedDeployment, SectionStatuses } from '@/lib/types'

function daysUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now()
  return Math.max(0, Math.round(ms / 86400000))
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params

  // --- 1. Fetch -----------------------------------------------------------
  const deck = await deckStorage.get(id)
  if (!deck) {
    return NextResponse.json({ error: 'Deck not found' }, { status: 404 })
  }

  // --- 2. Derive live section statuses from actual data ------------------
  // deck.sectionStatuses in Mongo can lag behind content — editors don't
  // always flip it to 'complete'. Use the same helper the dashboard uses so
  // validation and render both see the true state.
  const liveSectionStatuses = SECTIONS.reduce<SectionStatuses>((acc, s) => {
    acc[s.id] = deckStorage.isSectionComplete(deck, s.id) ? 'complete' : 'empty'
    return acc
  }, { ...deck.sectionStatuses })

  const empty = SECTIONS
    .filter((s) => liveSectionStatuses[s.id] === 'empty')
    .map((s) => s.id)

  if (empty.length > 0) {
    return NextResponse.json(
      {
        error: 'Deck is incomplete',
        emptySections: empty,
        message: `Cannot publish: ${empty.length} section(s) still empty: ${empty.join(', ')}`,
      },
      { status: 400 },
    )
  }

  // --- 3. Render ----------------------------------------------------------
  // Pass a deck carrying the live statuses so the publish renderer doesn't
  // skip sections based on stale flags.
  const deckForRender = { ...deck, sectionStatuses: liveSectionStatuses }
  let files: PublishFile[]
  try {
    const result = renderDeck(deckForRender, { mode: 'publish' })
    files = [
      { path: 'index.html', content: result.html },
      ...result.candidates.map((c) => ({
        path: `candidates/${c.slug}.html`,
        content: c.html,
      })),
    ]
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { error: 'Render failed', message },
      { status: 500 },
    )
  }

  const now = new Date().toISOString()
  const existing = deck.publishedDeployment

  // --- 4a. Update path ----------------------------------------------------
  if (existing && existing.status === 'active') {
    try {
      const result = await updateDeckArtifacts(existing.token, files)
      if (result.ok) {
        const nextDeployment: PublishedDeployment = {
          ...existing,
          version: result.version,
          viewerUrl: result.viewerUrl,
          expiresAt: result.expiresAt,
          status: 'active',
          lastPublishedAt: now,
        }
        await deckStorage.update(id, { publishedDeployment: nextDeployment })
        return NextResponse.json({
          success: true,
          mode: 'update',
          publishedDeployment: nextDeployment,
          viewerUrl: nextDeployment.viewerUrl,
          pin: nextDeployment.pin,
          version: nextDeployment.version,
          expiresAt: nextDeployment.expiresAt,
          expiresInDays: daysUntil(nextDeployment.expiresAt),
          filesPublished: files.length,
        })
      }

      // Cicero says the deployment is gone — fall through to fresh deploy.
      // Local status gets flipped so the UI reflects reality next time even
      // if the fresh deploy itself fails.
      if (result.reason === 'revoked' || result.reason === 'expired' || result.reason === 'not_found') {
        await deckStorage.update(id, {
          publishedDeployment: {
            ...existing,
            status: result.reason === 'not_found' ? 'revoked' : result.reason,
          },
        })
      } else {
        return NextResponse.json(
          { error: 'Update failed', message: result.error },
          { status: 502 },
        )
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return NextResponse.json(
        { error: 'Update failed', message },
        { status: 502 },
      )
    }
  }

  // --- 4b. Fresh-deploy path (also fallback after revoked/expired) --------
  const replaced = Boolean(existing && existing.status !== 'active')
  let deployResult
  try {
    deployResult = await publishDeckArtifacts(
      deck.clientName || 'Unnamed Client',
      files,
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { error: 'Deploy failed', message },
      { status: 502 },
    )
  }

  const newDeployment: PublishedDeployment = {
    token: deployResult.token,
    pin: deployResult.pin,
    viewerUrl: deployResult.viewerUrl,
    version: 1,
    status: 'active',
    expiresAt: deployResult.expiresAt,
    firstPublishedAt: now,
    lastPublishedAt: now,
  }
  await deckStorage.update(id, { publishedDeployment: newDeployment })

  return NextResponse.json({
    success: true,
    mode: 'first',
    replaced,
    publishedDeployment: newDeployment,
    viewerUrl: newDeployment.viewerUrl,
    pin: newDeployment.pin,
    version: newDeployment.version,
    expiresAt: newDeployment.expiresAt,
    expiresInDays: deployResult.expiresInDays,
    filesPublished: files.length,
  })
}
