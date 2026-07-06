import { useRef, useEffect, useId } from 'react'

interface DialogProps {
  open: boolean
  title: string
  onClose?: () => void   // when undefined, Escape and backdrop-click do NOT dismiss (blocking modals pass no onClose)
  maxWidthClass?: string // default 'max-w-md'; picker passes 'max-w-lg'
  children: React.ReactNode
}

export default function Dialog({ open, title, onClose, maxWidthClass, children }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  // Escape key dismissal (only when onClose is provided)
  useEffect(() => {
    if (!open) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose?.()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  // Focus management: move focus into the panel when it opens
  useEffect(() => {
    if (open) panelRef.current?.focus()
  }, [open])

  if (!open) return null

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose?.()
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={handleBackdropClick}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`bg-gray-900 border border-gray-600 rounded-lg shadow-xl w-full ${maxWidthClass ?? 'max-w-md'} p-6 focus:outline-none`}
      >
        <h2 id={titleId} className="text-base font-semibold text-white mb-4">
          {title}
        </h2>
        {children}
      </div>
    </div>
  )
}
