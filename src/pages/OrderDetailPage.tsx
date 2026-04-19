import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Package, CheckCircle2, XCircle } from 'lucide-react'
import {
  getOrder, fulfillOrder, cancelOrder,
  type OrderDetail, type OrderStatus,
} from '../api/orders'
import { useAuth } from '../hooks/useAuth'
import { formatMoney, formatDateTime } from '../utils/format'

const STATUS_BADGE: Record<OrderStatus, string> = {
  pending:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
  paid:      'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  fulfilled: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  canceled:  'bg-gray-800 text-gray-500 border-gray-700',
  refunded:  'bg-rose-500/15 text-rose-400 border-rose-500/30',
}

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${STATUS_BADGE[status]}`}>
      {status}
    </span>
  )
}

function customerLabel(c: OrderDetail['customer']): string {
  const name = `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim()
  return name || c.email
}

function shippingLines(o: OrderDetail): string[] {
  const out: string[] = []
  if (o.shippingLine1) out.push(o.shippingLine1)
  if (o.shippingLine2) out.push(o.shippingLine2)
  const cityRegion = [o.shippingCity, o.shippingRegion].filter(Boolean).join(', ')
  const cityLine = [cityRegion, o.shippingPostalCode].filter(Boolean).join(' ')
  if (cityLine) out.push(cityLine)
  if (o.shippingCountry) out.push(o.shippingCountry)
  return out
}

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { tenantCurrency, isAdmin } = useAuth()
  const qc = useQueryClient()

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrder(id!),
    enabled: !!id,
  })
  const showSpinner = isLoading && !order
  const notFound = (error as any)?.response?.status === 404

  const [actionLoading, setActionLoading] = useState<'fulfill' | 'cancel' | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  if (showSpinner) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <p className="text-gray-500 text-sm">Loading…</p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <Link to="/orders" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to orders
        </Link>
        <div className="text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-3">
          {notFound ? 'Order not found.' : 'Failed to load order.'}
        </div>
      </div>
    )
  }

  const canFulfill = order.status === 'paid'
  const canCancel = isAdmin && !['fulfilled', 'canceled', 'refunded'].includes(order.status)

  const setOrderCache = (updated: OrderDetail) => {
    qc.setQueryData(['order', id], updated)
    qc.invalidateQueries({ queryKey: ['orders'] })
  }

  const doFulfill = async () => {
    if (!confirm(`Mark order ${order.number} as fulfilled?`)) return
    setActionLoading('fulfill')
    setActionError(null)
    try {
      const updated = await fulfillOrder(order.id)
      setOrderCache(updated)
    } catch (err: any) {
      setActionError(err?.response?.data?.detail ?? 'Failed to fulfill order.')
    } finally {
      setActionLoading(null)
    }
  }

  const doCancel = async () => {
    if (!confirm(`Cancel order ${order.number}? Stock will be restored.`)) return
    setActionLoading('cancel')
    setActionError(null)
    try {
      const updated = await cancelOrder(order.id)
      setOrderCache(updated)
    } catch (err: any) {
      setActionError(err?.response?.data?.detail ?? 'Failed to cancel order.')
    } finally {
      setActionLoading(null)
    }
  }

  const shipping = shippingLines(order)
  const timestamps: [string, string | null][] = [
    ['Created',   order.createdAt],
    ['Paid',      order.paidAt],
    ['Fulfilled', order.fulfilledAt],
    ['Canceled',  order.canceledAt],
  ]

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link to="/orders" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-white font-mono">{order.number}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-gray-500 text-sm mt-1">{formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          {canFulfill && (
            <button
              onClick={doFulfill}
              disabled={actionLoading !== null}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              {actionLoading === 'fulfill' ? 'Fulfilling…' : 'Mark fulfilled'}
            </button>
          )}
          {canCancel && (
            <button
              onClick={doCancel}
              disabled={actionLoading !== null}
              className="inline-flex items-center gap-2 bg-gray-800 hover:bg-red-950 border border-gray-700 hover:border-red-900/60 text-gray-300 hover:text-red-400 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <XCircle className="w-4 h-4" />
              {actionLoading === 'cancel' ? 'Canceling…' : 'Cancel order'}
            </button>
          )}
        </div>
      </div>

      {actionError && (
        <div className="mb-4 text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-3">{actionError}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-medium text-white">Line items</h2>
          </div>
          <ul className="divide-y divide-gray-800">
            {order.items.map((it, i) => (
              <li key={i} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm text-white">{it.productName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {it.productSku ? `SKU ${it.productSku} · ` : ''}{formatMoney(it.unitPrice, tenantCurrency)} × {it.quantity}
                  </p>
                </div>
                <span className="text-sm font-mono text-white whitespace-nowrap">
                  {formatMoney(it.lineTotal, tenantCurrency)}
                </span>
              </li>
            ))}
          </ul>

          <div className="border-t border-gray-800 mt-4 pt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Subtotal</span>
              <span className="text-white font-mono">{formatMoney(order.subtotal, tenantCurrency)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">Total</span>
              <span className="text-lg font-semibold text-white font-mono">{formatMoney(order.total, tenantCurrency)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-sm font-medium text-white mb-3">Customer</h2>
            <Link
              to={`/customers/${order.customer.id}`}
              className="block text-sm text-indigo-400 hover:text-indigo-300 font-medium"
            >
              {customerLabel(order.customer)}
            </Link>
            <p className="text-xs text-gray-500 mt-0.5">{order.customer.email}</p>
          </div>

          {shipping.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h2 className="text-sm font-medium text-white mb-3">Shipping</h2>
              <div className="space-y-0.5">
                {shipping.map((line, i) => (
                  <p key={i} className="text-sm text-gray-300">{line}</p>
                ))}
              </div>
            </div>
          )}

          {order.paymentProvider && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h2 className="text-sm font-medium text-white mb-3">Payment</h2>
              <p className="text-sm text-gray-300 capitalize">{order.paymentProvider}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-medium text-white mb-3">Timeline</h2>
        <ul className="space-y-2">
          {timestamps.filter(([, v]) => !!v).map(([label, value]) => (
            <li key={label} className="flex items-center justify-between text-sm">
              <span className="text-gray-400">{label}</span>
              <span className="text-gray-300">{formatDateTime(value!)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
