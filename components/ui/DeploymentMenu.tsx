'use client'

// ---------------------------------------------------------------------------
// Kebab menu that manages an existing published deployment. Sits next to the
// Publish/Republish button in the preview header and surfaces:
//
//   • Open viewer      — opens the viewerUrl in a new tab
//   • Copy link + PIN  — writes a ready-to-paste block to the clipboard
//   • Rollback to v{N-1}  — (disabled when version === 1)
//   • Rename client    — inline edit, renames the PIN-page label + deck
//   • Revoke access    — destructive, confirmation required
//
// The menu is fully controlled; each action calls a handler the parent wires
// to the matching API route. This component does not fetch data itself.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import ConfirmDialog from './ConfirmDialog'
import type { PublishedDeployment } from '@/lib/types'

export type DeploymentAction = 'rollback' | 'rename' | 'revoke'

interface DeploymentMenuProps {
  deployment: PublishedDeployment
  clientName: string
  onRollback: (version: number) => Promise<void>
  onRename: (newClientName: string) => Promise<void>
  onRevoke: () => Promise<void>
  onSync: () => Promise<void>
}

type ConfirmState =
  | { kind: 'none' }
  | { kind: 'rollback'; targetVersion: number }
  | { kind: 'revoke' }

export default function DeploymentMenu({
  deployment,
  clientName,
  onRollback,
  onRename,
  onRevoke,
  onSync,
}: DeploymentMenuProps) {
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState<ConfirmState>({ kind: 'none' })
  const [busy, setBusy] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(clientName)
  const [copied, setCopied] = useState(false)

  const menuRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const renameInputRef = useRef<HTMLInputElement | null>(null)
  const copyTimer = useRef<number | null>(null)

  const closeMenu = useCallback(() => {
    setOpen(false)
    setRenaming(false)
    setRenameValue(clientName)
  }, [clientName])

  // Close on outside click / Esc.
  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (
        menuRef.current &&
        !menuRef.current.contains(t) &&
        buttonRef.current &&
        !buttonRef.current.contains(t)
      ) {
        closeMenu()
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeMenu()
      }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open, closeMenu])

  useEffect(() => {
    return () => {
      if (copyTimer.current) window.clearTimeout(copyTimer.current)
    }
  }, [])

  useEffect(() => {
    if (renaming) {
      // Focus + select after the mode swap animates in.
      const t = window.setTimeout(() => {
        renameInputRef.current?.focus()
        renameInputRef.current?.select()
      }, 40)
      return () => window.clearTimeout(t)
    }
  }, [renaming])

  async function handleCopyLinkPin() {
    const text = `Pitch deck for ${clientName}\n\nLink: ${deployment.viewerUrl}\nPIN: ${deployment.pin}`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      if (copyTimer.current) window.clearTimeout(copyTimer.current)
      copyTimer.current = window.setTimeout(() => setCopied(false), 1400)
    } catch {
      // Silent fail — browser without clipboard access.
    }
  }

  async function handleConfirm() {
    if (confirm.kind === 'none') return
    setBusy(true)
    try {
      if (confirm.kind === 'rollback') {
        await onRollback(confirm.targetVersion)
      } else if (confirm.kind === 'revoke') {
        await onRevoke()
      }
      setConfirm({ kind: 'none' })
      closeMenu()
    } finally {
      setBusy(false)
    }
  }

  async function handleSync() {
    setSyncing(true)
    try {
      await onSync()
    } finally {
      setSyncing(false)
      setOpen(false)
    }
  }

  async function handleRenameSubmit() {
    const next = renameValue.trim()
    if (!next || next === clientName) {
      setRenaming(false)
      setRenameValue(clientName)
      return
    }
    setBusy(true)
    try {
      await onRename(next)
      setRenaming(false)
      closeMenu()
    } finally {
      setBusy(false)
    }
  }

  const isActive = deployment.status === 'active'
  const canRollback = isActive && deployment.version > 1
  const targetRollbackVersion = deployment.version - 1

  return (
    <>
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Deployment options"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-hover hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="3" r="1.35" fill="currentColor" />
            <circle cx="8" cy="8" r="1.35" fill="currentColor" />
            <circle cx="8" cy="13" r="1.35" fill="currentColor" />
          </svg>
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              ref={menuRef}
              role="menu"
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-0 top-full z-40 mt-1.5 w-[240px] overflow-hidden rounded-lg border border-border bg-white shadow-[0_10px_15px_-3px_rgba(0,0,0,0.08),0_4px_6px_-4px_rgba(0,0,0,0.04)]"
            >
              {!renaming ? (
                <div className="py-1">
                  <MenuItem
                    onClick={() => {
                      window.open(deployment.viewerUrl, '_blank', 'noopener,noreferrer')
                      closeMenu()
                    }}
                    disabled={!isActive}
                  >
                    Open viewer
                    <ExternalIcon />
                  </MenuItem>
                  <MenuItem onClick={handleCopyLinkPin} disabled={!isActive}>
                    {copied ? 'Copied' : 'Copy link + PIN'}
                  </MenuItem>

                  <Divider />

                  <MenuItem
                    onClick={() => {
                      if (!canRollback) return
                      setConfirm({ kind: 'rollback', targetVersion: targetRollbackVersion })
                    }}
                    disabled={!canRollback}
                    hint={
                      !isActive
                        ? 'Deployment is not active'
                        : deployment.version === 1
                          ? 'No earlier version'
                          : undefined
                    }
                  >
                    Rollback to v{targetRollbackVersion < 1 ? 1 : targetRollbackVersion}
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setRenameValue(clientName)
                      setRenaming(true)
                    }}
                    disabled={!isActive}
                  >
                    Rename client
                  </MenuItem>

                  <Divider />

                  <MenuItem onClick={handleSync} disabled={syncing}>
                    {syncing ? 'Syncing…' : 'Sync with server'}
                  </MenuItem>

                  <Divider />

                  <MenuItem
                    onClick={() => setConfirm({ kind: 'revoke' })}
                    disabled={!isActive}
                    destructive
                  >
                    Revoke access
                  </MenuItem>
                </div>
              ) : (
                <div className="p-3">
                  <label
                    htmlFor="rename-input"
                    className="mb-1 block text-xs font-medium text-text-secondary"
                  >
                    Rename client
                  </label>
                  <input
                    ref={renameInputRef}
                    id="rename-input"
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleRenameSubmit()
                      } else if (e.key === 'Escape') {
                        e.preventDefault()
                        setRenaming(false)
                        setRenameValue(clientName)
                      }
                    }}
                    disabled={busy}
                    className="w-full rounded-md border border-border bg-white px-2.5 py-1.5 text-sm text-text transition-colors hover:border-border-strong focus:border-accent focus:outline-none disabled:opacity-60"
                  />
                  <p className="mt-1.5 text-[11px] leading-snug text-text-tertiary">
                    Updates the PIN page label and the deck’s client name.
                  </p>
                  <div className="mt-3 flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setRenaming(false)
                        setRenameValue(clientName)
                      }}
                      disabled={busy}
                      className="rounded-md px-2.5 py-1 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleRenameSubmit}
                      disabled={busy || !renameValue.trim() || renameValue.trim() === clientName}
                      className="rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-white transition-[background-color] hover:bg-accent-hover active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-default disabled:opacity-50"
                    >
                      {busy ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ConfirmDialog
        open={confirm.kind === 'rollback'}
        title={`Roll back to v${confirm.kind === 'rollback' ? confirm.targetVersion : ''}?`}
        message="The viewer will immediately serve the previous version. The current version stays in storage and can be restored later."
        confirmLabel={`Roll back to v${confirm.kind === 'rollback' ? confirm.targetVersion : ''}`}
        busy={busy}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm({ kind: 'none' })}
      />

      <ConfirmDialog
        open={confirm.kind === 'revoke'}
        title="Revoke access?"
        message={`Viewers with the link and PIN will immediately lose access. This cannot be undone from here — you'd need to publish a new deployment (new link + new PIN) to share with ${clientName || 'the client'} again.`}
        confirmLabel="Revoke access"
        destructive
        busy={busy}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm({ kind: 'none' })}
      />
    </>
  )
}

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function MenuItem({
  children,
  onClick,
  disabled = false,
  destructive = false,
  hint,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  destructive?: boolean
  hint?: string
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      title={hint}
      className={`flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-sm transition-colors focus-visible:outline-none ${
        disabled
          ? 'cursor-default text-text-tertiary'
          : destructive
            ? 'text-error hover:bg-error-light'
            : 'text-text hover:bg-bg-hover'
      }`}
    >
      <span className="truncate">{children}</span>
    </button>
  )
}

function Divider() {
  return <div className="my-1 h-px bg-border-subtle" aria-hidden="true" />
}

function ExternalIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className="shrink-0 text-text-tertiary"
    >
      <path
        d="M4.5 2.5H9.5V7.5M9.5 2.5L4 8"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  )
}
