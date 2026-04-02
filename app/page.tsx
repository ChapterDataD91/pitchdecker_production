'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useDashboardStore } from '@/lib/store/dashboard-store'
import CreateDeckDialog from '@/components/ui/CreateDeckDialog'
import EmptyState from '@/components/ui/EmptyState'
import LoadingDots from '@/components/ui/LoadingDots'

export default function DashboardPage() {
  const router = useRouter()
  const { decks, isLoading, error, fetchDecks, createDeck } = useDashboardStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

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
        <div className="mx-auto max-w-4xl px-8 py-6">
          <p className="text-[10px] font-bold uppercase tracking-[2.5px] text-text-secondary">
            Top of Minds
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-text">Pitch Decks</h1>
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
            {decks.map((deck, index) => (
              <motion.button
                key={deck.id}
                onClick={() => router.push(`/deck/${deck.id}`)}
                className="group flex items-center justify-between rounded-lg border border-border bg-bg px-5 py-4 text-left shadow-xs transition-all hover:border-accent hover:shadow-sm"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
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
              </motion.button>
            ))}
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
