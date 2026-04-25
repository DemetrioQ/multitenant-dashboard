const moneyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export function formatMoney(amount: number): string {
  return moneyFormatter.format(amount)
}

export function parseUtc(value: string): Date {
  // YYYY-MM-DD (date-only, no time component) is already UTC per ISO 8601.
  // Only full ISO strings with a 'T' separator need a trailing 'Z'.
  if (!value.includes('T') || value.endsWith('Z')) return new Date(value)
  return new Date(value + 'Z')
}

export function formatDate(value: string): string {
  return parseUtc(value).toLocaleDateString()
}

export function formatDateTime(value: string): string {
  return parseUtc(value).toLocaleString()
}

/**
 * Returns the URL only if it parses as `http://` or `https://`. Anything else
 * (including `javascript:`, `data:`, `vbscript:`, malformed input) returns null.
 *
 * Use when rendering a backend-supplied URL into an `<a href>` — defends against
 * stored XSS if the backend ever accepts a `javascript:` URI on a tenant /
 * profile field. React 19 logs a warning for `javascript:` hrefs but still
 * renders them.
 */
export function safeHttpHref(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:' ? value : null
  } catch {
    return null
  }
}
