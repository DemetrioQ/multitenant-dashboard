const moneyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export function formatMoney(amount: number): string {
  return moneyFormatter.format(amount)
}

export function formatDate(value: string): string {
  const d = new Date(value.endsWith('Z') ? value : value + 'Z')
  return d.toLocaleDateString()
}

export function formatDateTime(value: string): string {
  const d = new Date(value.endsWith('Z') ? value : value + 'Z')
  return d.toLocaleString()
}
