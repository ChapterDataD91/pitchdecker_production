'use client'

import { useState, useCallback } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { TeamMember } from '@/lib/types'
import { useEditorStore } from '@/lib/store/editor-store'
import LoadingDots from '@/components/ui/LoadingDots'

interface TeamMemberCardProps {
  member: TeamMember
  group: 'leadTeam' | 'network'
  onBioChange: (id: string, bio: string) => void
  onRemove: (id: string) => void
  onMove: (id: string) => void
}

export default function TeamMemberCard({
  member,
  group,
  onBioChange,
  onRemove,
  onMove,
}: TeamMemberCardProps) {
  const [rewriteLoading, setRewriteLoading] = useState(false)
  const [rewriteError, setRewriteError] = useState<string | null>(null)
  const [rewritten, setRewritten] = useState<string | null>(null)

  const deck = useEditorStore((s) => s.deck)

  const handleRewrite = useCallback(async () => {
    if (!deck) return
    setRewriteLoading(true)
    setRewriteError(null)
    try {
      const cover = deck.sections.cover
      const res = await fetch('/api/ai/team/rewrite-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberName: member.name,
          memberTitle: member.title,
          currentBio: member.bio,
          group,
          deckContext: {
            clientName: cover.clientName || deck.clientName,
            roleTitle: cover.roleTitle || deck.roleTitle,
            coverIntro: cover.introParagraph || undefined,
          },
          locale: deck.locale,
        }),
      })
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as {
          error?: string
        }
        throw new Error(payload.error ?? 'Rewrite failed')
      }
      const { rewritten: result } = (await res.json()) as { rewritten: string }
      setRewritten(result)
    } catch (err) {
      setRewriteError(err instanceof Error ? err.message : 'Rewrite failed')
    } finally {
      setRewriteLoading(false)
    }
  }, [deck, member.name, member.title, member.bio, group])

  function acceptRewrite() {
    if (rewritten) onBioChange(member.id, rewritten)
    setRewritten(null)
    setRewriteError(null)
  }

  function cancelRewrite() {
    setRewritten(null)
    setRewriteError(null)
  }

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: member.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleBioChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onBioChange(member.id, e.target.value)
    },
    [member.id, onBioChange],
  )

  const moveLabel = group === 'leadTeam' ? 'Move to Network' : 'Move to Lead Team'

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`group relative rounded-lg border border-border bg-bg overflow-hidden transition-shadow ${
          isDragging ? 'shadow-lg opacity-75 z-10' : 'hover:shadow-sm'
        }`}
      >
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-bg-muted/80 to-transparent z-10"
        >
          <svg className="h-4 w-4 text-text-tertiary" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="5" cy="4" r="1.2" />
            <circle cx="11" cy="4" r="1.2" />
            <circle cx="5" cy="8" r="1.2" />
            <circle cx="11" cy="8" r="1.2" />
            <circle cx="5" cy="12" r="1.2" />
            <circle cx="11" cy="12" r="1.2" />
          </svg>
        </div>

        {/* Actions (top right) */}
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {/* Move between groups */}
          <button
            onClick={() => onMove(member.id)}
            title={moveLabel}
            className="h-7 w-7 flex items-center justify-center rounded-md bg-bg/90 border border-border text-text-secondary hover:text-accent hover:border-accent transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
          </button>

          {/* Remove */}
          <button
            onClick={() => onRemove(member.id)}
            title="Remove member"
            className="h-7 w-7 flex items-center justify-center rounded-md bg-bg/90 border border-border text-text-secondary hover:text-error hover:border-error transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Photo */}
        <div className="aspect-[16/10] bg-bg-muted overflow-hidden">
          {member.photoUrl ? (
            <img
              src={member.photoUrl}
              alt={member.name}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-tertiary">
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h4 className="text-sm font-semibold text-text">{member.name}</h4>
          <p className="text-xs font-medium text-accent uppercase tracking-wider mt-0.5">
            {member.title}
          </p>

          {/* Editable bio */}
          <div className="mt-3">
            <textarea
              value={member.bio}
              onChange={handleBioChange}
              placeholder={
                group === 'leadTeam'
                  ? 'Describe their role in this search mandate...'
                  : 'Brief expertise summary (e.g. Healthcare expert, COO/CFO specialist)...'
              }
              rows={group === 'leadTeam' ? 3 : 2}
              className="w-full text-xs text-text-secondary leading-relaxed bg-transparent border-0 border-b border-transparent focus:border-border-strong resize-none focus:outline-none placeholder:text-text-placeholder transition-colors"
            />
          </div>

          {/* AI rewrite button — outside the text field */}
          <button
            onClick={handleRewrite}
            disabled={rewriteLoading || !deck}
            className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border text-xs font-medium text-text-secondary hover:text-accent hover:border-accent hover:bg-accent-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {rewriteLoading ? (
              <>
                <LoadingDots />
                <span>Rewriting…</span>
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
                Rewrite with AI
              </>
            )}
          </button>

          {rewriteError && (
            <p className="mt-2 text-xs text-rose-600">{rewriteError}</p>
          )}

          {rewritten !== null && (
            <div className="mt-3 rounded-md border border-accent/40 bg-accent-light p-3 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-accent">
                AI rewrite — preview
              </p>
              <p className="text-xs text-text leading-relaxed whitespace-pre-wrap">
                {rewritten}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={acceptRewrite}
                  className="rounded-md bg-accent px-3 py-1 text-xs font-medium text-white hover:bg-accent-hover transition-colors"
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={cancelRewrite}
                  className="rounded-md px-3 py-1 text-xs font-medium text-text-secondary hover:text-text hover:bg-bg-hover transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Expertise tags */}
          {member.expertiseTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {member.expertiseTags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-bg-muted text-text-tertiary"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
