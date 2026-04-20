import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
}

export function Modal({ title, onClose, children }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-800">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 sm:p-6 max-h-[calc(100dvh-10rem)] overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
