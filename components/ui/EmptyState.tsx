'use client'

import type { ReactNode } from 'react'

interface EmptyStateAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  action?: EmptyStateAction
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center text-text-tertiary">
          {icon}
        </div>
      )}

      <h3 className="text-base font-semibold text-text">{title}</h3>

      <p className="mt-1.5 max-w-sm text-center text-sm text-text-secondary">
        {description}
      </p>

      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className={
            action.variant === 'secondary'
              ? 'mt-5 rounded-md px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent-light'
              : 'mt-5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover'
          }
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
