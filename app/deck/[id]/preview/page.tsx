'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'

export default function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="max-w-md rounded-lg bg-bg p-10 text-center shadow-sm">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent-light">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-accent">
            <path
              d="M4 6C4 4.89543 4.89543 4 6 4H26C27.1046 4 28 4.89543 28 6V26C28 27.1046 27.1046 28 26 28H6C4.89543 28 4 27.1046 4 26V6Z"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path d="M12 13L20 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 17L18 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 21L16 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-text">Preview Coming Soon</h1>
        <p className="mt-3 text-sm text-text-secondary">
          The client-facing deck preview will be built in Phase 3, using the
          Top of Minds huisstijl brand guide.
        </p>
        <button
          onClick={() => router.push(`/deck/${id}`)}
          className="mt-8 rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Back to Editor
        </button>
      </div>
    </div>
  )
}
