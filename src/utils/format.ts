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
