import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../api/auth'
import { useRateLimit, formatCountdown, retryAfterSecs } from '../hooks/useRateLimit'
import { Button, Input, Label } from '../components/ui'

export function ForgotPasswordPage() {
  const [slug, setSlug] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const rateLimit = useRateLimit()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    setLoading(true)
    try {
      await forgotPassword(slug, email)
      setSubmitted(true)
    } catch (err: any) {
      if (err.response?.status === 429) {
        rateLimit.limit(retryAfterSecs(err))
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
          <p className="text-gray-400 mt-2 text-sm">Reset your password</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          {submitted ? (
            <div className="text-center space-y-3">
              <p className="text-white font-medium">Check your email</p>
              <p className="text-gray-400 text-sm">
                If an account exists for <span className="text-white">{email}</span>, you'll receive
                a password reset link shortly.
              </p>
              <Link
                to="/login"
                className="inline-block mt-2 text-brand hover:text-brand-hover text-sm transition-colors"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="slug">Company slug</Label>
                <Input
                  id="slug"
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="acme-corp"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              {rateLimit.isLimited && (
                <p className="text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-2.5">
                  Too many attempts. Please try again in {formatCountdown(rateLimit.secsLeft)}.
                </p>
              )}
              {submitError && !rateLimit.isLimited && (
                <p className="text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-2.5">
                  {submitError}
                </p>
              )}

              <Button type="submit" disabled={loading || rateLimit.isLimited} className="w-full">
                {loading ? 'Sending…' : 'Send reset link'}
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
