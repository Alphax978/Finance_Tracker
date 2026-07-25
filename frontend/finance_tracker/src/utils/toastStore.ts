export type ToastType = 'success' | 'error' | 'warn'

export interface ToastItem {
    id: number
    type: ToastType
    message: string
}

type Listener = (toasts: ToastItem[]) => void

const DURATION_MS = 4000

let toasts: ToastItem[] = []
let nextId = 0
const listeners = new Set<Listener>()

const emit = () => {
    listeners.forEach((listener) => listener(toasts))
}

export const dismissToast = (id: number) => {
    toasts = toasts.filter((t) => t.id !== id)
    emit()
}

export const subscribeToasts = (listener: Listener): (() => void) => {
    listeners.add(listener)
    listener(toasts)
    return () => listeners.delete(listener)
}

const push = (type: ToastType, message: string) => {
    const id = nextId++
    toasts = [...toasts, { id, type, message }]
    emit()
    setTimeout(() => dismissToast(id), DURATION_MS)
}

// Same call shape as react-toastify's `toast` export (toast.success/error/warn)
// so every existing call site keeps working with just an import change.
export const toast = {
    success: (message: string) => push('success', message),
    error: (message: string) => push('error', message),
    warn: (message: string) => push('warn', message),
}
