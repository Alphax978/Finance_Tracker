import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { subscribeToasts, dismissToast, type ToastItem, type ToastType } from '../utils/toastStore'

interface LocalToast extends ToastItem {
  closing?: boolean
}

const ICON_PATHS: Record<ToastType, React.ReactNode> = {
  success: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 5-5" />
    </>
  ),
  error: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9l6 6M15 9l-6 6" />
    </>
  ),
  warn: (
    <>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </>
  ),
}

const ToastStack = () => {
  const [items, setItems] = useState<LocalToast[]>([])

  useEffect(() => {
    return subscribeToasts((storeToasts) => {
      setItems((prev) => {
        const prevIds = new Set(prev.map((t) => t.id))
        const storeIds = new Set(storeToasts.map((t) => t.id))
        const added = storeToasts.filter((t) => !prevIds.has(t.id))
        const kept = prev.map((t) => (!storeIds.has(t.id) && !t.closing ? { ...t, closing: true } : t))
        return [...kept, ...added]
      })
    })
  }, [])

  const handleAnimationEnd = (id: number, closing?: boolean) => {
    if (closing) {
      setItems((prev) => prev.filter((t) => t.id !== id))
    }
  }

  if (items.length === 0) return null

  return createPortal(
    <div className="toast-stack">
      {items.map((t) => (
        <div
          key={t.id}
          className={`toast-item toast-${t.type} ${t.closing ? 'is-closing' : ''}`}
          onAnimationEnd={() => handleAnimationEnd(t.id, t.closing)}
        >
          <span className="toast-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {ICON_PATHS[t.type]}
            </svg>
          </span>
          <span className="toast-message">{t.message}</span>
          <button type="button" className="toast-close" aria-label="Dismiss" onClick={() => dismissToast(t.id)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          {!t.closing && <span className="toast-progress" />}
        </div>
      ))}
    </div>,
    document.body
  )
}

export default ToastStack
