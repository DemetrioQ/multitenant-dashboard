import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'
import { cn } from '../../lib/cn'

type ToastVariant = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  variant: ToastVariant
  message: string
}

interface ToastContextType {
  toast: (message: string, variant?: ToastVariant) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

const VARIANT_STYLES: Record<ToastVariant, { icon: typeof CheckCircle2; className: string }> = {
  success: {
    icon: CheckCircle2,
    className: 'bg-emerald-950/90 border-emerald-900/70 text-emerald-100',
  },
  error: { icon: AlertTriangle, className: 'bg-red-950/90 border-red-900/70 text-red-100' },
  info: { icon: Info, className: 'bg-gray-900/95 border-gray-700 text-gray-100' },
}

const TOAST_DURATION = 4000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const idRef = useRef(0)

  const toast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = ++idRef.current
    setItems((prev) => [...prev, { id, variant, message }])
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id))
    }, TOAST_DURATION)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm pointer-events-none"
      >
        {items.map((t) => {
          const { icon: Icon, className } = VARIANT_STYLES[t.variant]
          return (
            <div
              key={t.id}
              role={t.variant === 'error' ? 'alert' : 'status'}
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-xl border backdrop-blur-sm px-4 py-3 shadow-lg text-sm',
                className,
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="flex-1 min-w-0 break-words">{t.message}</p>
              <button
                type="button"
                onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
                aria-label="Dismiss"
                className="flex-shrink-0 opacity-70 hover:opacity-100"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

/**
 * One-line helper: dismiss an unused effect-cleanup warning when toast is only fired once.
 * Useful when the toast trigger lives in a useEffect cleanup.
 */
export function useToastOnce(message: string | null, variant: ToastVariant = 'info') {
  const { toast } = useToast()
  useEffect(() => {
    if (message) toast(message, variant)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message])
}
