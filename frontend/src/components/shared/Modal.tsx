import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

export function Modal({ open, onClose, children }: Props) {
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-surface border border-border rounded-[10px] p-6 min-w-[380px] max-w-[520px]">
        {children}
      </div>
    </div>,
    document.body,
  )
}
