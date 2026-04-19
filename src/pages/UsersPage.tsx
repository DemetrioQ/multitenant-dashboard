import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Users, ShieldCheck, ShieldOff } from 'lucide-react'
import { getUsers, updateUserRole, deactivateUser, type User } from '../api/users'
import { useAuth } from '../hooks/useAuth'

function RoleBadge({ role }: { role: string }) {
  const isAdminRole = role === 'admin' || role === 'super-admin'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
      isAdminRole
        ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
        : 'bg-gray-800 text-gray-400 border-gray-700'
    }`}>
      {role}
    </span>
  )
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
      active
        ? 'bg-green-500/20 text-green-400 border-green-500/30'
        : 'bg-gray-800 text-gray-500 border-gray-700'
    }`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  )
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

  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const handleToggleRole = async (user: User) => {
    const newRole = user.role === 'admin' ? 'member' : 'admin'
    if (!confirm(`Change ${user.email}'s role to ${newRole}?`)) return
    setActionLoading(user.id)
    try {
      await updateUserRole(user.id, newRole)
      invalidate()
    } catch (err: any) {
      alert(err.response?.data?.detail ?? 'Failed to update role.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeactivate = async (user: User) => {
    if (!confirm(`Deactivate ${user.email}? They will no longer be able to sign in.`)) return
    setActionLoading(user.id)
    try {
      await deactivateUser(user.id)
      invalidate()
    } catch (err: any) {
      alert(err.response?.data?.detail ?? 'Failed to deactivate user.')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
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
        <div className="mb-4 text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-3">Failed to load users.</div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {showSpinner ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-gray-500 text-sm">Loading…</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Users className="w-8 h-8 text-gray-700" />
            <p className="text-gray-500 text-sm">No users found in this tenant.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-800/40">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Joined</th>
                {canManage && <th className="px-6 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-white">{u.email}</td>
                  <td className="px-6 py-4"><RoleBadge role={u.role} /></td>
                  <td className="px-6 py-4"><StatusBadge active={u.isActive} /></td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  {canManage && (
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleRole(u)}
                          disabled={actionLoading === u.id || u.role === 'super-admin' || (u.role === 'admin' && u.id === userId)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-40
                            text-gray-400 border-gray-700 hover:text-white hover:border-gray-600 hover:bg-gray-800"
                          title={u.role === 'admin' && u.id === userId ? 'Cannot demote yourself' : u.role === 'admin' ? 'Demote to member' : 'Promote to admin'}
                        >
                          {u.role === 'admin'
                            ? <><ShieldOff className="w-3.5 h-3.5" /> Demote</>
                            : <><ShieldCheck className="w-3.5 h-3.5" /> Promote</>
                          }
                        </button>
                        {u.isActive && u.role !== 'super-admin' && (
                          <button
                            onClick={() => handleDeactivate(u)}
                            disabled={actionLoading === u.id || u.id === userId}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-40
                              text-red-400 border-red-900/50 hover:bg-red-950/30"
                            title={u.id === userId ? 'Cannot deactivate yourself' : undefined}
                          >
                            Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
