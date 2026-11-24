import { createContext, useCallback, useContext, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'

type ToastKind = 'success' | 'error' | 'info'
interface Toast { id: number; kind: ToastKind; message: string }

interface ToastContextType {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextType>({ success: () => {}, error: () => {}, info: () => {} })

const STYLES: Record<ToastKind, { icon: ReactNode; cls: string }> = {
  success: { icon: <CheckCircle2 size={18} />, cls: 'text-success' },
  error: { icon: <XCircle size={18} />, cls: 'text-danger' },
  info: { icon: <Info size={18} />, cls: 'text-info' },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = nextId.current++
    setToasts((t) => [...t.slice(-3), { id, kind, message }])
    setTimeout(() => dismiss(id), kind === 'error' ? 6000 : 3500)
  }, [dismiss])

  const value: ToastContextType = {
    success: useCallback((m) => push('success', m), [push]),
    error: useCallback((m) => push('error', m), [push]),
    info: useCallback((m) => push('info', m), [push]),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="animate-fade-in flex items-start gap-3 rounded-xl border border-line bg-surface p-3.5 shadow-lg">
            <span className={`mt-0.5 ${STYLES[t.kind].cls}`}>{STYLES[t.kind].icon}</span>
            <p className="flex-1 text-sm text-ink">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="text-muted hover:text-ink" aria-label="Bağla"><X size={16} /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext)