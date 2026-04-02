'use client'

import { useState } from 'react'
import LoadingDots from '@/components/ui/LoadingDots'

interface TextInputProps {
  onAnalyze: (text: string, instruction?: string) => void
  isAnalyzing: boolean
  instruction: string
  onInstructionChange: (value: string) => void
}

export default function TextInput({ onAnalyze, isAnalyzing, instruction, onInstructionChange }: TextInputProps) {
  const [text, setText] = useState('')

  const canAnalyze = text.trim().length > 0 && !isAnalyzing

  return (
    <div className="flex flex-col gap-3 p-4">
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

      <input
        type="text"
        value={instruction}
        onChange={(e) => onInstructionChange(e.target.value)}
        placeholder="Focus on... (optional, e.g. 'leadership qualities' or 'technical skills')"
        className="w-full rounded-md border border-border px-3 py-2 text-xs text-text placeholder-text-placeholder outline-none focus:border-accent transition-colors"
      />

      <button
        onClick={() => onAnalyze(text, instruction || undefined)}
        disabled={!canAnalyze}
        className="self-end inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium rounded-md hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {isAnalyzing ? (<>Analyzing<LoadingDots className="ml-1" /></>) : 'Analyze'}
      </button>
    </div>
  )
}
