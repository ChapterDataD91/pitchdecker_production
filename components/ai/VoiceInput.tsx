'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import LoadingDots from '@/components/ui/LoadingDots'

interface VoiceInputProps {
  onTranscribe: (blob: Blob) => void
  onAnalyze: () => void
  isTranscribing: boolean
  isAnalyzing: boolean
  transcript: string | null
  onTranscriptChange: (text: string) => void
}

type RecordingState = 'idle' | 'recording' | 'transcribing' | 'transcript-ready'

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function VoiceInput({
  onTranscribe,
  onAnalyze,
  isTranscribing,
  isAnalyzing,
  transcript,
  onTranscriptChange,
}: VoiceInputProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [duration, setDuration] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Derive state from props
  useEffect(() => {
    if (isTranscribing) {
      setRecordingState('transcribing')
    } else if (transcript !== null) {
      setRecordingState('transcript-ready')
    }
  }, [isTranscribing, transcript])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        stream.getTracks().forEach((t) => t.stop())
        onTranscribe(blob)
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setRecordingState('recording')
      setDuration(0)

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1)
      }, 1000)
    } catch {
      // Microphone access denied or unavailable
    }
  }, [onTranscribe])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const reRecord = useCallback(() => {
    setRecordingState('idle')
    setDuration(0)
    onTranscriptChange('')
  }, [onTranscriptChange])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  // ---- Idle ----
  if (recordingState === 'idle') {
    return (
      <div className="flex flex-col items-center gap-4 p-8">
        <button
          onClick={startRecording}
          className="w-16 h-16 rounded-full bg-error text-white flex items-center justify-center hover:bg-red-700 transition-colors shadow-sm"
          aria-label="Start recording"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="none"
          >
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path
              d="M5 10a7 7 0 0 0 14 0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="12"
              y1="17"
              x2="12"
              y2="21"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="8"
              y1="21"
              x2="16"
              y2="21"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <p className="text-sm text-text-secondary">Click to start recording</p>
      </div>
    )
  }

  // ---- Recording ----
  if (recordingState === 'recording') {
    return (
      <div className="flex flex-col items-center gap-4 p-8">
        <button
          onClick={stopRecording}
          className="w-16 h-16 rounded-full bg-error text-white flex items-center justify-center animate-pulse shadow-sm"
          aria-label="Stop recording"
        >
          {/* Stop icon */}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <rect x="3" y="3" width="14" height="14" rx="2" />
          </svg>
        </button>
        <div className="flex flex-col items-center gap-1">
          <span className="text-lg font-mono text-text">
            {formatDuration(duration)}
          </span>
          <span className="text-xs text-error font-medium">Recording...</span>
        </div>
      </div>
    )
  }

  // ---- Transcribing ----
  if (recordingState === 'transcribing') {
    return (
      <div className="flex flex-col items-center gap-3 p-8">
        <LoadingDots />
        <p className="text-sm text-text-secondary">Transcribing...</p>
      </div>
    )
  }

  // ---- Transcript ready ----
  return (
    <div className="flex flex-col gap-3 p-4">
      <textarea
        value={transcript ?? ''}
        onChange={(e) => onTranscriptChange(e.target.value)}
        className="w-full min-h-[120px] resize-y border border-border rounded-lg px-3 py-2.5 text-sm text-text bg-bg placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
      />

      <div className="flex items-center justify-between">
        <button
          onClick={reRecord}
          className="text-sm text-text-secondary hover:text-text font-medium transition-colors"
        >
          Re-record
        </button>
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing || !transcript?.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium rounded-md hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
    </div>
  )
}
