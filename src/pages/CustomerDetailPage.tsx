import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ShoppingCart, MailCheck, MailX } from 'lucide-react'
import { getCustomer, type CustomerDetail } from '../api/customers'
import type { OrderStatus } from '../api/orders'
import { formatMoney, formatDate } from '../utils/format'
import { PageLoading } from '../components/PageStates'
import { Badge, type BadgeProps, Card } from '../components/ui'

const STATUS_VARIANT: Record<OrderStatus, BadgeProps['variant']> = {
  pending: 'warning',
  paid: 'info',
  fulfilled: 'success',
  canceled: 'muted',
  refunded: 'rose',
}

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className="capitalize">
      {status}
    </Badge>
  )
}

function displayName(c: CustomerDetail): string {
  const name = [c.firstName, c.lastName].filter(Boolean).join(' ').trim()
  return name || c.email
}

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const {
    data: customer,
    isLoading,
    error,
  } = useQuery<CustomerDetail>({
    queryKey: ['customer', id],
    queryFn: () => getCustomer(id!),
    enabled: !!id,
  })
  const showSpinner = isLoading && !customer
  const notFound = (error as any)?.response?.status === 404

  if (showSpinner) {
    return (
      <div className="p-4 sm:p-8 max-w-5xl mx-auto">
        <PageLoading className="py-8" />
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div className="p-4 sm:p-8 max-w-5xl mx-auto">
        <Link
          to="/customers"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to customers
        </Link>
        <div className="text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-3">
          {notFound ? 'Customer not found.' : 'Failed to load customer.'}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <Link
        to="/customers"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to customers
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold text-white">{displayName(customer)}</h1>
          {!customer.isActive && <Badge variant="muted">Inactive</Badge>}
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
        <Card className="p-5">
          <p className="text-sm font-medium text-gray-400 mb-1">Orders</p>
          <p className="text-2xl font-bold text-white">{customer.orderCount}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-medium text-gray-400 mb-1">Lifetime spend</p>
          <p className="text-2xl font-bold text-white font-mono">
            {formatMoney(customer.lifetimeSpend)}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-medium text-gray-400 mb-1">Joined</p>
          <p className="text-2xl font-bold text-white">{formatDate(customer.createdAt)}</p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-gray-500" />
          <h2 className="text-sm font-medium text-white">Order history</h2>
        </div>
        {customer.orders.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500 text-sm">No orders yet.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-800/40">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {customer.orders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <Link
                          to={`/orders/${o.id}`}
                          className="text-sm text-brand hover:text-brand-hover font-mono font-medium"
                        >
                          {o.number}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-white font-mono text-right">
                        {formatMoney(o.total)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">{formatDate(o.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-gray-800">
              {customer.orders.map((o) => (
                <Link
                  key={o.id}
                  to={`/orders/${o.id}`}
                  className="block p-4 hover:bg-gray-800/30 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-brand font-mono font-medium">{o.number}</span>
                    <StatusBadge status={o.status} />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="text-gray-500">{formatDate(o.createdAt)}</span>
                    <span className="text-white font-mono">{formatMoney(o.total)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
