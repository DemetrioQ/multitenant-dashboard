import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { ClipboardList, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react'
import { getAdminAudit, getAdminTenants } from '../api/admin'
import type { AuditEntry, AuditResult } from '../api/audit'
import type { Tenant } from '../api/tenants'
import { useAuth } from '../hooks/useAuth'

const PAGE_SIZE = 20

const ACTION_LABELS: Record<string, string> = {
  'product.created': 'Product created',
  'product.updated': 'Product updated',
  'product.activated': 'Product activated',
  'product.deactivated': 'Product deactivated',
  'tenant.updated': 'Tenant updated',
  'tenant.deactivated': 'Tenant deactivated',
  'user.role_updated': 'Role changed',
  'user.deactivated': 'User deactivated',
  'user.invited': 'User invited',
  'profile.updated': 'Profile updated',
}

function ActionBadge({ action }: { action: string }) {
  const isDestructive = action.includes('deactivated')
  const isPositive = action.includes('created') || action.includes('invited') || (action.includes('activated') && !isDestructive)
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
      isDestructive ? 'bg-red-500/10 text-red-400 border-red-500/20'
      : isPositive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      : 'bg-gray-800 text-gray-400 border-gray-700'
    }`}>
      {ACTION_LABELS[action] ?? action}
    </span>
  )
}

export function AdminAuditPage() {
  const { isSuperAdmin } = useAuth()

  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [tenants, setTenants] = useState<Tenant[]>([])
  const [filterTenant, setFilterTenant] = useState('')

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  useEffect(() => {
    getAdminTenants(1, 100).then((d) => setTenants(d.items)).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    getAdminAudit(page, PAGE_SIZE)
      .then((data: AuditResult) => { setEntries(data.items); setTotalCount(data.totalCount) })
      .catch(() => setError('Failed to load audit log.'))
      .finally(() => setLoading(false))
  }, [page])

  if (!isSuperAdmin) return <Navigate to="/dashboard" replace />

  const filtered = filterTenant
    ? entries.filter((e) => e.tenantId === filterTenant)
    : entries

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          <h1 className="text-2xl font-semibold text-white">Audit log</h1>
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
        <span className="text-sm text-gray-500">{totalCount} event{totalCount !== 1 ? 's' : ''}</span>
      </div>

      {error && (
        <div className="mb-4 text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-3">{error}</div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-gray-500 text-sm">Loading...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <ClipboardList className="w-8 h-8 text-gray-700" />
            <p className="text-gray-500 text-sm">No audit events found.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-800/40">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Entity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-white">{e.userEmail}</td>
                  <td className="px-6 py-4"><ActionBadge action={e.action} /></td>
                  <td className="px-6 py-4 text-sm text-gray-400">{e.entityType}</td>
                  <td className="px-6 py-4 text-sm text-gray-300 max-w-xs truncate">{e.details ?? '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">
                    {new Date(e.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
