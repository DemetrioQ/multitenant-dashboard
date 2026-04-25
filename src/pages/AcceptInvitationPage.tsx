import { useEffect, useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { getInvitation, acceptInvitation, type InvitationDetails } from '../api/invitations'
import { PageLoading } from '../components/PageStates'
import { Button, Input, Label, FieldError } from '../components/ui'

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

const readOnlyClass = 'bg-gray-800/50 text-gray-400 cursor-not-allowed'

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
            <PageLoading className="py-8" />
          ) : inviteError ? (
            <div className="text-center space-y-3">
              <p className="text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-3">
                {inviteError}
              </p>
              <Link
                to="/login"
                className="text-brand hover:text-brand-hover text-sm transition-colors"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Read-only invitation context */}
              {invitation && (
                <div className="space-y-3 pb-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="tenant-name">Tenant</Label>
                      <Input
                        id="tenant-name"
                        type="text"
                        value={invitation.tenantName}
                        disabled
                        className={readOnlyClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="tenant-slug">Slug</Label>
                      <Input
                        id="tenant-slug"
                        type="text"
                        value={invitation.tenantSlug}
                        disabled
                        className={readOnlyClass}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={invitation.email}
                      disabled
                      className={readOnlyClass}
                    />
                  </div>
                  <div className="border-b border-gray-800" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="first-name">First name</Label>
                  <Input
                    id="first-name"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jane"
                    error={!!firstNameError}
                  />
                  <FieldError message={firstNameError} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="last-name">Last name</Label>
                  <Input
                    id="last-name"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Smith"
                    error={!!lastNameError}
                  />
                  <FieldError message={lastNameError} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  error={!!passwordError}
                />
                <FieldError message={passwordError} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input
                  id="confirm"
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value)
                    setTouchedConfirm(true)
                  }}
                  placeholder="••••••••"
                  error={!!confirmError}
                />
                <FieldError message={confirmError} />
              </div>
              <p className="text-xs text-gray-500">
                Min 8 characters with uppercase, lowercase, digit, and special character.
              </p>

              {submitError && (
                <p className="text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-2.5">
                  {submitError}
                </p>
              )}

              <Button
                type="submit"
                disabled={
                  loading ||
                  !firstName.trim() ||
                  !lastName.trim() ||
                  !!passwordError ||
                  !!confirmError
                }
                className="w-full"
              >
                {loading ? 'Creating account...' : 'Accept invitation'}
              </Button>
              <p className="text-center text-sm text-gray-400">
                <Link to="/login" className="text-brand hover:text-brand-hover transition-colors">
                  Back to sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
