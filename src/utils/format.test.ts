import { describe, it, expect } from 'vitest'
import { formatMoney, parseUtc, formatDate, formatDateTime } from './format'

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
