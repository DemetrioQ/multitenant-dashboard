import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Users, ShieldCheck, ShieldOff } from 'lucide-react'
import { getUsers, updateUserRole, deactivateUser, type User } from '../api/users'
import { useAuth } from '../hooks/useAuth'
import { formatDate } from '../utils/format'
import { PageLoading } from '../components/PageStates'
import { Badge, Button, Card, useConfirm, useToast } from '../components/ui'

function RoleBadge({ role }: { role: string }) {
  const isAdminRole = role === 'admin' || role === 'super-admin'
  return <Badge variant={isAdminRole ? 'info' : 'default'}>{role}</Badge>
}

function StatusBadge({ active }: { active: boolean }) {
  return <Badge variant={active ? 'success' : 'muted'}>{active ? 'Active' : 'Inactive'}</Badge>
}

export function UsersPage() {
  const { userId, isAdmin, isSuperAdmin } = useAuth()
  const canManage = isAdmin || isSuperAdmin
  const qc = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers(),
  })
  const users: User[] = data?.items ?? []
  const hasCachedData = !!data
  const showSpinner = isLoading && !hasCachedData

  const invalidate = () => qc.invalidateQueries({ queryKey: ['users'] })
  const { confirm, dialog } = useConfirm()
  const { toast } = useToast()

  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const handleToggleRole = async (user: User) => {
    const newRole = user.role === 'admin' ? 'member' : 'admin'
    const ok = await confirm({
      title: 'Change role?',
      message: `Change ${user.email}'s role to ${newRole}?`,
      confirmLabel: 'Change role',
    })
    if (!ok) return
    setActionLoading(user.id)
    try {
      await updateUserRole(user.id, newRole)
      invalidate()
    } catch (err: any) {
      toast(err.response?.data?.detail ?? 'Failed to update role.', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeactivate = async (user: User) => {
    const ok = await confirm({
      title: 'Deactivate user?',
      message: `${user.email} will no longer be able to sign in.`,
      destructive: true,
      confirmLabel: 'Deactivate',
    })
    if (!ok) return
    setActionLoading(user.id)
    try {
      await deactivateUser(user.id)
      invalidate()
    } catch (err: any) {
      toast(err.response?.data?.detail ?? 'Failed to deactivate user.', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      {dialog}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Users</h1>
        <p className="text-gray-400 mt-1 text-sm">
          {users.length > 0
            ? `${users.length} user${users.length !== 1 ? 's' : ''} in this tenant`
            : 'Manage users in your tenant'}
          {!canManage && (
            <span className="ml-2 text-gray-600">· View only (admin required for changes)</span>
          )}
        </p>
      </div>

      {error && (
        <div className="mb-4 text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-3">
          Failed to load users.
        </div>
      )}

      {showSpinner ? (
        <PageLoading boxed />
      ) : users.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 gap-3">
          <Users className="w-8 h-8 text-gray-700" />
          <p className="text-gray-500 text-sm">No users found in this tenant.</p>
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
                    {canManage && <th className="px-6 py-3" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-white">{u.email}</td>
                      <td className="px-6 py-4">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge active={u.isActive} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">{formatDate(u.createdAt)}</td>
                      {canManage && (
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleRole(u)}
                              disabled={
                                actionLoading === u.id ||
                                u.role === 'super-admin' ||
                                (u.role === 'admin' && u.id === userId)
                              }
                              title={
                                u.role === 'admin' && u.id === userId
                                  ? 'Cannot demote yourself'
                                  : u.role === 'admin'
                                    ? 'Demote to member'
                                    : 'Promote to admin'
                              }
                            >
                              {u.role === 'admin' ? (
                                <>
                                  <ShieldOff className="w-3.5 h-3.5" /> Demote
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="w-3.5 h-3.5" /> Promote
                                </>
                              )}
                            </Button>
                            {u.isActive && u.role !== 'super-admin' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeactivate(u)}
                                disabled={actionLoading === u.id || u.id === userId}
                                className="text-red-400 border-red-900/50 hover:bg-red-950/30"
                                title={u.id === userId ? 'Cannot deactivate yourself' : undefined}
                              >
                                Deactivate
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {users.map((u) => (
              <Card key={u.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-white truncate min-w-0">{u.email}</p>
                  <StatusBadge active={u.isActive} />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <RoleBadge role={u.role} />
                  <span className="text-xs text-gray-500">Joined {formatDate(u.createdAt)}</span>
                </div>
                {canManage && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-800">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleRole(u)}
                      disabled={
                        actionLoading === u.id ||
                        u.role === 'super-admin' ||
                        (u.role === 'admin' && u.id === userId)
                      }
                    >
                      {u.role === 'admin' ? (
                        <>
                          <ShieldOff className="w-3.5 h-3.5" /> Demote
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5" /> Promote
                        </>
                      )}
                    </Button>
                    {u.isActive && u.role !== 'super-admin' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeactivate(u)}
                        disabled={actionLoading === u.id || u.id === userId}
                        className="text-red-400 border-red-900/50 hover:bg-red-950/30"
                      >
                        Deactivate
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
