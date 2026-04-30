import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ShieldCheck, AlertTriangle, KeyRound } from 'lucide-react'
import {
  getAuthorizeInfo,
  grantAuthorize,
  OAUTH_SCOPES,
  type OAuthScope,
} from '../api/oauthClients'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui'

interface AuthorizeParams {
  responseType: string | null
  clientId: string | null
  redirectUri: string | null
  scope: string | null
  state: string | null
  codeChallenge: string | null
  codeChallengeMethod: string | null
}

function readParams(sp: URLSearchParams): AuthorizeParams {
  return {
    responseType: sp.get('response_type'),
    clientId: sp.get('client_id'),
    redirectUri: sp.get('redirect_uri'),
    scope: sp.get('scope'),
    state: sp.get('state'),
    codeChallenge: sp.get('code_challenge'),
    codeChallengeMethod: sp.get('code_challenge_method'),
  }
}

function validateParams(p: AuthorizeParams): string | null {
  if (p.responseType !== 'code') return 'Only response_type=code is supported.'
  if (!p.clientId) return 'Missing client_id.'
  if (!p.redirectUri) return 'Missing redirect_uri.'
  if (!p.scope) return 'Missing scope.'
  if (!p.codeChallenge) return 'Missing code_challenge.'
  if (p.codeChallengeMethod !== 'S256') return 'Only code_challenge_method=S256 is supported.'
  return null
}

function denyRedirect(redirectUri: string, state: string | null): string {
  const sep = redirectUri.includes('?') ? '&' : '?'
  const query = new URLSearchParams({ error: 'access_denied' })
  if (state) query.set('state', state)
  return `${redirectUri}${sep}${query.toString()}`
}

const SCOPE_LABELS: Record<string, string> = Object.fromEntries(
  OAUTH_SCOPES.map((s) => [s.value, s.label]),
)

export function OAuthConsentPage() {
  const [sp] = useSearchParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const params = useMemo(() => readParams(sp), [sp])
  const paramError = useMemo(() => validateParams(params), [params])

  // Auth gate: redirect to login with a return URL pointing back here.
  useEffect(() => {
    if (!isAuthenticated) {
      const returnUrl = `/oauth/consent?${sp.toString()}`
      navigate(`/login?return=${encodeURIComponent(returnUrl)}`, { replace: true })
    }
  }, [isAuthenticated, navigate, sp])

  const [submitError, setSubmitError] = useState<string | null>(null)

  const infoQuery = useQuery({
    queryKey: ['authorize-info', params.clientId, params.redirectUri, params.scope],
    queryFn: () => getAuthorizeInfo(params.clientId!, params.redirectUri!, params.scope!),
    enabled: isAuthenticated && !paramError,
    retry: false,
  })

  const allowMutation = useMutation({
    mutationFn: () =>
      grantAuthorize({
        clientId: params.clientId!,
        redirectUri: params.redirectUri!,
        scope: params.scope!,
        codeChallenge: params.codeChallenge!,
        codeChallengeMethod: params.codeChallengeMethod!,
        state: params.state,
      }),
    onSuccess: ({ redirectUrl }) => {
      window.location.href = redirectUrl
    },
    onError: (err: any) => {
      setSubmitError(err?.response?.data?.error ?? 'Authorization failed.')
    },
  })

  const handleDeny = () => {
    if (params.redirectUri) {
      window.location.href = denyRedirect(params.redirectUri, params.state)
    } else {
      navigate('/dashboard')
    }
  }

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-1">
          <KeyRound className="w-5 h-5 text-indigo-400" />
          <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">
            Authorize application
          </p>
        </div>

        {paramError ? (
          <BadRequestState message={paramError} onClose={() => navigate('/dashboard')} />
        ) : infoQuery.isLoading ? (
          <p className="text-gray-400 text-sm mt-6">Loading…</p>
        ) : infoQuery.error ? (
          <BadRequestState
            message="This authorization request couldn't be validated. The client may be revoked or the redirect URL not whitelisted."
            onClose={() => navigate('/dashboard')}
          />
        ) : infoQuery.data ? (
          <ConsentBody
            info={infoQuery.data}
            submitError={submitError}
            isPending={allowMutation.isPending}
            onAllow={() => allowMutation.mutate()}
            onDeny={handleDeny}
          />
        ) : null}
      </div>
    </div>
  )
}

function ConsentBody({
  info,
  submitError,
  isPending,
  onAllow,
  onDeny,
}: {
  info: { clientName: string; grantableScopes: string[]; redirectUri: string }
  submitError: string | null
  isPending: boolean
  onAllow: () => void
  onDeny: () => void
}) {
  return (
    <>
      <h1 className="text-xl font-semibold text-white mt-2">
        <span className="text-indigo-400">{info.clientName}</span>
        <span className="text-gray-300"> wants to access your store</span>
      </h1>
      <p className="text-sm text-gray-500 mt-1 break-all">
        Will redirect to <code className="text-gray-400">{info.redirectUri}</code>
      </p>

      <div className="mt-6">
        <p className="text-sm font-medium text-gray-300 mb-2">It will be able to:</p>
        <ul className="space-y-1.5 rounded-lg bg-gray-950 border border-gray-800 p-3">
          {info.grantableScopes.map((s) => (
            <li key={s} className="flex items-start gap-2 text-sm text-gray-200">
              <ShieldCheck className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <span>
                {SCOPE_LABELS[s as OAuthScope] ?? s}{' '}
                <code className="text-xs text-gray-500 font-mono">{s}</code>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-200">
          Only authorize applications you trust. Permissions persist until you revoke them on the
          Developer page.
        </p>
      </div>

      {submitError && (
        <p className="text-red-400 text-sm mt-3 bg-red-950/40 border border-red-900/50 rounded px-3 py-2">
          {submitError}
        </p>
      )}

      <div className="mt-6 flex gap-2">
        <Button type="button" variant="secondary" onClick={onDeny} className="flex-1">
          Deny
        </Button>
        <Button type="button" onClick={onAllow} disabled={isPending} className="flex-1">
          {isPending ? 'Authorizing…' : 'Allow'}
        </Button>
      </div>
    </>
  )
}

function BadRequestState({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <>
      <h1 className="text-xl font-semibold text-white mt-2">Invalid request</h1>
      <p className="text-sm text-gray-400 mt-3">{message}</p>
      <Button type="button" variant="secondary" onClick={onClose} className="mt-6">
        Back to dashboard
      </Button>
    </>
  )
}
