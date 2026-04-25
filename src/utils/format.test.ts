import { describe, it, expect } from 'vitest'
import { formatMoney, parseUtc, formatDate, formatDateTime, safeHttpHref } from './format'

describe('formatMoney', () => {
  it('formats with $ and two decimals', () => {
    expect(formatMoney(1234.5)).toBe('$1,234.50')
    expect(formatMoney(0)).toBe('$0.00')
    expect(formatMoney(0.1)).toBe('$0.10')
  })
})

describe('parseUtc', () => {
  it('appends Z to backend datetimes lacking it', () => {
    const d = parseUtc('2026-04-24T15:30:00')
    expect(d.toISOString()).toBe('2026-04-24T15:30:00.000Z')
  })

  it('preserves existing Z suffix', () => {
    const d = parseUtc('2026-04-24T15:30:00Z')
    expect(d.toISOString()).toBe('2026-04-24T15:30:00.000Z')
  })

  it('treats date-only strings as UTC midnight (no Z appended)', () => {
    // YYYY-MM-DD is already UTC per ISO 8601 — appending Z would corrupt it.
    const d = parseUtc('2026-04-24')
    expect(d.toISOString()).toBe('2026-04-24T00:00:00.000Z')
  })
})

describe('formatDate / formatDateTime', () => {
  it('round-trips datetimes through parseUtc', () => {
    // Just ensure no throw and produces a non-empty string. Locale-dependent.
    expect(formatDate('2026-04-24T15:30:00')).toBeTruthy()
    expect(formatDateTime('2026-04-24T15:30:00')).toBeTruthy()
  })
})

describe('safeHttpHref', () => {
  it('passes http and https URLs through', () => {
    expect(safeHttpHref('https://example.com')).toBe('https://example.com')
    expect(safeHttpHref('http://example.com/path?q=1')).toBe('http://example.com/path?q=1')
  })

  it('rejects javascript: URIs', () => {
    expect(safeHttpHref('javascript:alert(1)')).toBeNull()
    expect(safeHttpHref('JAVASCRIPT:alert(1)')).toBeNull()
  })

  it('rejects data:, vbscript:, file:, and other schemes', () => {
    expect(safeHttpHref('data:text/html,<script>alert(1)</script>')).toBeNull()
    expect(safeHttpHref('vbscript:msgbox(1)')).toBeNull()
    expect(safeHttpHref('file:///etc/passwd')).toBeNull()
    expect(safeHttpHref('mailto:x@y.com')).toBeNull()
  })

  it('handles null / empty / malformed', () => {
    expect(safeHttpHref(null)).toBeNull()
    expect(safeHttpHref(undefined)).toBeNull()
    expect(safeHttpHref('')).toBeNull()
    expect(safeHttpHref('not a url')).toBeNull()
  })
})
