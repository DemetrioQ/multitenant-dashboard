import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ShoppingCart, MailCheck, MailX } from 'lucide-react'
import { getCustomer, type CustomerDetail } from '../api/customers'
import type { OrderStatus } from '../api/orders'
import { useAuth } from '../hooks/useAuth'
import { formatMoney, formatDate } from '../utils/format'

const STATUS_BADGE: Record<OrderStatus, string> = {
  pending:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
  paid:      'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  fulfilled: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  canceled:  'bg-gray-800 text-gray-500 border-gray-700',
  refunded:  'bg-rose-500/15 text-rose-400 border-rose-500/30',
}

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${STATUS_BADGE[status]}`}>
      {status}
    </span>
  )
}

function displayName(c: CustomerDetail): string {
  const name = [c.firstName, c.lastName].filter(Boolean).join(' ').trim()
  return name || c.email
}

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { tenantCurrency } = useAuth()
  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    getCustomer(id)
      .then(setCustomer)
      .catch((err) => {
        if (err?.response?.status === 404) setError('Customer not found.')
        else setError('Failed to load customer.')
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <p className="text-gray-500 text-sm">Loading…</p>
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <Link to="/customers" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to customers
        </Link>
        <div className="text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-3">
          {error ?? 'Customer not found.'}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link to="/customers" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to customers
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold text-white">{displayName(customer)}</h1>
          {!customer.isActive && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-gray-800 text-gray-500 border-gray-700">
              Inactive
            </span>
          )}
        </div>
        <p className="text-gray-500 text-sm mt-1 inline-flex items-center gap-2">
          {customer.email}
          {customer.isEmailVerified ? (
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <MailCheck className="w-3.5 h-3.5" /> verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-gray-500">
              <MailX className="w-3.5 h-3.5" /> unverified
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-sm font-medium text-gray-400 mb-1">Orders</p>
          <p className="text-2xl font-bold text-white">{customer.orderCount}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-sm font-medium text-gray-400 mb-1">Lifetime spend</p>
          <p className="text-2xl font-bold text-white font-mono">{formatMoney(customer.lifetimeSpend, tenantCurrency)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-sm font-medium text-gray-400 mb-1">Joined</p>
          <p className="text-2xl font-bold text-white">{formatDate(customer.createdAt)}</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-gray-500" />
          <h2 className="text-sm font-medium text-white">Order history</h2>
        </div>
        {customer.orders.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500 text-sm">No orders yet.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-800/40">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {customer.orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <Link
                      to={`/orders/${o.id}`}
                      className="text-sm text-indigo-400 hover:text-indigo-300 font-mono font-medium"
                    >
                      {o.number}
                    </Link>
                  </td>
                  <td className="px-6 py-4"><StatusBadge status={o.status} /></td>
                  <td className="px-6 py-4 text-sm text-white font-mono text-right">{formatMoney(o.total, tenantCurrency)}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">{formatDate(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
