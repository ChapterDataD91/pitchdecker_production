'use client'

// ---------------------------------------------------------------------------
// Preview iframe shell (client component).
//
// Owns the currently-selected document (main deck vs. a candidate page) and
// renders it inside a sandboxed iframe via srcDoc. The iframe boundary is
// what guarantees CSS isolation between the editor (Tailwind / Inter) and the
// output template (coranto-2 / cream bg).
// ---------------------------------------------------------------------------

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface CandidateEntry {
  slug: string
  label: string
  html: string
}

interface PreviewShellProps {
  deckId: string
  deckTitle: string
  mainHtml: string
  candidates: CandidateEntry[]
}

type View =
  | { kind: 'main' }
  | { kind: 'candidate'; slug: string }

export default function PreviewShell({
  deckId,
  deckTitle,
  mainHtml,
  candidates,
}: PreviewShellProps) {
  const router = useRouter()
  const [view, setView] = useState<View>({ kind: 'main' })

  const currentHtml =
    view.kind === 'main'
      ? mainHtml
      : (candidates.find((c) => c.slug === view.slug)?.html ?? mainHtml)

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

        <div className="flex items-center gap-3">
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
      </header>

      <iframe
        key={view.kind === 'main' ? '__main__' : view.slug}
        title="Deck preview"
        srcDoc={currentHtml}
        sandbox="allow-same-origin allow-scripts"
        className="h-full w-full flex-1 border-0 bg-white"
      />
    </div>
  )
}
