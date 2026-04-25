import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Navigate } from 'react-router-dom'
import { Package, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react'
import { getAdminProducts, getAdminTenants } from '../api/admin'
import { useAuth } from '../hooks/useAuth'
import { PageLoading } from '../components/PageStates'
import { Badge, Card, IconButton, Select } from '../components/ui'

const PAGE_SIZE = 20

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

  const {
    data: productsData,
    isLoading,
    error,
  } = useQuery({
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

  const filtered = filterTenant ? products.filter((p) => p.tenantId === filterTenant) : products

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
        <Select
          value={filterTenant}
          onChange={(e) => setFilterTenant(e.target.value)}
          className="w-auto"
        >
          <option value="">All tenants</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
        <span className="text-sm text-gray-500">
          {totalCount} product{totalCount !== 1 ? 's' : ''}
        </span>
      </div>

      {error && (
        <div className="mb-4 text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-3">
          Failed to load products.
        </div>
      )}

      {showSpinner ? (
        <PageLoading boxed />
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 gap-3">
          <Package className="w-8 h-8 text-gray-700" />
          <p className="text-gray-500 text-sm">No products found.</p>
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
                      Tenant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {tenantMap[p.tenantId] ?? p.tenantId}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-white">{p.name}</td>
                      <td className="px-6 py-4 text-sm text-white font-mono">
                        ${p.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">{p.stock}</td>
                      <td className="px-6 py-4">
                        <Badge variant={p.isActive ? 'success' : 'muted'}>
                          {p.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {filtered.map((p) => (
              <Card key={p.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{p.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {tenantMap[p.tenantId] ?? p.tenantId}
                    </p>
                  </div>
                  <Badge variant={p.isActive ? 'success' : 'muted'}>
                    {p.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-800 text-xs">
                  <span className="text-white font-mono">${p.price.toFixed(2)}</span>
                  <span className="text-gray-500">Stock: {p.stock}</span>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-400">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <IconButton
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </IconButton>
            <IconButton
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
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
