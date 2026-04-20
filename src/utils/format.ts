export function formatMoney(amount: number, currency: string | null | undefined): string {
  const code = currency && /^[A-Z]{3}$/.test(currency) ? currency : 'USD'
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: code }).format(amount)
  } catch {
    return `${code} ${amount.toFixed(2)}`
  }
}

export function currencySymbol(currency: string | null | undefined): string {
  const code = currency && /^[A-Z]{3}$/.test(currency) ? currency : 'USD'
  try {
    const parts = new Intl.NumberFormat(undefined, { style: 'currency', currency: code }).formatToParts(0)
    return parts.find((p) => p.type === 'currency')?.value ?? code
  } catch {
    return code
  }
}

export function formatDate(value: string): string {
  const d = new Date(value.endsWith('Z') ? value : value + 'Z')
  return d.toLocaleDateString()
}

export function formatDateTime(value: string): string {
  const d = new Date(value.endsWith('Z') ? value : value + 'Z')
  return d.toLocaleString()
}
