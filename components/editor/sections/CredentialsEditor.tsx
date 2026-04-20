'use client'

import { useState, useMemo } from 'react'
import { v4 as uuid } from 'uuid'
import type { CredentialsSection, CredentialAxis, Placement } from '@/lib/types'
import { useEditorStore } from '@/lib/store/editor-store'
import { useAIStore } from '@/lib/store/ai-store'
import { fetchWithRetry, mapLimit } from '@/lib/async/concurrency'
import LoadingDots from '@/components/ui/LoadingDots'
import ClientList from '@/components/editor/sections/credentials/ClientList'
import type { ClientPlacement } from '@/app/api/ai/credentials/find-placements/route'

// Per-axis find-placements state. Lifted to the parent so a single
// "Find for all axes" fan-out can drive every card in parallel and the
// toolbar can show aggregate progress.
interface AxisSearchState {
  clients: ClientPlacement[]
  loading: boolean
  error: string | null
  showClients: boolean
}

const MAX_CONCURRENT_AI = 10

interface CredentialsEditorProps {
  data: CredentialsSection
  onChange: (data: CredentialsSection) => void
}

const AXIS_COLORS = ['sage', 'lilac', 'copper', 'teal', 'rose', 'slate']

const CONTEXT_LABEL_OPTIONS = [
  'Industry',
  'Sub-industry',
  'Investor',
  'Specialization',
]

interface DraftAxis {
  name: string
  description: string
  intro: string
  contextLabel: string
}

export default function CredentialsEditor({ data, onChange }: CredentialsEditorProps) {
  const deck = useEditorStore((s) => s.deck)
  const deckDocuments = useAIStore((s) => s.deckDocuments)
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [suggestError, setSuggestError] = useState<string | null>(null)
  const [axisSearch, setAxisSearch] = useState<Record<string, AxisSearchState>>({})

  const deckContext = useMemo(
    () => ({
      clientName: deck?.sections.cover.clientName || deck?.clientName || '',
      roleTitle: deck?.sections.cover.roleTitle || deck?.roleTitle || '',
      coverIntro: deck?.sections.cover.introParagraph || undefined,
    }),
    [deck],
  )

  const anyAxisSearching = useMemo(
    () => Object.values(axisSearch).some((s) => s.loading),
    [axisSearch],
  )

  // Fetch placements for a single axis. Writes go through a functional
  // setAxisSearch so concurrent workers don't clobber each other's loading
  // or error state.
  async function searchAxis(axis: CredentialAxis) {
    if (!axis.name.trim()) return
    setAxisSearch((s) => ({
      ...s,
      [axis.id]: {
        clients: s[axis.id]?.clients ?? [],
        loading: true,
        error: null,
        showClients: true,
      },
    }))
    try {
      const res = await fetchWithRetry('/api/ai/credentials/find-placements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ axis, deckContext }),
      })
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(payload.error ?? 'Request failed')
      }
      const result = (await res.json()) as { clients: ClientPlacement[] }
      setAxisSearch((s) => ({
        ...s,
        [axis.id]: {
          clients: result.clients ?? [],
          loading: false,
          error: null,
          showClients: true,
        },
      }))
    } catch (err) {
      setAxisSearch((s) => ({
        ...s,
        [axis.id]: {
          clients: s[axis.id]?.clients ?? [],
          loading: false,
          error: err instanceof Error ? err.message : 'Unknown error',
          showClients: s[axis.id]?.showClients ?? false,
        },
      }))
    }
  }

  // Fan out find-placements across every named axis. fetchWithRetry inside
  // searchAxis handles 429s, so a burst that clips Anthropic's ceiling
  // self-throttles instead of surfacing as per-axis errors.
  async function searchAllAxes() {
    const namedAxes = data.axes.filter((a) => a.name.trim())
    if (namedAxes.length === 0) return
    await mapLimit(namedAxes, MAX_CONCURRENT_AI, (axis) => searchAxis(axis))
  }

  function setAxisShowClients(axisId: string, show: boolean) {
    setAxisSearch((s) => ({
      ...s,
      [axisId]: {
        clients: s[axisId]?.clients ?? [],
        loading: s[axisId]?.loading ?? false,
        error: s[axisId]?.error ?? null,
        showClients: show,
      },
    }))
  }

  function updateAxes(axes: CredentialAxis[]) {
    onChange({ ...data, axes })
  }

  function addEmptyAxis() {
    const color = AXIS_COLORS[data.axes.length % AXIS_COLORS.length]
    const newAxis: CredentialAxis = {
      id: uuid(),
      name: '',
      description: '',
      color,
      intro: '',
      contextLabel: 'Industry',
      placements: [],
    }
    updateAxes([...data.axes, newAxis])
  }

  function updateAxis(axisId: string, patch: Partial<CredentialAxis>) {
    updateAxes(
      data.axes.map((a) => (a.id === axisId ? { ...a, ...patch } : a)),
    )
  }

  function removeAxis(axisId: string) {
    updateAxes(data.axes.filter((a) => a.id !== axisId))
  }

  async function handleSuggestAxes() {
    if (!deck) return
    setSuggestLoading(true)
    setSuggestError(null)

    try {
      const cover = deck.sections.cover
      const res = await fetch('/api/ai/credentials/suggest-axes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deckContext: {
            clientName: cover.clientName || deck.clientName,
            roleTitle: cover.roleTitle || deck.roleTitle,
            coverIntro: cover.introParagraph || undefined,
            uploadedDocuments: deckDocuments.map((d) => ({
              fileName: d.fileName,
              extractedText: d.extractedText,
            })),
          },
        }),
      })

      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(payload.error ?? 'Request failed')
      }

      const result = (await res.json()) as { axes: DraftAxis[] }

      const newAxes: CredentialAxis[] = result.axes.map((draft, i) => ({
        id: uuid(),
        name: draft.name,
        description: draft.description,
        color: AXIS_COLORS[i % AXIS_COLORS.length],
        intro: draft.intro,
        contextLabel: draft.contextLabel,
        placements: [],
      }))

      updateAxes(newAxes)
    } catch (err) {
      setSuggestError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSuggestLoading(false)
    }
  }

  // Empty state
  if (data.axes.length === 0) {
    return (
      <div className="space-y-4">
        <div className="border-2 border-dashed border-border-dashed rounded-xl p-8 text-center">
          <div className="flex justify-center mb-3">
            <svg
              className="h-7 w-7 text-text-tertiary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          </div>
          <p className="text-sm font-semibold text-text">No credential axes yet</p>
          <p className="mt-1 text-sm text-text-secondary">
            Group your track record by industry, function, or seniority
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleSuggestAxes}
              disabled={suggestLoading}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {suggestLoading ? (
                <>
                  <LoadingDots className="[&_span]:bg-white" />
                  <span>Suggesting…</span>
                </>
              ) : (
                <span>Suggest axes with AI</span>
              )}
            </button>
            <button
              type="button"
              onClick={addEmptyAxis}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:text-text hover:border-border-strong transition-colors"
            >
              + Add credential axis
            </button>
          </div>
          {suggestError && (
            <p className="mt-3 text-xs text-red-600">
              {suggestError}
            </p>
          )}
        </div>

        {/* Import from database card — kept inert for v1 */}
        <div className="border border-border rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-bg-subtle transition-colors group opacity-60">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-bg-muted">
              <svg
                className="h-4 w-4 text-text-secondary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-text">Import from credential database</p>
              <p className="text-xs text-text-secondary">Pull in placements from your CRM (coming soon)</p>
            </div>
          </div>
          <svg
            className="h-4 w-4 text-text-tertiary group-hover:text-text-secondary transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>
      </div>
    )
  }

  // Populated state — axis cards
  const namedAxisCount = data.axes.filter((a) => a.name.trim()).length
  const searchingCount = Object.values(axisSearch).filter((s) => s.loading).length

  return (
    <div className="space-y-5">
      {/* Toolbar: fan-out find-placements across all named axes */}
      {namedAxisCount > 1 && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-bg-subtle px-4 py-2.5">
          <span className="text-xs text-text-secondary">
            {anyAxisSearching
              ? `Searching ${searchingCount} of ${namedAxisCount} axes…`
              : `Search placements for all ${namedAxisCount} axes at once`}
          </span>
          <button
            type="button"
            onClick={searchAllAxes}
            disabled={anyAxisSearching}
            className="text-xs font-medium text-accent hover:text-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
          >
            {anyAxisSearching ? (
              <>
                <LoadingDots />
                <span>Searching…</span>
              </>
            ) : (
              <span>Find placements for all axes</span>
            )}
          </button>
        </div>
      )}

      {data.axes.map((axis, index) => (
        <AxisCard
          key={axis.id}
          axis={axis}
          index={index}
          searchState={axisSearch[axis.id]}
          onUpdate={(patch) => updateAxis(axis.id, patch)}
          onRemove={() => removeAxis(axis.id)}
          onSearch={() => searchAxis(axis)}
          onSetShowClients={(show) => setAxisShowClients(axis.id, show)}
        />
      ))}

      {/* Add more axes */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={addEmptyAxis}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-accent hover:border-accent hover:bg-accent-light transition-colors"
        >
          + Add another axis
        </button>
        <button
          type="button"
          onClick={handleSuggestAxes}
          disabled={suggestLoading}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-accent hover:border-accent hover:bg-accent-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
        >
          {suggestLoading ? (
            <>
              <LoadingDots />
              <span>Suggesting…</span>
            </>
          ) : (
            <span>Regenerate axes with AI</span>
          )}
        </button>
      </div>
      {suggestError && (
        <p className="text-xs text-red-600">{suggestError}</p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Axis card component
// ---------------------------------------------------------------------------

interface AxisCardProps {
  axis: CredentialAxis
  index: number
  searchState: AxisSearchState | undefined
  onUpdate: (patch: Partial<CredentialAxis>) => void
  onRemove: () => void
  onSearch: () => void | Promise<void>
  onSetShowClients: (show: boolean) => void
}

function AxisCard({
  axis,
  index,
  searchState,
  onUpdate,
  onRemove,
  onSearch,
  onSetShowClients,
}: AxisCardProps) {
  const clients = searchState?.clients ?? []
  const searchLoading = searchState?.loading ?? false
  const searchError = searchState?.error ?? null
  const showClients = searchState?.showClients ?? false

  const acceptedIds = useMemo(
    () => new Set(axis.placements.map((p) => p.placementId).filter(Boolean) as string[]),
    [axis.placements],
  )

  function handleAcceptClient(client: ClientPlacement) {
    const placementId = uuid()
    const placement: Placement = {
      id: placementId,
      role: client.role,
      company: client.company,
      context: client.context,
      year: client.year,
      placementId: client.placementId,
    }
    const newPlacements = [...axis.placements, placement]
    onUpdate({ placements: newPlacements })

    // Best-effort Algolia enrichment — fire and forget
    fetch('/api/companies/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName: client.company }),
    })
      .then((res) => res.json())
      .then((result: { url: string | null; confidence: string }) => {
        if (result.url && result.confidence === 'high') {
          // Update the placement's companyUrl in the current axis
          onUpdate({
            placements: newPlacements.map((p) =>
              p.id === placementId ? { ...p, companyUrl: result.url as string } : p,
            ),
          })
        }
      })
      .catch(() => {
        // Silently ignore — enrichment is best-effort
      })
  }

  function handleRemovePlacement(placementId: string) {
    onUpdate({ placements: axis.placements.filter((p) => p.id !== placementId) })
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4 pb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
              Axis {index + 1}
            </span>
            <select
              value={axis.contextLabel}
              onChange={(e) => onUpdate({ contextLabel: e.target.value })}
              className="text-xs text-text-tertiary bg-transparent border-none cursor-pointer hover:text-text-secondary transition-colors focus:outline-none focus:ring-0 -ml-1"
            >
              {CONTEXT_LABEL_OPTIONS.map((label) => (
                <option key={label} value={label}>
                  Column: {label}
                </option>
              ))}
            </select>
          </div>
          <input
            type="text"
            value={axis.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Axis name (e.g., Healthcare, PE-backed Leadership)"
            className="w-full text-base font-semibold text-text bg-transparent border-none p-0 placeholder:text-text-placeholder focus:outline-none focus:ring-0"
          />
          <input
            type="text"
            value={axis.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Short subtitle describing this angle"
            className="w-full text-sm text-text-secondary bg-transparent border-none p-0 mt-0.5 placeholder:text-text-placeholder focus:outline-none focus:ring-0"
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 p-1.5 rounded-md text-text-tertiary hover:text-red-600 hover:bg-red-50 transition-colors"
          title="Remove axis"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
            />
          </svg>
        </button>
      </div>

      {/* Intro paragraph */}
      <div className="px-4 pb-4">
        <textarea
          value={axis.intro}
          onChange={(e) => onUpdate({ intro: e.target.value })}
          placeholder="Write a paragraph explaining why this axis of experience is relevant to the client…"
          rows={3}
          className="w-full rounded-md border border-border bg-bg px-3 py-2.5 text-sm text-text placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
        />
      </div>

      {/* Accepted placements table */}
      {axis.placements.length > 0 && (
        <div className="border-t border-border px-4 py-3">
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 pb-2 border-b border-border-subtle text-xs font-medium text-text-tertiary uppercase tracking-wider">
            <span>Role</span>
            <span>Company</span>
            <span>{axis.contextLabel}</span>
            <span className="w-8" />
          </div>
          {axis.placements.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 py-2 border-b border-border-subtle last:border-b-0 text-sm"
            >
              <span className="text-text font-medium truncate">{p.role}</span>
              <span className="truncate">
                {p.companyUrl ? (
                  <a
                    href={p.companyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:text-accent-hover transition-colors"
                  >
                    {p.company}
                  </a>
                ) : (
                  <span className="text-text">{p.company}</span>
                )}
              </span>
              <span className="text-text-secondary truncate">{p.context}</span>
              <button
                type="button"
                onClick={() => handleRemovePlacement(p.id)}
                className="w-8 flex items-center justify-center text-text-tertiary hover:text-red-600 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Find placements / client list area */}
      <div className="border-t border-border px-4 py-3">
        {searchLoading ? (
          <div className="text-center py-6">
            <LoadingDots />
            <p className="mt-2 text-sm text-text-tertiary">Searching placements…</p>
            <p className="mt-1 text-xs text-text-tertiary">
              Claude is querying the placement database for matches
            </p>
          </div>
        ) : showClients && clients.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-text-secondary">Client placements</p>
              <button
                type="button"
                onClick={() => onSetShowClients(false)}
                className="text-xs text-text-tertiary hover:text-text-secondary transition-colors"
              >
                Hide list
              </button>
            </div>
            <ClientList
              clients={clients}
              acceptedIds={acceptedIds}
              contextLabel={axis.contextLabel}
              onAccept={handleAcceptClient}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 py-2">
            <button
              type="button"
              onClick={() => onSearch()}
              disabled={searchLoading || !axis.name}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:text-accent hover:border-accent hover:bg-accent-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <span>{clients.length > 0 ? 'Search again' : 'Find placements'}</span>
            </button>
            {clients.length > 0 && (
              <button
                type="button"
                onClick={() => onSetShowClients(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-text-tertiary hover:text-text-secondary transition-colors"
              >
                Show {clients.length - acceptedIds.size} remaining clients
              </button>
            )}
          </div>
        )}
        {searchError && (
          <p className="mt-2 text-xs text-red-600 text-center">{searchError}</p>
        )}
      </div>
    </div>
  )
}
