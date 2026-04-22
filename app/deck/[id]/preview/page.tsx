// ---------------------------------------------------------------------------
// Preview page — server component.
//
// The iframe + sandbox in PreviewShell guarantees the output template's CSS
// cannot leak into the editor (and vice versa).
// ---------------------------------------------------------------------------

import { notFound } from 'next/navigation'
import { deckStorage } from '@/lib/deck-storage'
import { reconcileDeployment, needsReconcile } from '@/lib/deployment-sync'
import { renderDeck } from '@/output-template'
import { SECTIONS } from '@/lib/theme'
import type { SectionStatuses } from '@/lib/types'
import PreviewShell from './PreviewShell'

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  let deck = await deckStorage.get(id)
  if (!deck) notFound()

  // If the deck has a deployment and it hasn't been synced recently, ask
  // cicero what the current state is. Keeps the Manage menu (rollback /
  // revoke) from acting on stale version numbers when a Claude Desktop user
  // has touched the same deck out-of-band. Best-effort: an MCP outage
  // shouldn't prevent the preview from rendering.
  if (needsReconcile(deck.publishedDeployment)) {
    try {
      const report = await reconcileDeployment(deck)
      if (report?.changed) {
        // Refetch so derived fields (clientName etc.) reflect the patch.
        const refreshed = await deckStorage.get(id)
        if (refreshed) deck = refreshed
      }
    } catch {
      // Swallow and proceed with the stored deck. The user can still hit
      // "Sync with server" from the DeploymentMenu if they need to retry.
    }
  }

  const result = renderDeck(deck, { mode: 'preview' })

  // Derive section statuses from the authoritative section data, not from
  // the stored `deck.sectionStatuses` field (which can drift — editors
  // don't always flip it to 'complete' when content is saved). Uses the
  // same isSectionComplete helper the dashboard relies on.
  const liveSectionStatuses = SECTIONS.reduce<SectionStatuses>((acc, section) => {
    acc[section.id] = deckStorage.isSectionComplete(deck, section.id)
      ? 'complete'
      : 'empty'
    return acc
  }, { ...deck.sectionStatuses })

  return (
    <PreviewShell
      deckId={id}
      deckTitle={`${deck.clientName || 'Untitled'} — ${deck.roleTitle || 'Proposal'}`}
      clientName={deck.clientName || ''}
      locale={deck.locale}
      sectionStatuses={liveSectionStatuses}
      mainHtml={result.html}
      candidates={result.candidates.map((c, i) => ({
        slug: c.slug,
        label: deck.sections.candidates.candidates[i]?.name ?? c.slug,
        html: c.html,
      }))}
      publishedDeployment={deck.publishedDeployment}
    />
  )
}
