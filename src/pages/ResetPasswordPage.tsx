import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { resetPassword } from '../api/auth'

type Status = 'form' | 'success' | 'error'

function fieldClass(error: string) {
  return `block w-full bg-gray-800 border rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent ${
    error
      ? 'border-red-500 focus:ring-red-500'
      : 'border-gray-700 focus:ring-indigo-500'
  }`
}

function FieldError({ msg }: { msg: string }) {
  if (!msg) return null
  return <p className="text-red-400 text-xs mt-1">{msg}</p>
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [touchedConfirm, setTouchedConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<Status>('form')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const passwordError = newPassword.length > 0 && newPassword.length < 8
    ? 'Must be at least 8 characters'
    : ''
  const confirmError = touchedConfirm && confirmPassword !== newPassword
    ? 'Passwords do not match'
    : ''

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
            <p className="text-gray-400 text-sm">This reset link is missing a token. Please request a new one.</p>
            <Link
              to="/forgot-password"
              className="inline-block mt-2 text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
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
              <p className="text-gray-400 text-sm">Your password has been reset. You can now sign in with your new password.</p>
              <Link
                to="/login"
                className="inline-block mt-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
              >
                Go to sign in
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-3">
              <p className="text-white font-medium">Link expired or invalid</p>
              <p className="text-gray-400 text-sm">This reset link has expired or already been used. Reset links are valid for 1 hour.</p>
              <Link
                to="/forgot-password"
                className="inline-block mt-2 text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
              >
                Request new link
              </Link>
            </div>
          )}

          {status === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-300">New password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className={fieldClass(passwordError)}
                />
                <FieldError msg={passwordError} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-300">Confirm password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setTouchedConfirm(true) }}
                  placeholder="••••••••"
                  className={fieldClass(confirmError)}
                />
                <FieldError msg={confirmError} />
              </div>

              {submitError && (
                <p className="text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-2.5">
                  {submitError}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !!passwordError || !!confirmError}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
              >
                {loading ? 'Saving…' : 'Reset password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
