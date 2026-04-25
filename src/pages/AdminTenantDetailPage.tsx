import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Navigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import { getAdminTenant, getAdminTenantUsers, setTenantStatus } from '../api/admin'
import { useAuth } from '../hooks/useAuth'
import type { Tenant } from '../api/tenants'
import { formatDate } from '../utils/format'
import { PageLoading } from '../components/PageStates'
import { Badge, Button, Card, IconButton, useConfirm, useToast } from '../components/ui'

const PAGE_SIZE = 20

function StatusBadge({ active }: { active: boolean }) {
  return <Badge variant={active ? 'success' : 'muted'}>{active ? 'Active' : 'Inactive'}</Badge>
}

export function AdminTenantDetailPage() {
  const { isSuperAdmin } = useAuth()
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const { confirm, dialog } = useConfirm()
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const [toggling, setToggling] = useState(false)

  const {
    data: tenant,
    isLoading,
    error,
  } = useQuery({
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
    const ok = await confirm({
      title: next ? 'Activate tenant?' : 'Deactivate tenant?',
      message: `"${tenant.name}" will be ${next ? 'reactivated' : 'marked inactive'}.`,
      destructive: !next,
      confirmLabel: next ? 'Activate' : 'Deactivate',
    })
    if (!ok) return
    setToggling(true)
    try {
      await setTenantStatus(id, next)
      qc.setQueryData(['admin', 'tenant', id], (prev: Tenant | undefined) =>
        prev ? { ...prev, isActive: next } : prev,
      )
      qc.invalidateQueries({ queryKey: ['admin', 'tenants'] })
    } catch (err: any) {
      toast(err.response?.data?.detail ?? 'Failed to update tenant status.', 'error')
    } finally {
      setToggling(false)
    }
  }

  if (!isSuperAdmin) return <Navigate to="/dashboard" replace />

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      {dialog}
      <Link
        to="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to tenants
      </Link>

      {showSpinner ? (
        <PageLoading />
      ) : error ? (
        <div className="text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-3">
          Failed to load tenant.
        </div>
      ) : tenant ? (
        <>
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-white">{tenant.name}</h1>
              <p className="text-gray-400 mt-1 text-sm font-mono">{tenant.slug}</p>
            </div>
            <Button
              variant="outline"
              onClick={handleToggleStatus}
              disabled={toggling}
              className={
                tenant.isActive
                  ? 'text-red-400 border-red-900/50 hover:bg-red-950/30'
                  : 'text-emerald-400 border-emerald-900/50 hover:bg-emerald-950/30'
              }
            >
              {toggling ? 'Saving…' : tenant.isActive ? 'Deactivate' : 'Activate'}
            </Button>
          </div>

          <Card className="divide-y divide-gray-800 mb-8">
            {(
              [
                { label: 'Status', value: <StatusBadge active={tenant.isActive} /> },
                { label: 'Created', value: formatDate(tenant.createdAt) },
                { label: 'ID', value: tenant.id, mono: true },
              ] as { label: string; value: React.ReactNode; mono?: boolean }[]
            ).map(({ label, value, mono }) => (
              <div key={label} className="flex items-center justify-between px-6 py-4">
                <span className="text-sm text-gray-400 w-24 flex-shrink-0">{label}</span>
                <span
                  className={`text-sm text-white flex-1 text-right ${mono ? 'font-mono text-gray-300' : ''}`}
                >
                  {value}
                </span>
              </div>
            ))}
          </Card>

          <div className="mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-medium text-white">Members ({totalUsers})</h2>
          </div>
          <Card className="overflow-hidden">
            {showUsersSpinner ? (
              <PageLoading className="py-12" />
            ) : users.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-gray-500 text-sm">No users in this tenant.</p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-gray-800 bg-gray-800/40">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Joined
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-800/30 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-white">{u.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-400">{u.role}</td>
                          <td className="px-6 py-4">
                            <StatusBadge active={u.isActive} />
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400">
                            {formatDate(u.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="sm:hidden divide-y divide-gray-800">
                  {users.map((u) => (
                    <div key={u.id} className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-white truncate min-w-0">{u.email}</p>
                        <StatusBadge active={u.isActive} />
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span className="capitalize">{u.role}</span>
                        <span>Joined {formatDate(u.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>

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
        </>
      ) : null}
    </div>
  )
}
