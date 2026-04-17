import { useEffect, useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { getInvitation, acceptInvitation, type InvitationDetails } from '../api/invitations'

const PW_RE_UPPER = /[A-Z]/
const PW_RE_LOWER = /[a-z]/
const PW_RE_DIGIT = /[0-9]/
const PW_RE_SPECIAL = /[^A-Za-z0-9]/

function validatePassword(pw: string): string {
  if (pw.length < 8) return 'Must be at least 8 characters.'
  if (!PW_RE_UPPER.test(pw)) return 'Must include an uppercase letter.'
  if (!PW_RE_LOWER.test(pw)) return 'Must include a lowercase letter.'
  if (!PW_RE_DIGIT.test(pw)) return 'Must include a digit.'
  if (!PW_RE_SPECIAL.test(pw)) return 'Must include a special character.'
  return ''
}

function fieldClass(error?: string) {
  return `block w-full bg-gray-800 border rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent ${
    error ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:ring-indigo-500'
  }`
}

const readOnlyClass =
  'block w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-400 text-sm cursor-not-allowed'

export function AcceptInvitationPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') ?? ''

  const [invitation, setInvitation] = useState<InvitationDetails | null>(null)
  const [inviteLoading, setInviteLoading] = useState(true)
  const [inviteError, setInviteError] = useState<string | null>(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [touchedConfirm, setTouchedConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const firstNameError = firstName.length > 100 ? 'Max 100 characters.' : ''
  const lastNameError = lastName.length > 100 ? 'Max 100 characters.' : ''
  const passwordError = password.length > 0 ? validatePassword(password) : ''
  const confirmError = touchedConfirm && confirm !== password ? 'Passwords do not match.' : ''

  useEffect(() => {
    if (!token) {
      setInviteLoading(false)
      return
    }
    getInvitation(token)
      .then(setInvitation)
      .catch((err) => {
        const status = err.response?.status
        if (status === 400 || status === 404) {
          setInviteError('This invitation link has expired or is invalid.')
        } else {
          setInviteError('Failed to load invitation details.')
        }
      })
      .finally(() => setInviteLoading(false))
  }, [token])

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center space-y-3">
          <p className="text-white font-medium">Invalid link</p>
          <p className="text-gray-400 text-sm">This invitation link is missing a token.</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim() || passwordError || confirmError) return
    setSubmitError(null)
    setLoading(true)
    try {
      await acceptInvitation(token, password, firstName.trim(), lastName.trim())
      navigate('/login', { state: { flash: 'Account created! You can now sign in.' } })
    } catch (err: any) {
      const status = err.response?.status
      if (status === 400) {
        setSubmitError('This invitation link has expired or already been accepted.')
      } else if (status === 409) {
        setSubmitError('An account for this email already exists in this tenant.')
      } else {
        setSubmitError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-white tracking-tight">SaaS Dashboard</h1>
          <p className="text-gray-400 mt-2 text-sm">Set your password to accept the invitation</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          {inviteLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-gray-500 text-sm">Loading...</p>
            </div>
          ) : inviteError ? (
            <div className="text-center space-y-3">
              <p className="text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-3">{inviteError}</p>
              <Link to="/login" className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors">Back to sign in</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Read-only invitation context */}
              {invitation && (
                <div className="space-y-3 pb-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-300">Tenant</label>
                      <input type="text" value={invitation.tenantName} disabled className={readOnlyClass} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-300">Slug</label>
                      <input type="text" value={invitation.tenantSlug} disabled className={readOnlyClass} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-300">Email</label>
                    <input type="email" value={invitation.email} disabled className={readOnlyClass} />
                  </div>
                  <div className="border-b border-gray-800" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-300">First name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jane"
                    className={fieldClass(firstNameError)}
                  />
                  {firstNameError && <p className="text-red-400 text-xs mt-1">{firstNameError}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-300">Last name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Smith"
                    className={fieldClass(lastNameError)}
                  />
                  {lastNameError && <p className="text-red-400 text-xs mt-1">{lastNameError}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-300">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={fieldClass(passwordError)}
                />
                {passwordError && <p className="text-red-400 text-xs mt-1">{passwordError}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-300">Confirm password</label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); setTouchedConfirm(true) }}
                  placeholder="••••••••"
                  className={fieldClass(confirmError)}
                />
                {confirmError && <p className="text-red-400 text-xs mt-1">{confirmError}</p>}
              </div>
              <p className="text-xs text-gray-500">
                Min 8 characters with uppercase, lowercase, digit, and special character.
              </p>

              {submitError && (
                <p className="text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-2.5">{submitError}</p>
              )}

              <button
                type="submit"
                disabled={loading || !firstName.trim() || !lastName.trim() || !!passwordError || !!confirmError}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
              >
                {loading ? 'Creating account...' : 'Accept invitation'}
              </button>
              <p className="text-center text-sm text-gray-400">
                <Link to="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">Back to sign in</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
