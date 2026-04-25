import { useIsFetching } from '@tanstack/react-query'

export function PageLoading({
  label = 'Loading…',
  boxed = false,
  className = 'py-20',
}: {
  label?: string
  boxed?: boolean
  className?: string
}) {
  const box = boxed ? 'bg-gray-900 border border-gray-800 rounded-xl ' : ''
  return (
    <div className={`${box}flex items-center justify-center ${className}`}>
      <p className="text-gray-500 text-sm">{label}</p>
    </div>
  )
}

export function PageError({ message }: { message?: string | null }) {
  if (!message) return null
  return (
    <div className="mx-4 sm:mx-8 my-6 p-4 border border-red-500/30 bg-red-500/10 rounded-lg">
      <p className="text-red-400 text-sm">{message}</p>
    </div>
  )
}

export function FetchingBar() {
  const count = useIsFetching()
  if (count === 0) return null
  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 h-0.5 z-50 overflow-hidden pointer-events-none"
    >
      <div className="h-full bg-indigo-500 animate-[fetchbar_1.2s_ease-in-out_infinite]" />
    </div>
  )
}
