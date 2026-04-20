import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, CreditCard, CheckCircle2, AlertTriangle, Loader2,
  Info, ShieldAlert, ExternalLink,
} from 'lucide-react'
import {
  getConnectStatus, startConnectOnboarding, refreshConnectStatus,
  type PaymentsConnectStatus,
} from '../api/payments'
import { useAuth } from '../hooks/useAuth'

function buildReturnUrls(): { refreshUrl: string; returnUrl: string } {
  const origin = window.location.origin
  return {
    refreshUrl: `${origin}/settings/payments`,
    returnUrl:  `${origin}/settings/payments?onboarded=1`,
  }
}

function StatusCard({ status }: { status: PaymentsConnectStatus }) {
  if (!status.connected) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
          <CreditCard className="w-5 h-5 text-gray-500" />
        </div>
        <div>
          <p className="text-white font-medium">Not connected</p>
          <p className="text-sm text-gray-400 mt-0.5">
            Connect a Stripe account to start accepting card payments on your storefront.
            Cash-on-delivery checkout keeps working either way.
          </p>
        </div>
      </div>
    )
  }

  if (status.canAcceptPayments) {
    return (
      <div className="bg-emerald-950/20 border border-emerald-900/50 rounded-xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <p className="text-emerald-300 font-medium">Ready to accept payments</p>
          <p className="text-sm text-gray-300 mt-0.5">
            Stripe is connected{status.provider ? ` (${status.provider})` : ''}. Card payments route to your account; the platform takes its fee.
          </p>
        </div>
      </div>
    )
  }

  if (status.status === 'rejected') {
    return (
      <div className="bg-rose-950/20 border border-rose-900/50 rounded-xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center flex-shrink-0">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
        </div>
        <div>
          <p className="text-rose-300 font-medium">Stripe application rejected</p>
          <p className="text-sm text-gray-300 mt-0.5">
            Stripe was unable to verify this account. Contact Stripe support for details, or restart onboarding with corrected information.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-amber-950/20 border border-amber-900/50 rounded-xl p-5 flex items-start gap-4">
      <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
        <AlertTriangle className="w-5 h-5 text-amber-400" />
      </div>
      <div>
        <p className="text-amber-300 font-medium">Setup incomplete</p>
        <p className="text-sm text-gray-300 mt-0.5">
          Stripe onboarding started but hasn't finished. Until it's done, card checkout returns an error to your customers.
        </p>
      </div>
    </div>
  )
}

function Checklist({ status }: { status: PaymentsConnectStatus }) {
  const rows: [string, boolean][] = [
    ['Account connected', status.connected],
    ['Onboarding details submitted', status.detailsSubmitted],
    ['Charges enabled', status.chargesEnabled],
    ['Can accept payments', status.canAcceptPayments],
  ]
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
      {rows.map(([label, ok]) => (
        <div key={label} className="flex items-center justify-between px-5 py-3">
          <span className="text-sm text-gray-300">{label}</span>
          {ok ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <span className="w-4 h-4 rounded-full border border-gray-700" />
          )}
        </div>
      ))}
    </div>
  )
}

export function PaymentsSettingsPage() {
  const { isAdmin } = useAuth()
  const qc = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const returning = searchParams.get('onboarded') === '1'

  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justReturned] = useState(returning)

  const { data: status, isLoading } = useQuery({
    queryKey: ['payments', 'status'],
    queryFn: getConnectStatus,
    enabled: isAdmin,
  })
  const showSpinner = isLoading && !status

  // One-time refresh when returning from Stripe onboarding.
  useEffect(() => {
    if (!returning) return
    let cancelled = false
    ;(async () => {
      try {
        const refreshed = await refreshConnectStatus()
        if (!cancelled) qc.setQueryData(['payments', 'status'], refreshed)
      } catch (err: any) {
        if (err?.response?.status !== 404) {
          if (!cancelled) setError('Failed to refresh payment status.')
          return
        }
        // 404 — no onboarding started; refetch the cached status
        qc.invalidateQueries({ queryKey: ['payments', 'status'] })
      } finally {
        if (!cancelled) {
          const params = new URLSearchParams(searchParams)
          params.delete('onboarded')
          setSearchParams(params, { replace: true })
        }
      }
    })()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleConnect = async () => {
    setActionLoading(true)
    setError(null)
    try {
      const { refreshUrl, returnUrl } = buildReturnUrls()
      const link = await startConnectOnboarding(refreshUrl, returnUrl)
      window.location.href = link.onboardingUrl
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Failed to start Stripe onboarding.')
      setActionLoading(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="p-4 sm:p-8 max-w-3xl mx-auto">
        <Link to="/settings" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to settings
        </Link>
        <div className="text-gray-400 text-sm bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
          Payment settings are only visible to admins.
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      <Link to="/settings" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to settings
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Payments</h1>
        <p className="text-gray-400 mt-1 text-sm">Connect your Stripe account to accept card payments on your storefront.</p>
      </div>

      {justReturned && !isLoading && (
        <div className="mb-4 flex items-start gap-2 text-sm bg-indigo-950/30 border border-indigo-900/50 rounded-lg px-4 py-3 text-indigo-200">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>Welcome back from Stripe. We've refreshed your connection status.</span>
        </div>
      )}

      {error && (
        <div className="mb-4 text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-3">{error}</div>
      )}

      {showSpinner ? (
        <div className="flex items-center gap-2 text-gray-500 text-sm py-10">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading status…
        </div>
      ) : status ? (
        <div className="space-y-4">
          <StatusCard status={status} />

          {status.connected && <Checklist status={status} />}

          <div className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div>
              <p className="text-white font-medium text-sm">
                {status.connected
                  ? status.canAcceptPayments ? 'Manage on Stripe' : 'Finish Stripe setup'
                  : 'Connect Stripe'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {status.connected && status.canAcceptPayments
                  ? 'Reopen Stripe onboarding to update business details, banking, or identity.'
                  : 'Opens Stripe\'s hosted onboarding in a full-page redirect.'}
              </p>
            </div>
            <button
              onClick={handleConnect}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {actionLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting…</>
              ) : (
                <>
                  {status.connected
                    ? status.canAcceptPayments ? 'Manage' : 'Finish setup'
                    : 'Connect'} <ExternalLink className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
