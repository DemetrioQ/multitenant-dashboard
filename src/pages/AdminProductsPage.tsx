import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Navigate } from 'react-router-dom'
import { Package, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react'
import { getAdminProducts, getAdminTenants } from '../api/admin'
import { useAuth } from '../hooks/useAuth'

const PAGE_SIZE = 20

function Badge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
      active ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-800 text-gray-500 border-gray-700'
    }`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

export function AdminProductsPage() {
  const { isSuperAdmin } = useAuth()
  const [page, setPage] = useState(1)
  const [filterTenant, setFilterTenant] = useState('')

  const { data: tenantsData } = useQuery({
    queryKey: ['admin', 'tenants', 'all'],
    queryFn: () => getAdminTenants(1, 100),
    enabled: isSuperAdmin,
  })
  const tenants = tenantsData?.items ?? []
  const tenantMap = useMemo(() => {
    const m: Record<string, string> = {}
    for (const t of tenants) m[t.id] = t.name
    return m
  }, [tenants])

  const { data: productsData, isLoading, error } = useQuery({
    queryKey: ['admin', 'products', page],
    queryFn: () => getAdminProducts(page, PAGE_SIZE),
    placeholderData: (prev) => prev,
    enabled: isSuperAdmin,
  })
  const products = productsData?.items ?? []
  const totalCount = productsData?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const showSpinner = isLoading && !productsData

  if (!isSuperAdmin) return <Navigate to="/dashboard" replace />

  const filtered = filterTenant
    ? products.filter((p) => p.tenantId === filterTenant)
    : products

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          <h1 className="text-2xl font-semibold text-white">Products</h1>
        </div>
        <p className="text-amber-400/70 mt-1 text-sm">All tenants</p>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <select
          value={filterTenant}
          onChange={(e) => setFilterTenant(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All tenants</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500">{totalCount} product{totalCount !== 1 ? 's' : ''}</span>
      </div>

      {error && (
        <div className="mb-4 text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-3">Failed to load products.</div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {showSpinner ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-gray-500 text-sm">Loading...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Package className="w-8 h-8 text-gray-700" />
            <p className="text-gray-500 text-sm">No products found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-800/40">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tenant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-400">{tenantMap[p.tenantId] ?? p.tenantId}</td>
                  <td className="px-6 py-4 text-sm font-medium text-white">{p.name}</td>
                  <td className="px-6 py-4 text-sm text-white font-mono">${p.price.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">{p.stock}</td>
                  <td className="px-6 py-4"><Badge active={p.isActive} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-400">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-white disabled:opacity-40 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-white disabled:opacity-40 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
