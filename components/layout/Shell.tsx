'use client'

// ---------------------------------------------------------------------------
// Shell — Root layout wrapper for the editor page
// Full viewport height, white background. Wraps TopBar + Sidebar + content.
// ---------------------------------------------------------------------------

interface ShellProps {
  children: React.ReactNode
}

export default function Shell({ children }: ShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      {children}
    </div>
  )
}
