'use client'

interface LoadingDotsProps {
  className?: string
}

export default function LoadingDots({ className }: LoadingDotsProps) {
  return (
    <span className={`inline-flex items-center gap-1 ${className ?? ''}`}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-text-tertiary"
          style={{
            animation: 'dot-pulse 1.4s ease-in-out infinite',
            animationDelay: `${i * 160}ms`,
          }}
        />
      ))}
    </span>
  )
}
