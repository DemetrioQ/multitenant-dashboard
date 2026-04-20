import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Navigate, Link } from 'react-router-dom'
import { Building2, ShieldCheck, ChevronLeft, ChevronRight, Users, Package } from 'lucide-react'
import { getAdminStats, getAdminTenants } from '../api/admin'
import { useAuth } from '../hooks/useAuth'

const PAGE_SIZE = 20

function StatCard({ label, value, icon: Icon, color, bg }: {
  label: string; value: number; icon: React.ElementType; color: string; bg: string
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-400">{label}</span>
        <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  )
}

function Badge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
      active ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-800 text-gray-500 border-gray-700'
    }`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

export function AdminPage() {
  const { isSuperAdmin } = useAuth()
  const [page, setPage] = useState(1)

  const { data: stats } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: getAdminStats,
    enabled: isSuperAdmin,
  })

  const { data: tenantsData, isLoading, error } = useQuery({
    queryKey: ['admin', 'tenants', page],
    queryFn: () => getAdminTenants(page, PAGE_SIZE),
    placeholderData: (prev) => prev,
    enabled: isSuperAdmin,
  })
  const tenants = tenantsData?.items ?? []
  const totalCount = tenantsData?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const showSpinner = isLoading && !tenantsData

  if (!isSuperAdmin) return <Navigate to="/dashboard" replace />

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          <h1 className="text-2xl font-semibold text-white">Platform admin</h1>
        </div>
        <p className="text-amber-400/70 mt-1 text-sm">Super-admin view — all tenants</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard label="Total tenants" value={stats.totalTenants} icon={Building2} color="text-amber-400" bg="bg-amber-500/10" />
          <StatCard label="Total users" value={stats.totalUsers} icon={Users} color="text-indigo-400" bg="bg-indigo-500/10" />
          <StatCard label="Total products" value={stats.totalProducts} icon={Package} color="text-emerald-400" bg="bg-emerald-500/10" />
        </div>
      )}

      {error && (
        <div className="mb-4 text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-3">Failed to load tenants.</div>
      )}

      {showSpinner ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center py-20">
          <p className="text-gray-500 text-sm">Loading…</p>
        </div>
      ) : tenants.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl flex flex-col items-center justify-center py-20 gap-3">
          <Building2 className="w-8 h-8 text-gray-700" />
          <p className="text-gray-500 text-sm">No tenants found.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-800/40">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Slug</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-white">{t.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-400 font-mono">{t.slug}</td>
                    <td className="px-6 py-4"><Badge active={t.isActive} /></td>
                    <td className="px-6 py-4 text-sm text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/admin/tenants/${t.id}`}
                        className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        View →
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
            {tenants.map((t) => (
              <Link
                key={t.id}
                to={`/admin/tenants/${t.id}`}
                className="block bg-gray-900 border border-gray-800 rounded-xl p-4 hover:bg-gray-800/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{t.name}</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5 truncate">{t.slug}</p>
                  </div>
                  <Badge active={t.isActive} />
                </div>
                <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-800">
                  Created {new Date(t.createdAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        </>
      )}

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
