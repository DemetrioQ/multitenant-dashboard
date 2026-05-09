import { useEffect, useMemo, useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

type DemoRole = 'member' | 'admin' | 'super-admin'

const ROLES: { value: DemoRole; label: string }[] = [
  { value: 'member', label: 'Member' },
  { value: 'admin', label: 'Admin' },
  { value: 'super-admin', label: 'Super admin' },
]

function formatRemaining(target: Date): string {
  const ms = target.getTime() - Date.now()
  if (ms <= 0) return 'expired'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

export function DemoBanner() {
  const { isDemo, demoExpiresAt, role, elevateDemoRole } = useAuth()
  const [busyRole, setBusyRole] = useState<DemoRole | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [, force] = useState(0)

  const expiresAtDate = useMemo(
    () => (demoExpiresAt ? new Date(demoExpiresAt) : null),
    [demoExpiresAt],
  )

  // Tick every second to refresh the countdown.
  useEffect(() => {
    if (!isDemo) return
    const id = setInterval(() => force((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [isDemo])

  if (!isDemo) return null

  const onSwitch = async (next: DemoRole) => {
    if (busyRole || next === role) return
    setBusyRole(next)
    setError(null)
    try {
      await elevateDemoRole(next)
    } catch {
      setError('Could not switch role.')
    } finally {
      setBusyRole(null)
    }
  }

  return (
    <div className="bg-gradient-to-r from-amber-500/15 via-fuchsia-500/15 to-indigo-500/15 border-b border-amber-500/30 text-amber-100">
      <div className="px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>Demo mode</span>
          {expiresAtDate && (
            <span className="text-amber-300/80 font-normal">
              · resets in {formatRemaining(expiresAtDate)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs uppercase tracking-wide text-amber-300/70">Role</span>
          <div className="flex items-center rounded-md border border-amber-500/30 overflow-hidden">
            {ROLES.map((r) => {
              const isCurrent = role === r.value
              const isBusy = busyRole === r.value
              return (
                <button
                  key={r.value}
                  type="button"
                  disabled={!!busyRole}
                  onClick={() => onSwitch(r.value)}
                  className={`px-3 py-1 text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    isCurrent
                      ? 'bg-amber-500/30 text-amber-100'
                      : 'bg-transparent text-amber-200/80 hover:bg-amber-500/10 hover:text-amber-100'
                  } ${busyRole ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                >
                  {isBusy && <Loader2 className="w-3 h-3 animate-spin" />}
                  {r.label}
                </button>
              )
            })}
          </div>
        </div>

        {error && <span className="text-xs text-red-300 basis-full">{error}</span>}
      </div>
    </div>
  )
}
