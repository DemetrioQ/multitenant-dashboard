import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { verifyEmail } from '../api/auth'

type Status = 'loading' | 'success' | 'error'

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<Status>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('The verification link is invalid or has expired.')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      return
    }

    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err) => {
        setErrorMessage(err.response?.data?.detail ?? 'The verification link is invalid or has expired.')
        setStatus('error')
      })
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-white tracking-tight">SaaS Dashboard</h1>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center space-y-4">
          {status === 'loading' && (
            <>
              <p className="text-white font-medium">Verifying your email…</p>
              <p className="text-gray-400 text-sm">Please wait a moment.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <p className="text-white font-medium">Email verified</p>
              <p className="text-gray-400 text-sm">Your account is active. You can now sign in.</p>
              <Link
                to="/login"
                className="inline-block mt-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
              >
                Go to sign in
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <p className="text-white font-medium">Verification failed</p>
              <p className="text-gray-400 text-sm">{errorMessage}</p>
              <Link
                to="/login"
                className="inline-block mt-2 text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
              >
                Back to sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
