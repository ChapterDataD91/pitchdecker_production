'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface CreateDeckDialogProps {
  open: boolean
  onClose: () => void
  onCreate: (clientName: string, roleTitle: string) => void
  isCreating: boolean
}

export default function CreateDeckDialog({
  open,
  onClose,
  onCreate,
  isCreating,
}: CreateDeckDialogProps) {
  const [clientName, setClientName] = useState('')
  const [roleTitle, setRoleTitle] = useState('')
  const [errors, setErrors] = useState<{ clientName?: string; roleTitle?: string }>({})

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const newErrors: typeof errors = {}
    if (!clientName.trim()) newErrors.clientName = 'Client name is required'
    if (!roleTitle.trim()) newErrors.roleTitle = 'Role title is required'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    onCreate(clientName.trim(), roleTitle.trim())
  }

  function handleClose() {
    if (isCreating) return
    setClientName('')
    setRoleTitle('')
    setErrors({})
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-text/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Dialog */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <div
              className="w-full max-w-md rounded-lg bg-bg p-8 shadow-overlay"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold text-text">New Pitch Deck</h2>
              <p className="mt-1 text-sm text-text-secondary">
                Enter the client and role to get started.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {/* Client name */}
                <div>
                  <label
                    htmlFor="clientName"
                    className="mb-1.5 block text-sm font-medium text-text"
                  >
                    Client name
                  </label>
                  <input
                    id="clientName"
                    type="text"
                    value={clientName}
                    onChange={(e) => {
                      setClientName(e.target.value)
                      if (errors.clientName) setErrors((prev) => ({ ...prev, clientName: undefined }))
                    }}
                    placeholder="e.g. Acme Corporation"
                    className={`w-full rounded-md border px-3 py-2.5 text-sm text-text placeholder-text-placeholder outline-none transition-colors focus:border-accent ${
                      errors.clientName ? 'border-error' : 'border-border'
                    }`}
                    disabled={isCreating}
                    autoFocus
                  />
                  {errors.clientName && (
                    <p className="mt-1 text-xs text-error">{errors.clientName}</p>
                  )}
                </div>

                {/* Role title */}
                <div>
                  <label
                    htmlFor="roleTitle"
                    className="mb-1.5 block text-sm font-medium text-text"
                  >
                    Role title
                  </label>
                  <input
                    id="roleTitle"
                    type="text"
                    value={roleTitle}
                    onChange={(e) => {
                      setRoleTitle(e.target.value)
                      if (errors.roleTitle) setErrors((prev) => ({ ...prev, roleTitle: undefined }))
                    }}
                    placeholder="e.g. Chief Executive Officer"
                    className={`w-full rounded-md border px-3 py-2.5 text-sm text-text placeholder-text-placeholder outline-none transition-colors focus:border-accent ${
                      errors.roleTitle ? 'border-error' : 'border-border'
                    }`}
                    disabled={isCreating}
                  />
                  {errors.roleTitle && (
                    <p className="mt-1 text-xs text-error">{errors.roleTitle}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-md px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-hover hover:text-text"
                    disabled={isCreating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-accent px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover active:bg-accent/80 disabled:opacity-50"
                    disabled={isCreating}
                  >
                    {isCreating ? 'Creating...' : 'Create Deck'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
