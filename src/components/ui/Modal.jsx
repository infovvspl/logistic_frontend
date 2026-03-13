import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import Button from './Button.jsx'

export default function Modal({
  open,
  title,
  children,
  onClose,
  footer,
  closeText = 'Close',
}) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center px-4 py-8">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => onClose?.()}
      />
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-4 text-zinc-900 shadow-[0_30px_90px_rgba(0,0,0,0.18)]"
        role="dialog"
        aria-modal="true"
        aria-label={title ?? 'Dialog'}
      >
        {title ? (
          <div className="mb-3 flex items-start justify-between gap-4">
            <div className="text-base font-semibold">{title}</div>
            <Button variant="ghost" onClick={() => onClose?.()}>
              {closeText}
            </Button>
          </div>
        ) : null}

        <div className="max-h-[70vh] overflow-auto pr-1">{children}</div>

        {footer ? <div className="mt-4">{footer}</div> : null}
      </motion.div>
    </div>,
    document.body,
  )
}
