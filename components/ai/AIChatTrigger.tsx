'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useAIStore } from '@/lib/store/ai-store'

export default function AIChatTrigger() {
  const panelOpen = useAIStore((s) => s.panelOpen)
  const openPanel = useAIStore((s) => s.openPanel)

  return (
    <AnimatePresence>
      {!panelOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onClick={openPanel}
          className="fixed bottom-6 right-6 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-accent text-white shadow-lg transition-colors hover:bg-accent-hover active:scale-[0.96]"
          aria-label="Open AI assistant"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 2l1.5 4.5L16 8l-4.5 1.5L10 14l-1.5-4.5L4 8l4.5-1.5L10 2Z" />
            <path d="M15 13l.75 2.25L18 16l-2.25.75L15 19l-.75-2.25L12 16l2.25-.75L15 13Z" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  )
}
