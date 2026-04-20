'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useDashboardStore } from '@/lib/store/dashboard-store'
import { editorBrand } from '@/config/brand'
import CreateDeckDialog from '@/components/ui/CreateDeckDialog'
import EmptyState from '@/components/ui/EmptyState'
import LoadingDots from '@/components/ui/LoadingDots'

export default function DashboardPage() {
  const router = useRouter()
  const { decks, isLoading, error, fetchDecks, createDeck, deleteDeck } = useDashboardStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchDecks()
  }, [fetchDecks])

  async function handleCreate(clientName: string, roleTitle: string) {
    setIsCreating(true)
    const id = await createDeck(clientName, roleTitle)
    setIsCreating(false)

    if (id) {
      setDialogOpen(false)
      router.push(`/deck/${id}`)
    }
  }

  async function handleConfirmDelete(id: string) {
    setDeletingId(id)
    await deleteDeck(id)
    setDeletingId(null)
    setPendingDelete(null)
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="border-b border-border bg-bg">
        <div className="mx-auto flex max-w-4xl items-end justify-between px-8 py-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[2.5px] text-text-secondary">
              {editorBrand.name}
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-text">Pitch Decks</h1>
          </div>
          {!isLoading && !error && decks.length > 0 && (
            <button
              onClick={() => setDialogOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New Deck
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-8 py-10">
        {isLoading && (
          <div className="flex justify-center py-20">
            <LoadingDots />
          </div>
        )}

        {error && (
          <div className="rounded-md border border-error-light bg-error-light p-6 text-center">
            <p className="text-sm text-error">{error}</p>
            <button
              onClick={() => fetchDecks()}
              className="mt-3 text-sm font-medium text-accent hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !error && decks.length === 0 && (
          <EmptyState
            icon={
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-text-placeholder">
                <rect x="8" y="6" width="32" height="36" rx="4" stroke="currentColor" strokeWidth="2" />
                <path d="M16 16H32M16 22H28M16 28H24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            }
            title="Create your first pitch deck"
            description="Build professional pitch decks for your executive search mandates. Each deck has 11 customizable sections."
            action={{
              label: '+ New Deck',
              onClick: () => setDialogOpen(true),
            }}
          />
        )}

        {!isLoading && !error && decks.length > 0 && (
          <div className="grid gap-3">
            {decks.map((deck, index) => {
              const isPending = pendingDelete === deck.id
              const isDeleting = deletingId === deck.id

              return (
                <motion.div
                  key={deck.id}
                  className="group relative flex items-center justify-between rounded-lg border border-border bg-bg px-5 py-4 text-left shadow-xs transition-all hover:border-accent hover:shadow-sm"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {isPending ? (
                    /* Confirmation overlay */
                    <div className="flex w-full items-center justify-between gap-4">
                      <p className="truncate text-sm text-text">
                        Delete <span className="font-semibold">{deck.clientName}</span>
                        <span className="text-text-secondary"> — {deck.roleTitle}</span>?{' '}
                        <span className="text-text-tertiary">This cannot be undone.</span>
                      </p>
                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setPendingDelete(null)
                          }}
                          className="rounded-md px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text"
                          disabled={isDeleting}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleConfirmDelete(deck.id)
                          }}
                          className="inline-flex items-center gap-1.5 rounded-md bg-error px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-error/90 disabled:opacity-60"
                          disabled={isDeleting}
                        >
                          {isDeleting ? <LoadingDots /> : 'Delete'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => router.push(`/deck/${deck.id}`)}
                        className="flex min-w-0 flex-1 items-center justify-between text-left"
                      >
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-semibold text-text group-hover:text-accent">
                            {deck.clientName}
                          </h3>
                          <p className="mt-0.5 text-xs text-text-secondary">{deck.roleTitle}</p>
                        </div>

                        <div className="flex items-center gap-5 pl-4">
                          {/* Completion */}
                          <span className="text-xs text-text-secondary">
                            {deck.completedSections}/11
                          </span>

                          {/* Status badge */}
                          <span
                            className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                              deck.status === 'complete'
                                ? 'bg-success-light text-success'
                                : 'bg-bg-muted text-text-secondary'
                            }`}
                          >
                            {deck.status === 'draft' ? 'Draft' : deck.status === 'in-progress' ? 'In Progress' : 'Complete'}
                          </span>

                          {/* Published-deployment badge */}
                          {deck.publishedDeployment && (
                            <span
                              className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                                deck.publishedDeployment.status === 'active'
                                  ? 'bg-success-light text-success'
                                  : deck.publishedDeployment.status === 'revoked'
                                    ? 'bg-error-light text-error'
                                    : 'bg-warning-light text-warning'
                              }`}
                              title={
                                deck.publishedDeployment.status === 'active'
                                  ? `Published · v${deck.publishedDeployment.version}`
                                  : deck.publishedDeployment.status === 'revoked'
                                    ? 'Revoked — access disabled'
                                    : 'Expired — link no longer works'
                              }
                            >
                              {deck.publishedDeployment.status === 'active'
                                ? `Published v${deck.publishedDeployment.version}`
                                : deck.publishedDeployment.status === 'revoked'
                                  ? 'Revoked'
                                  : 'Expired'}
                            </span>
                          )}

                          {/* Date */}
                          <span className="hidden text-xs text-text-tertiary sm:inline">
                            {formatDate(deck.updatedAt)}
                          </span>

                          {/* Arrow */}
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            className="shrink-0 text-text-tertiary transition-colors group-hover:text-accent"
                          >
                            <path
                              d="M6 4L10 8L6 12"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </button>

                      {/* Delete trigger — hover-revealed.
                         TODO(sso): hide unless current user owns this deck. */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setPendingDelete(deck.id)
                        }}
                        className="ml-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-tertiary opacity-0 transition-all hover:bg-error-light hover:text-error focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-error group-hover:opacity-100"
                        aria-label={`Delete ${deck.clientName} — ${deck.roleTitle}`}
                        title="Delete deck"
                      >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2.5 4h11M6 4V2.5a1 1 0 011-1h2a1 1 0 011 1V4M4.5 4l.5 9.5a1 1 0 001 1h4a1 1 0 001-1L12 4M6.5 7v5M9.5 7v5" />
                        </svg>
                      </button>
                    </>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </main>

      {/* Create deck dialog */}
      <CreateDeckDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreate={handleCreate}
        isCreating={isCreating}
      />
    </div>
  )
}
