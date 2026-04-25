import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { ShoppingCart, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { getOrders, type OrderStatus } from '../api/orders'
import { formatMoney, formatDate } from '../utils/format'
import { PageLoading } from '../components/PageStates'
import { Badge, type BadgeProps, Card, IconButton, Select } from '../components/ui'

const PAGE_SIZE = 20
const STATUS_OPTIONS: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'fulfilled', label: 'Fulfilled' },
  { value: 'canceled', label: 'Canceled' },
  { value: 'refunded', label: 'Refunded' },
]

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

export function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const statusParam = (searchParams.get('status') ?? '') as OrderStatus | ''
  const pageParam = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)

  const { data, isLoading, error } = useQuery({
    queryKey: ['orders', pageParam, statusParam],
    queryFn: () =>
      getOrders({
        page: pageParam,
        pageSize: PAGE_SIZE,
        status: statusParam || undefined,
      }),
    placeholderData: (prev) => prev,
  })
  const orders = data?.items ?? []
  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const showSpinner = isLoading && !data

  const changeStatus = (next: OrderStatus | '') => {
    const params = new URLSearchParams()
    if (next) params.set('status', next)
    setSearchParams(params)
  }

  const changePage = (next: number) => {
    const params = new URLSearchParams(searchParams)
    if (next === 1) params.delete('page')
    else params.set('page', String(next))
    setSearchParams(params)
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Orders</h1>
          <p className="text-gray-400 mt-1 text-sm">
            {totalCount} order{totalCount !== 1 ? 's' : ''}
            {statusParam ? ` · ${statusParam}` : ''}
          </p>
        </div>
        <Select
          value={statusParam}
          onChange={(e) => changeStatus(e.target.value as OrderStatus | '')}
          className="w-auto bg-gray-900"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>

      {error && (
        <div className="mb-4 text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-3">
          Failed to load orders.
        </div>
      )}

      {showSpinner ? (
        <PageLoading boxed />
      ) : orders.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 gap-3">
          <ShoppingCart className="w-8 h-8 text-gray-700" />
          <p className="text-gray-500 text-sm">No orders found.</p>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden sm:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-800/40">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono text-white">{o.number}</td>
                      <td className="px-6 py-4 text-sm">
                        <p className="text-white">{o.customerName || '—'}</p>
                        <p className="text-gray-500 text-xs">{o.customerEmail}</p>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-white font-mono text-right">
                        {formatMoney(o.total)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400 text-right">{o.itemCount}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{formatDate(o.createdAt)}</td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/orders/${o.id}`}
                          className="inline-flex items-center gap-1 text-brand hover:text-brand-hover text-sm font-medium"
                        >
                          View <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {orders.map((o) => (
              <Link
                key={o.id}
                to={`/orders/${o.id}`}
                className="block bg-gray-900 border border-gray-800 rounded-xl p-4 hover:bg-gray-800/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-mono text-white">{o.number}</p>
                      <StatusBadge status={o.status} />
                    </div>
                    <p className="text-sm text-gray-300 mt-1 truncate">{o.customerName || '—'}</p>
                    <p className="text-xs text-gray-500 truncate">{o.customerEmail}</p>
                  </div>
                  <p className="text-sm text-white font-mono flex-shrink-0">
                    {formatMoney(o.total)}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800 text-xs text-gray-500">
                  <span>
                    {o.itemCount} item{o.itemCount !== 1 ? 's' : ''}
                  </span>
                  <span>{formatDate(o.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-400">
            Page {pageParam} of {totalPages}
          </p>
          <div className="flex gap-2">
            <IconButton
              onClick={() => changePage(Math.max(1, pageParam - 1))}
              disabled={pageParam === 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </IconButton>
            <IconButton
              onClick={() => changePage(Math.min(totalPages, pageParam + 1))}
              disabled={pageParam === totalPages}
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </IconButton>
          </div>
        </div>
      )}
    </div>
  )
}
