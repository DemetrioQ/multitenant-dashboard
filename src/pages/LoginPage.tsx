import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, register } from '../api/auth'
import { createTenant } from '../api/tenants'
import { useAuth } from '../hooks/useAuth'

type Mode = 'signin' | 'register'

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function fieldClass(error: string) {
  return `w-full bg-gray-800 border rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent ${
    error
      ? 'border-red-500 focus:ring-red-500'
      : 'border-gray-700 focus:ring-indigo-500'
  }`
}

function FieldError({ msg }: { msg: string }) {
  if (!msg) return null
  return <p className="text-red-400 text-xs mt-1">{msg}</p>
}

export function LoginPage() {
  const navigate = useNavigate()
  const { isAuthenticated, signIn } = useAuth()

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true })
  }, [isAuthenticated])

  const [mode, setMode] = useState<Mode>('signin')
  const [registered, setRegistered] = useState(false)

  // Sign-in fields
  const [slug, setSlug] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Register-only fields
  const [tenantName, setTenantName] = useState('')
  const [tenantSlug, setTenantSlug] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Track which fields have been interacted with
  const [touched, setTouched] = useState<Set<string>>(new Set())

  const touch = (field: string) =>
    setTouched((prev) => new Set(prev).add(field))

  // Computed inline errors (shown only after touching the field)
  const validationErrors = {
    tenantName:
      tenantName.trim().length > 0 && tenantName.trim().length < 2
        ? 'Must be at least 2 characters'
        : '',
    tenantSlug:
      tenantSlug.length > 0 && !SLUG_RE.test(tenantSlug)
        ? 'Lowercase letters, numbers and hyphens only (no leading/trailing hyphens)'
        : '',
    email: '',
    confirmEmail:
      confirmEmail.length > 0 && confirmEmail !== email
        ? 'Email addresses do not match'
        : '',
    password:
      password.length > 0 && password.length < 8
        ? 'Must be at least 8 characters'
        : '',
    confirmPassword:
      confirmPassword.length > 0 && confirmPassword !== password
        ? 'Passwords do not match'
        : '',
  }

  const err = (field: keyof typeof validationErrors) =>
    touched.has(field) ? validationErrors[field] : ''

  const hasInlineErrors = Object.values(validationErrors).some(Boolean)

  const [submitError, setSubmitError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const switchMode = (m: Mode) => {
    setMode(m)
    setSubmitError(null)
    setTouched(new Set())
    setEmail('')
    setPassword('')
    setConfirmEmail('')
    setConfirmPassword('')
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    setLoading(true)
    try {
      const data = await login(slug, email, password)
      signIn(data.jwtToken)
      navigate('/dashboard')
    } catch (err: any) {
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
      await register(tenant.tenantId, email, password)
      setRegistered(true)
    } catch (err: any) {
      setSubmitError(err.response?.data?.detail ?? 'Registration failed. The tenant slug may already be taken.')
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

        <div className="flex bg-gray-900 border border-gray-800 rounded-xl p-1 mb-4">
          <button
            onClick={() => switchMode('signin')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              mode === 'signin' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Sign in
          </button>
          <button
            onClick={() => switchMode('register')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              mode === 'register' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Create account
          </button>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          {registered ? (
            <div className="text-center space-y-3">
              <p className="text-white font-medium">Check your email</p>
              <p className="text-gray-400 text-sm">
                We sent a verification link to <span className="text-white">{email}</span>.
                Click the link to activate your account, then sign in.
              </p>
              <button
                onClick={() => { setRegistered(false); setMode('signin') }}
                className="mt-2 text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
              >
                Back to sign in
              </button>
            </div>
          ) : mode === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-300">Company slug</label>
                <input
                  type="text" required value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="acme-corp"
                  className={fieldClass('')}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-300">Email</label>
                <input
                  type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={fieldClass('')}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-300">Password</label>
                <input
                  type="password" required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={fieldClass('')}
                />
              </div>
              {submitError && (
                <p className="text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-2.5">{submitError}</p>
              )}
              <button type="submit" disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Tenant</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Tenant name</label>
                    <input
                      type="text" required value={tenantName}
                      onChange={(e) => { setTenantName(e.target.value); touch('tenantName') }}
                      placeholder="Acme Corp"
                      className={fieldClass(err('tenantName'))}
                    />
                    <FieldError msg={err('tenantName')} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Tenant slug</label>
                    <input
                      type="text" required value={tenantSlug}
                      onChange={(e) => { setTenantSlug(e.target.value); touch('tenantSlug') }}
                      placeholder="acme-corp"
                      className={fieldClass(err('tenantSlug'))}
                    />
                    <FieldError msg={err('tenantSlug')} />
                    {!err('tenantSlug') && (
                      <p className="text-xs text-gray-500 mt-1">Lowercase letters, numbers and hyphens only</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-800 pt-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Your account</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                    <input
                      type="email" required value={email}
                      onChange={(e) => { setEmail(e.target.value); touch('email') }}
                      placeholder="you@example.com"
                      className={fieldClass(err('email'))}
                    />
                    <FieldError msg={err('email')} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirm email</label>
                    <input
                      type="email" required value={confirmEmail}
                      onChange={(e) => { setConfirmEmail(e.target.value); touch('confirmEmail') }}
                      placeholder="you@example.com"
                      className={fieldClass(err('confirmEmail'))}
                    />
                    <FieldError msg={err('confirmEmail')} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                    <input
                      type="password" required value={password}
                      onChange={(e) => { setPassword(e.target.value); touch('password') }}
                      placeholder="••••••••"
                      className={fieldClass(err('password'))}
                    />
                    <FieldError msg={err('password')} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirm password</label>
                    <input
                      type="password" required value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); touch('confirmPassword') }}
                      placeholder="••••••••"
                      className={fieldClass(err('confirmPassword'))}
                    />
                    <FieldError msg={err('confirmPassword')} />
                  </div>
                </div>
              </div>

              {submitError && (
                <p className="text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-2.5">{submitError}</p>
              )}
              <button type="submit" disabled={loading || hasInlineErrors}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
