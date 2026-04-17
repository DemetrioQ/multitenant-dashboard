import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Circle, CheckCheck } from 'lucide-react'
import { getOnboarding, type OnboardingStatus } from '../api/tenants'

type View = 'loading' | 'checklist' | 'complete' | 'hidden'

export function OnboardingChecklist() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<OnboardingStatus | null>(null)
  const [view, setView] = useState<View>('loading')

  useEffect(() => {
    getOnboarding()
      .then((s) => {
        setStatus(s)
        setView(s.isComplete ? 'complete' : 'checklist')
      })
      .catch(() => setView('hidden'))
  }, [])

  // Auto-dismiss the success state after 4 seconds
  useEffect(() => {
    if (view !== 'complete') return
    const id = setTimeout(() => setView('hidden'), 4000)
    return () => clearTimeout(id)
  }, [view])

  if (view === 'loading' || view === 'hidden') return null

  if (view === 'complete') {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 flex items-center gap-3">
        <CheckCheck className="w-5 h-5 text-emerald-400 shrink-0" />
        <div>
          <p className="text-sm font-medium text-emerald-400">You're all set!</p>
          <p className="text-xs text-emerald-400/70 mt-0.5">Your workspace is fully configured.</p>
        </div>
      </div>
    )
  }

  const items = [
    {
      label: 'Complete your profile',
      done: status!.profileCompleted,
      path: '/settings/profile',
    },
    {
      label: 'Add your first product',
      done: status!.firstProductCreated,
      path: '/products/new',
    },
  ]

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Get started</p>
      <ul className="space-y-3">
        {items.map(({ label, done, path }) => (
          <li key={label} className="flex items-center gap-3">
            {done ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-gray-600 shrink-0" />
            )}
            {done ? (
              <span className="text-sm text-gray-500 line-through">{label}</span>
            ) : (
              <button
                onClick={() => navigate(path)}
                className="text-sm text-indigo-400 hover:text-indigo-300 hover:underline text-left"
              >
                {label}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
