'use client'

// ---------------------------------------------------------------------------
// Preview iframe shell (client component).
//
// Owns the currently-selected document (main deck vs. a candidate page) and
// renders it inside a sandboxed iframe via srcDoc. The iframe boundary is
// what guarantees CSS isolation between the editor (Tailwind / Inter) and the
// output template (coranto-2 / cream bg).
//
// Also owns the publish flow: button state machine, success modal, error toast.
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import Toast from '@/components/ui/Toast'
import LoadingDots from '@/components/ui/LoadingDots'
import PublishModal, { type PublishMode } from '@/components/ui/PublishModal'
import { SECTIONS, type SectionId } from '@/lib/theme'
import type { PublishedDeployment, SectionStatuses } from '@/lib/types'

interface CandidateEntry {
  slug: string
  label: string
  html: string
}

interface PublishResult {
  viewerUrl: string
  pin: string
  expiresInDays: number
  mode: PublishMode
  version: number
  replaced?: boolean
}

interface PreviewShellProps {
  deckId: string
  deckTitle: string
  clientName: string
  sectionStatuses: SectionStatuses
  mainHtml: string
  candidates: CandidateEntry[]
  publishedDeployment?: PublishedDeployment
}

type View =
  | { kind: 'main' }
  | { kind: 'candidate'; slug: string }

type PublishStatus = 'idle' | 'publishing' | 'done'

export default function PreviewShell({
  deckId,
  deckTitle,
  clientName,
  sectionStatuses,
  mainHtml,
  candidates,
  publishedDeployment,
}: PreviewShellProps) {
  const hasActiveDeployment = publishedDeployment?.status === 'active'
  const router = useRouter()
  const [view, setView] = useState<View>({ kind: 'main' })

  const [publishStatus, setPublishStatus] = useState<PublishStatus>('idle')
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'info' } | null>(null)

  const { completeCount, totalCount, emptyLabels } = useMemo(() => {
    const total = SECTIONS.length
    const empties: string[] = []
    for (const section of SECTIONS) {
      const status = sectionStatuses[section.id as SectionId]
      if (status === 'empty') empties.push(section.label)
    }
    return {
      completeCount: total - empties.length,
      totalCount: total,
      emptyLabels: empties,
    }
  }, [sectionStatuses])

  const isComplete = emptyLabels.length === 0

  const currentHtml =
    view.kind === 'main'
      ? mainHtml
      : (candidates.find((c) => c.slug === view.slug)?.html ?? mainHtml)

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      const data = e.data as { type?: string; slug?: string } | undefined
      if (!data || typeof data !== 'object') return
      if (data.type === 'pitchdecker:navigate-candidate' && data.slug) {
        const exists = candidates.some((c) => c.slug === data.slug)
        if (exists) setView({ kind: 'candidate', slug: data.slug })
      } else if (data.type === 'pitchdecker:navigate-main') {
        setView({ kind: 'main' })
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [candidates])

  async function handlePublish() {
    if (publishStatus === 'publishing') return

    if (!isComplete) {
      const preview =
        emptyLabels.length <= 3
          ? emptyLabels.join(', ')
          : `${emptyLabels.slice(0, 2).join(', ')} + ${emptyLabels.length - 2} more`
      setToast({
        message: `${emptyLabels.length} section${emptyLabels.length === 1 ? '' : 's'} still empty: ${preview}. Finish ${emptyLabels.length === 1 ? 'it' : 'them'} to publish.`,
        type: 'info',
      })
      return
    }

    setPublishStatus('publishing')
    setToast(null)
    try {
      const res = await fetch(`/api/publish/${deckId}`, { method: 'POST' })
      const body = await res.json()
      if (!res.ok) {
        const message = body?.message || body?.error || 'Publish failed'
        throw new Error(message)
      }
      setPublishResult({
        viewerUrl: body.viewerUrl,
        pin: body.pin,
        expiresInDays: body.expiresInDays,
        mode: body.mode ?? 'first',
        version: body.version ?? 1,
        replaced: body.replaced,
      })
      setPublishStatus('done')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Publish failed'
      setToast({ message: `Couldn't publish: ${message}`, type: 'error' })
      setPublishStatus('idle')
    }
  }

  function closeModal() {
    setPublishResult(null)
    setPublishStatus('idle')
  }

  return (
    <div className="flex h-screen w-full flex-col bg-bg">
      <header className="flex items-center justify-between border-b border-border-subtle bg-white px-4 py-2.5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/deck/${deckId}`)}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text"
            aria-label="Back to editor"
          >
            ← Editor
          </button>
          <div className="h-4 w-px bg-border" />
          <span className="text-sm font-medium text-text">{deckTitle}</span>
          <span className="rounded bg-bg-muted px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-text-secondary">
            Preview
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label
              htmlFor="preview-view"
              className="text-xs font-medium text-text-secondary"
            >
              Viewing:
            </label>
            <select
              id="preview-view"
              value={view.kind === 'main' ? '__main__' : view.slug}
              onChange={(e) => {
                const v = e.target.value
                setView(v === '__main__' ? { kind: 'main' } : { kind: 'candidate', slug: v })
              }}
              className="rounded-md border border-border bg-white px-3 py-1.5 text-sm text-text transition-colors hover:border-border-strong focus:border-accent focus:outline-none"
            >
              <option value="__main__">Main deck (index.html)</option>
              {candidates.length > 0 && (
                <optgroup label="Candidate pages">
                  {candidates.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.label}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div className="h-4 w-px bg-border" />

          <CompletionPill
            complete={completeCount}
            total={totalCount}
            isReady={isComplete}
          />

          <PublishButton
            status={publishStatus}
            onClick={handlePublish}
            idleLabel={hasActiveDeployment ? 'Republish' : 'Publish deck'}
          />
        </div>
      </header>

      <iframe
        key={view.kind === 'main' ? '__main__' : view.slug}
        title="Deck preview"
        srcDoc={currentHtml}
        sandbox="allow-same-origin allow-scripts"
        className="h-full w-full flex-1 border-0 bg-white"
      />

      <PublishModal
        result={publishResult}
        clientName={clientName}
        onClose={closeModal}
      />

      <Toast
        message={toast?.message ?? ''}
        type={toast?.type ?? 'info'}
        visible={toast !== null}
        onClose={() => setToast(null)}
      />
    </div>
  )
}

function CompletionPill({
  complete,
  total,
  isReady,
}: {
  complete: number
  total: number
  isReady: boolean
}) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-text-secondary">
      <span
        className={`h-1.5 w-1.5 rounded-full ${isReady ? 'bg-success' : 'bg-warning'}`}
        aria-hidden="true"
      />
      <span className="tabular-nums">
        {complete} of {total}
      </span>
    </span>
  )
}

function PublishButton({
  status,
  onClick,
  idleLabel,
}: {
  status: PublishStatus
  onClick: () => void
  idleLabel: string
}) {
  const isPublishing = status === 'publishing'
  return (
    <button
      onClick={onClick}
      disabled={isPublishing}
      className="relative inline-flex min-w-[132px] items-center justify-center gap-2 rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-white transition-[background-color,transform] hover:bg-accent-hover hover:-translate-y-[0.5px] active:scale-[0.98] disabled:cursor-default disabled:hover:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isPublishing ? (
          <motion.span
            key="publishing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="inline-flex items-center gap-2"
          >
            <span>Publishing</span>
            <LoadingDots className="[&>span]:bg-white/80" />
          </motion.span>
        ) : (
          <motion.span
            key={`idle-${idleLabel}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            {idleLabel}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}
