'use client'

import { useState } from 'react'
import LoadingDots from '@/components/ui/LoadingDots'

interface TextInputProps {
  onAnalyze: (text: string) => void
  isAnalyzing: boolean
}

export default function TextInput({ onAnalyze, isAnalyzing }: TextInputProps) {
  const [text, setText] = useState('')

  const canAnalyze = text.trim().length > 0 && !isAnalyzing

  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Textarea */}
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or paste your notes here..."
          className="w-full min-h-[120px] resize-y border border-border rounded-lg px-3 py-2.5 text-sm text-text bg-bg placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
        />
        <span className="absolute bottom-2 right-3 text-xs text-text-tertiary pointer-events-none">
          {text.length}
        </span>
      </div>

      {/* Analyze button */}
      <button
        onClick={() => onAnalyze(text)}
        disabled={!canAnalyze}
        className="self-end inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium rounded-md hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {isAnalyzing ? (
          <>
            Analyzing
            <LoadingDots className="ml-1" />
          </>
        ) : (
          'Analyze'
        )}
      </button>
    </div>
  )
}
