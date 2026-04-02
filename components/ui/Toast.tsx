'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

type ToastType = 'success' | 'error' | 'info'

interface ToastProps {
  message: string
  type: ToastType
  visible: boolean
  onClose?: () => void
}

const dotColors: Record<ToastType, string> = {
  success: 'bg-success',
  error: 'bg-error',
  info: 'bg-accent',
}

export default function Toast({ message, type, visible, onClose }: ToastProps) {
  useEffect(() => {
    if (!visible || !onClose) return

    const timer = setTimeout(() => {
      onClose()
    }, 3000)

    return () => clearTimeout(timer)
  }, [visible, onClose])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-lg bg-white px-5 py-3 shadow-lg border border-border"
        >
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${dotColors[type]}`}
          />
          <span className="text-sm text-text">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
