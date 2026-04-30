import { useEffect, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { ExternalLink, Store } from 'lucide-react'
import { login, register, resendVerification } from '../api/auth'
import { createTenant } from '../api/tenants'
import { getStores, type StoreEntry } from '../api/stores'
import { useAuth } from '../hooks/useAuth'
import { useRateLimit, formatCountdown, retryAfterSecs } from '../hooks/useRateLimit'
import { parseUtc } from '../utils/format'
import { Button, Input, Label, Checkbox, FieldError } from '../components/ui'
import { cn } from '../lib/cn'

type Mode = 'signin' | 'register'

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const PW_RE_UPPER = /[A-Z]/
const PW_RE_LOWER = /[a-z]/
const PW_RE_DIGIT = /[0-9]/
const PW_RE_SPECIAL = /[^A-Za-z0-9]/

function validatePassword(pw: string): string {
  if (pw.length < 8) return 'Must be at least 8 characters'
  if (!PW_RE_UPPER.test(pw)) return 'Must include an uppercase letter'
  if (!PW_RE_LOWER.test(pw)) return 'Must include a lowercase letter'
  if (!PW_RE_DIGIT.test(pw)) return 'Must include a digit'
  if (!PW_RE_SPECIAL.test(pw)) return 'Must include a special character'
  return ''
}

function LiveStoresPanel() {
  const [stores, setStores] = useState<StoreEntry[] | null>(null)

  useEffect(() => {
    let cancelled = false
    getStores(1, 6)
      .then((res) => {
        if (!cancelled) setStores(res.items)
      })
      .catch(() => {
        if (!cancelled) setStores([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!stores || stores.length === 0) return null

  return (
    <div className="mt-6 bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-3">
        <Store className="w-3.5 h-3.5 text-gray-500" />
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Live demo stores
        </p>
      </div>
      <p className="text-xs text-gray-500 mb-4">Browse without signing in.</p>
      <ul className="space-y-1.5">
        {stores.map((s) => (
          <li key={s.slug}>
            <a
              href={s.storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-3 px-3 py-2 -mx-3 rounded-lg hover:bg-gray-800/60 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm text-white truncate">{s.name}</p>
                <p className="text-xs text-gray-500 truncate">{s.slug}</p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-gray-600 group-hover:text-brand flex-shrink-0" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

interface UnverifiedEmailViewProps {
  slug: string
  email: string
  canResendAt: string
  onBack: () => void
}

function UnverifiedEmailView({ slug, email, canResendAt, onBack }: UnverifiedEmailViewProps) {
  const [now, setNow] = useState(Date.now)
  const [localCooldownUntil, setLocalCooldownUntil] = useState<number | null>(null)
  const [sent, setSent] = useState(false)
  const resendRateLimit = useRateLimit()

  const canResendMs = parseUtc(canResendAt).getTime()
  const serverSecsLeft = Math.max(0, Math.ceil((canResendMs - now) / 1000))
  const localSecsLeft =
    localCooldownUntil !== null ? Math.max(0, Math.ceil((localCooldownUntil - now) / 1000)) : 0
  const secsLeft = Math.max(serverSecsLeft, localSecsLeft)
  const canResend = secsLeft === 0 && !resendRateLimit.isLimited

  useEffect(() => {
    if (secsLeft === 0) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [secsLeft === 0])

  const handleResend = async () => {
    try {
      await resendVerification(slug, email)
      setSent(true)
      setLocalCooldownUntil(Date.now() + 2 * 60 * 1000)
    } catch (err: any) {
      if (err.response?.status === 429) resendRateLimit.limit(retryAfterSecs(err))
    }
  }

  return (
    <div className="text-center space-y-4">
      <p className="text-white font-medium">Verify your email</p>
      <p className="text-gray-400 text-sm">
        Your email <span className="text-white">{email}</span> hasn't been verified yet. Check your
        inbox for the verification link.
      </p>
      {sent && <p className="text-emerald-400 text-sm">A new link has been sent.</p>}
      {resendRateLimit.isLimited ? (
        <p className="text-red-400 text-sm">
          Too many attempts. Try again in {formatCountdown(resendRateLimit.secsLeft)}.
        </p>
      ) : canResend ? (
        <button
          onClick={handleResend}
          className="text-brand hover:text-brand-hover text-sm transition-colors"
        >
          Resend verification email
        </button>
      ) : (
        <p className="text-gray-500 text-sm">Resend in {formatCountdown(secsLeft)}</p>
      )}
      <button
        onClick={onBack}
        className="block text-gray-500 hover:text-gray-400 text-sm transition-colors mx-auto"
      >
        Back to sign in
      </button>
    </div>
  )
}

// Same-origin path validation prevents open-redirect via the ?return= param.
function safeReturnPath(raw: string | null): string {
  if (!raw) return '/dashboard'
  // Must start with a single slash, can't be scheme-relative ("//evil.com").
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/dashboard'
  return raw
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, signIn } = useAuth()
  const flash = (location.state as { flash?: string } | null)?.flash ?? null
  const returnTo = safeReturnPath(new URLSearchParams(location.search).get('return'))

  useEffect(() => {
    if (isAuthenticated) navigate(returnTo, { replace: true })
  }, [isAuthenticated])

  const [mode, setMode] = useState<Mode>('signin')
  const [registered, setRegistered] = useState(false)

  // Sign-in fields
  const [slug, setSlug] = useState(() => localStorage.getItem('rememberedSlug') ?? '')
  const [email, setEmail] = useState(() => localStorage.getItem('rememberedEmail') ?? '')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('rememberedSlug'))

  // Register-only fields
  const [tenantName, setTenantName] = useState('')
  const [tenantSlug, setTenantSlug] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [touched, setTouched] = useState<Set<string>>(new Set())
  const touch = (field: string) => setTouched((prev) => new Set(prev).add(field))

  const validationErrors = {
    tenantName:
      tenantName.trim().length > 0 && tenantName.trim().length < 2
        ? 'Must be at least 2 characters'
        : '',
    tenantSlug:
      tenantSlug.length > 0 && !SLUG_RE.test(tenantSlug)
        ? 'Lowercase letters, numbers and hyphens only (no leading/trailing hyphens)'
        : '',
    firstName: firstName.length > 100 ? 'Max 100 characters' : '',
    lastName: lastName.length > 100 ? 'Max 100 characters' : '',
    email: '',
    password: password.length > 0 ? validatePassword(password) : '',
    confirmPassword:
      confirmPassword.length > 0 && confirmPassword !== password ? 'Passwords do not match' : '',
  }

  const err = (field: keyof typeof validationErrors) =>
    touched.has(field) ? validationErrors[field] : ''

  const hasInlineErrors = Object.values(validationErrors).some(Boolean)

  const [unverified, setUnverified] = useState<{
    slug: string
    email: string
    canResendAt: string
  } | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const loginRateLimit = useRateLimit()

  const switchMode = (m: Mode) => {
    setMode(m)
    setUnverified(null)
    setSubmitError(null)
    setTouched(new Set())
    setEmail('')
    setPassword('')
    setFirstName('')
    setLastName('')
    setConfirmPassword('')
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    setLoading(true)
    try {
      const data = await login(slug, email, password)
      if (rememberMe) {
        localStorage.setItem('rememberedSlug', slug)
        localStorage.setItem('rememberedEmail', email)
      } else {
        localStorage.removeItem('rememberedSlug')
        localStorage.removeItem('rememberedEmail')
      }
      signIn(data.jwtToken)
      navigate(returnTo)
    } catch (err: any) {
      if (err.response?.status === 429) {
        loginRateLimit.limit(retryAfterSecs(err))
        return
      }
      if (err.response?.status === 403 && err.response?.data?.errorCode === 'EMAIL_NOT_VERIFIED') {
        setUnverified({ slug, email, canResendAt: err.response.data.canResendAt })
        return
      }
      setSubmitError(err.response?.data?.detail ?? 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    if (hasInlineErrors) return
    setLoading(true)
    try {
      const tenant = await createTenant(tenantName, tenantSlug)
      await register(tenant.tenantId, email, password, firstName, lastName)
      setRegistered(true)
    } catch (err: any) {
      setSubmitError(
        err.response?.data?.detail ?? 'Registration failed. The tenant slug may already be taken.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-white tracking-tight">SaaS Dashboard</h1>
          <p className="text-gray-400 mt-2 text-sm">
            {mode === 'signin' ? 'Sign in to your account' : 'Create a new tenant and account'}
          </p>
        </div>

        {!registered && !unverified && (
          <div className="flex bg-gray-900 border border-gray-800 rounded-xl p-1 mb-4">
            <button
              onClick={() => switchMode('signin')}
              className={cn(
                'flex-1 py-2 text-sm font-medium rounded-lg transition-colors',
                mode === 'signin' ? 'bg-brand text-white' : 'text-gray-400 hover:text-white',
              )}
            >
              Sign in
            </button>
            <button
              onClick={() => switchMode('register')}
              className={cn(
                'flex-1 py-2 text-sm font-medium rounded-lg transition-colors',
                mode === 'register' ? 'bg-brand text-white' : 'text-gray-400 hover:text-white',
              )}
            >
              Create account
            </button>
          </div>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8">
          {flash && (
            <p className="mb-5 text-emerald-400 text-sm bg-emerald-950/40 border border-emerald-900/50 rounded-lg px-4 py-3">
              {flash}
            </p>
          )}
          {unverified ? (
            <UnverifiedEmailView
              slug={unverified.slug}
              email={unverified.email}
              canResendAt={unverified.canResendAt}
              onBack={() => setUnverified(null)}
            />
          ) : registered ? (
            <div className="text-center space-y-3">
              <p className="text-white font-medium">Check your email</p>
              <p className="text-gray-400 text-sm">
                We sent a verification link to <span className="text-white">{email}</span>. Click
                the link to activate your account, then sign in.
              </p>
              <button
                onClick={() => {
                  setRegistered(false)
                  setMode('signin')
                }}
                className="mt-2 text-brand hover:text-brand-hover text-sm transition-colors"
              >
                Back to sign in
              </button>
            </div>
          ) : mode === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="signin-slug">Company slug</Label>
                <Input
                  id="signin-slug"
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="acme-corp"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="flex flex-col-reverse gap-1.5">
                <Input
                  id="signin-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <div className="flex items-center justify-between">
                  <Label htmlFor="signin-password">Password</Label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-brand hover:text-brand-hover transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <Checkbox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                <span className="text-sm text-gray-300">Remember me</span>
              </label>

              {loginRateLimit.isLimited && (
                <p className="text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-2.5">
                  Too many attempts. Please try again in {formatCountdown(loginRateLimit.secsLeft)}.
                </p>
              )}
              {submitError && !loginRateLimit.isLimited && (
                <p className="text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-2.5">
                  {submitError}
                </p>
              )}
              <Button
                type="submit"
                disabled={loading || loginRateLimit.isLimited}
                className="w-full"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Tenant
                </p>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tenant-name" className="mb-1.5">
                      Tenant name
                    </Label>
                    <Input
                      id="tenant-name"
                      type="text"
                      required
                      value={tenantName}
                      onChange={(e) => {
                        setTenantName(e.target.value)
                        touch('tenantName')
                      }}
                      placeholder="Acme Corp"
                      error={!!err('tenantName')}
                    />
                    <FieldError message={err('tenantName')} />
                  </div>
                  <div>
                    <Label htmlFor="tenant-slug" className="mb-1.5">
                      Tenant slug
                    </Label>
                    <Input
                      id="tenant-slug"
                      type="text"
                      required
                      value={tenantSlug}
                      onChange={(e) => {
                        setTenantSlug(e.target.value)
                        touch('tenantSlug')
                      }}
                      placeholder="acme-corp"
                      error={!!err('tenantSlug')}
                    />
                    <FieldError message={err('tenantSlug')} />
                    {!err('tenantSlug') && (
                      <p className="text-xs text-gray-500 mt-1">
                        Lowercase letters, numbers and hyphens only
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-800 pt-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Your account
                </p>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="reg-first-name" className="mb-1.5">
                        First name
                      </Label>
                      <Input
                        id="reg-first-name"
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => {
                          setFirstName(e.target.value)
                          touch('firstName')
                        }}
                        placeholder="Jane"
                        error={!!err('firstName')}
                      />
                      <FieldError message={err('firstName')} />
                    </div>
                    <div>
                      <Label htmlFor="reg-last-name" className="mb-1.5">
                        Last name
                      </Label>
                      <Input
                        id="reg-last-name"
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => {
                          setLastName(e.target.value)
                          touch('lastName')
                        }}
                        placeholder="Smith"
                        error={!!err('lastName')}
                      />
                      <FieldError message={err('lastName')} />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="reg-email" className="mb-1.5">
                      Email
                    </Label>
                    <Input
                      id="reg-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        touch('email')
                      }}
                      placeholder="you@example.com"
                      error={!!err('email')}
                    />
                    <FieldError message={err('email')} />
                  </div>
                  <div>
                    <Label htmlFor="reg-password" className="mb-1.5">
                      Password
                    </Label>
                    <Input
                      id="reg-password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        touch('password')
                      }}
                      placeholder="••••••••"
                      error={!!err('password')}
                    />
                    <FieldError message={err('password')} />
                  </div>
                  <div>
                    <Label htmlFor="reg-confirm" className="mb-1.5">
                      Confirm password
                    </Label>
                    <Input
                      id="reg-confirm"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        touch('confirmPassword')
                      }}
                      placeholder="••••••••"
                      error={!!err('confirmPassword')}
                    />
                    <FieldError message={err('confirmPassword')} />
                  </div>
                </div>
              </div>

              {submitError && (
                <p className="text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-2.5">
                  {submitError}
                </p>
              )}
              <Button type="submit" disabled={loading || hasInlineErrors} className="w-full">
                {loading ? 'Creating account…' : 'Create account'}
              </Button>
            </form>
          )}
        </div>

        {mode === 'signin' && !unverified && !registered && <LiveStoresPanel />}
      </div>
    </div>
  )
}
