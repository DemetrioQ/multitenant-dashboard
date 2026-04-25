/**
 * Error monitoring stub. Wired into ErrorBoundary + global window error handlers.
 *
 * To enable Sentry:
 *   1. `npm install @sentry/react`
 *   2. Set `VITE_SENTRY_DSN` in .env
 *   3. Replace the `captureError` impl below with:
 *
 *      import * as Sentry from '@sentry/react'
 *      Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN, environment: import.meta.env.MODE })
 *      export function captureError(err: unknown, context?: Record<string, unknown>) {
 *        Sentry.captureException(err, { extra: context })
 *      }
 *
 * Until then, this stub just logs to console — useful in dev, harmless in prod.
 */

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined

export function initErrorMonitoring() {
  if (!SENTRY_DSN) {
    if (import.meta.env.DEV) {
      console.info('[errorMonitoring] No VITE_SENTRY_DSN set — running in stub mode.')
    }
    return
  }
  // Real Sentry init goes here once @sentry/react is installed.
}

export function captureError(err: unknown, context?: Record<string, unknown>) {
  // Always console-log so devs can see the error during development.
  console.error('[capturedError]', err, context)
  // Real Sentry call goes here.
}
