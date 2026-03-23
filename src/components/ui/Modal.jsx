import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX } from 'react-icons/fi'

export default function Modal({
  open,
  title,
  children,
  onClose,
  footer,
  size = 'md', // 'md' | 'lg'
}) {
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const onKeyDown = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  const maxW = size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-xl'

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onClose?.()}
          />

          {/* Sheet — slides up on mobile, fades in centered on desktop */}
          <motion.div
            className={`relative w-full ${maxW} bg-white text-zinc-900 shadow-2xl
              rounded-t-2xl sm:rounded-2xl
              flex flex-col
              max-h-[92dvh] sm:max-h-[90vh]`}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            role="dialog"
            aria-modal="true"
            aria-label={title ?? 'Dialog'}
          >
            {/* Drag handle (mobile only) */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-zinc-200" />
            </div>

            {/* Header */}
            {title ? (
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 shrink-0">
                <span className="text-base font-semibold">{title}</span>
                <button
                  onClick={() => onClose?.()}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                >
                  <FiX size={18} />
                </button>
              </div>
            ) : null}

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-4 py-4">
              {children}
            </div>

            {footer ? (
              <div className="px-4 py-3 border-t border-zinc-100 shrink-0">{footer}</div>
            ) : null}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
