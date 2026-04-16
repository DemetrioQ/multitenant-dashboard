import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, register } from '../api/auth'
import { createTenant } from '../api/tenants'
import { useAuth } from '../hooks/useAuth'

type Mode = 'signin' | 'register'

export function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')

  // Register fields
  const [tenantName, setTenantName] = useState('')
  const [tenantSlug, setTenantSlug] = useState('')

  // Sign-in fields
  const [slug, setSlug] = useState('')

  // Shared
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const switchMode = (m: Mode) => {
    setMode(m)
    setError(null)
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const data = await login(slug, email, password)
      signIn(data.jwtToken)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      // 1. Create the tenant
      const tenant = await createTenant(tenantName, tenantSlug)

      // 2. Register the user — tenantId goes in the request body
      const data = await register(tenant.tenantId, email, password)

      signIn(data.jwtToken, tenantSlug)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Registration failed. The tenant slug may already be taken.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-white tracking-tight">SaaS Dashboard</h1>
          <p className="text-gray-400 mt-2 text-sm">
            {mode === 'signin' ? 'Sign in to your account' : 'Create a new tenant and account'}
          </p>
        </div>

        {/* Mode toggle */}
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
          {mode === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-300">Company slug</label>
                <input type="text" required value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="acme-corp" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-300">Email</label>
                <input type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-300">Password</label>
                <input type="password" required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" className={inputClass} />
              </div>
              {error && (
                <p className="text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-2.5">{error}</p>
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
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-300">Tenant Name</label>
                    <input type="text" required value={tenantName}
                      onChange={(e) => setTenantName(e.target.value)}
                      placeholder="Acme Corp" className={inputClass} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-300">Tenant Slug</label>
                    <input type="text" required value={tenantSlug}
                      onChange={(e) => setTenantSlug(e.target.value)}
                      placeholder="acme-corp" className={inputClass} />
                    <p className="text-xs text-gray-500">Lowercase letters, numbers and hyphens only</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-800 pt-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Your account</p>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-300">Email</label>
                    <input type="email" required value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com" className={inputClass} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-300">Password</label>
                    <input type="password" required value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••" className={inputClass} />
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-2.5">{error}</p>
              )}
              <button type="submit" disabled={loading}
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
