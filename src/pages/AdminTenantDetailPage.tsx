import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Navigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import { getAdminTenant, getAdminTenantUsers, setTenantStatus } from '../api/admin'
import { useAuth } from '../hooks/useAuth'
import type { Tenant } from '../api/tenants'

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

export function AdminTenantDetailPage() {
  const { isSuperAdmin } = useAuth()
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [toggling, setToggling] = useState(false)

  const { data: tenant, isLoading, error } = useQuery({
    queryKey: ['admin', 'tenant', id],
    queryFn: () => getAdminTenant(id!),
    enabled: !!id && isSuperAdmin,
  })
  const showSpinner = isLoading && !tenant

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'tenant', id, 'users', page],
    queryFn: () => getAdminTenantUsers(id!, page, PAGE_SIZE),
    placeholderData: (prev) => prev,
    enabled: !!id && isSuperAdmin,
  })
  const users = usersData?.items ?? []
  const totalUsers = usersData?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalUsers / PAGE_SIZE))
  const showUsersSpinner = usersLoading && !usersData

  const handleToggleStatus = async () => {
    if (!tenant || !id) return
    const next = !tenant.isActive
    if (!confirm(`${next ? 'Activate' : 'Deactivate'} tenant "${tenant.name}"?`)) return
    setToggling(true)
    try {
      await setTenantStatus(id, next)
      qc.setQueryData(['admin', 'tenant', id], (prev: Tenant | undefined) =>
        prev ? { ...prev, isActive: next } : prev
      )
      qc.invalidateQueries({ queryKey: ['admin', 'tenants'] })
    } catch (err: any) {
      alert(err.response?.data?.detail ?? 'Failed to update tenant status.')
    } finally {
      setToggling(false)
    }
  }

  if (!isSuperAdmin) return <Navigate to="/dashboard" replace />

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to tenants
      </Link>

      {showSpinner ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-500 text-sm">Loading…</p>
        </div>
      ) : error ? (
        <div className="text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-3">Failed to load tenant.</div>
      ) : tenant ? (
        <>
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-white">{tenant.name}</h1>
              <p className="text-gray-400 mt-1 text-sm font-mono">{tenant.slug}</p>
            </div>
            <button
              onClick={handleToggleStatus}
              disabled={toggling}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors disabled:opacity-50 ${
                tenant.isActive
                  ? 'text-red-400 border-red-900/50 hover:bg-red-950/30'
                  : 'text-emerald-400 border-emerald-900/50 hover:bg-emerald-950/30'
              }`}
            >
              {toggling ? 'Saving…' : tenant.isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800 mb-8">
            {([
              { label: 'Status',   value: <Badge active={tenant.isActive} /> },
              { label: 'Created',  value: new Date(tenant.createdAt).toLocaleDateString() },
              { label: 'ID',       value: tenant.id, mono: true },
            ] as { label: string; value: React.ReactNode; mono?: boolean }[]).map(({ label, value, mono }) => (
              <div key={label} className="flex items-center justify-between px-6 py-4">
                <span className="text-sm text-gray-400 w-24 flex-shrink-0">{label}</span>
                <span className={`text-sm text-white flex-1 text-right ${mono ? 'font-mono text-gray-300' : ''}`}>{value}</span>
              </div>
            ))}
          </div>

          <div className="mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-medium text-white">Members ({totalUsers})</h2>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            {showUsersSpinner ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-gray-500 text-sm">Loading…</p>
              </div>
            ) : users.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-gray-500 text-sm">No users in this tenant.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-800/40">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-white">{u.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{u.role}</td>
                      <td className="px-6 py-4"><Badge active={u.isActive} /></td>
                      <td className="px-6 py-4 text-sm text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
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
        </>
      ) : null}
    </div>
  )
}
