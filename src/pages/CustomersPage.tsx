import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { Users, ChevronLeft, ChevronRight, ExternalLink, MailCheck, MailX } from 'lucide-react'
import { getCustomers, type CustomerSummary } from '../api/customers'
import { useAuth } from '../hooks/useAuth'
import { formatMoney, formatDate } from '../utils/format'

const PAGE_SIZE = 20

function customerName(c: CustomerSummary): string {
  const name = [c.firstName, c.lastName].filter(Boolean).join(' ').trim()
  return name || '—'
}

export function CustomersPage() {
  const { tenantCurrency } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const pageParam = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)

  const { data, isLoading, error } = useQuery({
    queryKey: ['customers', pageParam],
    queryFn: () => getCustomers(pageParam, PAGE_SIZE),
    placeholderData: (prev) => prev,
  })
  const customers: CustomerSummary[] = data?.items ?? []
  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const showSpinner = isLoading && !data

  const changePage = (next: number) => {
    const params = new URLSearchParams()
    if (next !== 1) params.set('page', String(next))
    setSearchParams(params)
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Customers</h1>
        <p className="text-gray-400 mt-1 text-sm">
          {totalCount} customer{totalCount !== 1 ? 's' : ''}
        </p>
      </div>

      {error && (
        <div className="mb-4 text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-3">Failed to load customers.</div>
      )}

      {showSpinner ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center py-20">
          <p className="text-gray-500 text-sm">Loading…</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl flex flex-col items-center justify-center py-20 gap-3">
          <Users className="w-8 h-8 text-gray-700" />
          <p className="text-gray-500 text-sm">No customers yet.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-800/40">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Orders</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Lifetime spend</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {customers.map((c) => (
                  <tr key={c.id} className={`hover:bg-gray-800/30 transition-colors ${!c.isActive ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4 text-sm font-medium text-white">{customerName(c)}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      <span className="inline-flex items-center gap-1.5">
                        {c.email}
                        {c.isEmailVerified ? (
                          <MailCheck className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <MailX className="w-3.5 h-3.5 text-gray-600" />
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300 font-mono text-right">{c.orderCount}</td>
                    <td className="px-6 py-4 text-sm text-white font-mono text-right">{formatMoney(c.lifetimeSpend, tenantCurrency)}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{formatDate(c.createdAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/customers/${c.id}`}
                        className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-sm font-medium"
                      >
                        View <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {customers.map((c) => (
              <Link
                key={c.id}
                to={`/customers/${c.id}`}
                className={`block bg-gray-900 border border-gray-800 rounded-xl p-4 hover:bg-gray-800/30 transition-colors ${!c.isActive ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{customerName(c)}</p>
                    <p className="text-xs text-gray-400 mt-0.5 inline-flex items-center gap-1.5 truncate">
                      <span className="truncate">{c.email}</span>
                      {c.isEmailVerified ? (
                        <MailCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <MailX className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                      )}
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-600 flex-shrink-0" />
                </div>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-800 text-xs">
                  <div>
                    <p className="text-gray-500">Orders</p>
                    <p className="text-gray-200 font-mono mt-0.5">{c.orderCount}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Spend</p>
                    <p className="text-white font-mono mt-0.5">{formatMoney(c.lifetimeSpend, tenantCurrency)}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-gray-500">Joined</p>
                    <p className="text-gray-300 mt-0.5">{formatDate(c.createdAt)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-400">Page {pageParam} of {totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => changePage(Math.max(1, pageParam - 1))}
              disabled={pageParam === 1}
              className="p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => changePage(Math.min(totalPages, pageParam + 1))}
              disabled={pageParam === totalPages}
              className="p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
