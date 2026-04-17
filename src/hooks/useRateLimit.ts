import { useEffect, useState } from 'react'

export function formatCountdown(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return [h, m, s].map((v) => v.toString().padStart(2, '0')).join(':')
}

export function retryAfterSecs(error: any): number {
  const header = error?.response?.headers?.['retry-after']
  const parsed = parseInt(header ?? '', 10)
  return isNaN(parsed) ? 60 : parsed
}

export function useRateLimit() {
  const [until, setUntil] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now)

  const secsLeft = until !== null ? Math.max(0, Math.ceil((until - now) / 1000)) : 0
  const isLimited = secsLeft > 0

  useEffect(() => {
    if (!isLimited) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [isLimited])

  const limit = (secs: number) => setUntil(Date.now() + secs * 1000)

  return { secsLeft, isLimited, limit }
}
