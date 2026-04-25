import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { resetPassword } from '../api/auth'
import { Button, Input, Label, FieldError } from '../components/ui'

type Status = 'form' | 'success' | 'error'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [touchedConfirm, setTouchedConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<Status>('form')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const passwordError =
    newPassword.length > 0 && newPassword.length < 8 ? 'Must be at least 8 characters' : ''
  const confirmError =
    touchedConfirm && confirmPassword !== newPassword ? 'Passwords do not match' : ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordError || confirmError) return
    setSubmitError(null)
    setLoading(true)
    try {
      await resetPassword(token, newPassword)
      setStatus('success')
    } catch (err: any) {
      const status = err.response?.status
      if (status === 404) {
        setStatus('error')
      } else if (status === 400) {
        setSubmitError(err.response?.data?.detail ?? 'Password must be at least 8 characters.')
      } else {
        setSubmitError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-semibold text-white tracking-tight">SaaS Dashboard</h1>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center space-y-4">
            <p className="text-white font-medium">Invalid link</p>
            <p className="text-gray-400 text-sm">
              This reset link is missing a token. Please request a new one.
            </p>
            <Link
              to="/forgot-password"
              className="inline-block mt-2 text-brand hover:text-brand-hover text-sm transition-colors"
            >
              Request new link
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-white tracking-tight">SaaS Dashboard</h1>
          <p className="text-gray-400 mt-2 text-sm">Choose a new password</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          {status === 'success' && (
            <div className="text-center space-y-3">
              <p className="text-white font-medium">Password updated</p>
              <p className="text-gray-400 text-sm">
                Your password has been reset. You can now sign in with your new password.
              </p>
              <Button asChild size="lg" className="mt-2">
                <Link to="/login">Go to sign in</Link>
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-3">
              <p className="text-white font-medium">Link expired or invalid</p>
              <p className="text-gray-400 text-sm">
                This reset link has expired or already been used. Reset links are valid for 1 hour.
              </p>
              <Link
                to="/forgot-password"
                className="inline-block mt-2 text-brand hover:text-brand-hover text-sm transition-colors"
              >
                Request new link
              </Link>
            </div>
          )}

          {status === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  error={!!passwordError}
                />
                <FieldError message={passwordError} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    setTouchedConfirm(true)
                  }}
                  placeholder="••••••••"
                  error={!!confirmError}
                />
                <FieldError message={confirmError} />
              </div>

              {submitError && (
                <p className="text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-2.5">
                  {submitError}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading || !!passwordError || !!confirmError}
                className="w-full"
              >
                {loading ? 'Saving…' : 'Reset password'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
