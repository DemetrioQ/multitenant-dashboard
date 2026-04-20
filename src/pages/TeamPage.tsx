import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Users, ShieldCheck, ShieldOff, ChevronLeft, ChevronRight, UserPlus } from 'lucide-react'
import { getUsers, updateUserRole, deactivateUser, type User } from '../api/users'
import { sendInvitation } from '../api/invitations'
import { useAuth } from '../hooks/useAuth'

const PAGE_SIZE = 20

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

export function TeamPage() {
  const { userId, isAdmin } = useAuth()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)

  const { data, isLoading, error } = useQuery({
    queryKey: ['team', page],
    queryFn: () => getUsers(page, PAGE_SIZE),
    placeholderData: (prev) => prev,
  })
  const users: User[] = data?.items ?? []
  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const showSpinner = isLoading && !data

  const invalidate = () => qc.invalidateQueries({ queryKey: ['team'] })

  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

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

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviteLoading(true)
    setInviteError(null)
    setInviteSent(false)
    try {
      await sendInvitation(inviteEmail.trim())
      setInviteEmail('')
      setInviteSent(true)
    } catch {
      setInviteError('Something went wrong. Please try again.')
    } finally {
      setInviteLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Team</h1>
          <p className="text-gray-400 mt-1 text-sm">
            {totalCount} member{totalCount !== 1 ? 's' : ''}
            {!isAdmin && <span className="ml-2 text-gray-600">· View only</span>}
          </p>
        </div>
      </div>

      {isAdmin && (
        <div className="mb-6 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Invite member</p>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => { setInviteEmail(e.target.value); setInviteSent(false); setInviteError(null) }}
              placeholder="colleague@example.com"
              className="block w-full sm:flex-1 min-w-0 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={inviteLoading || !inviteEmail.trim()}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4" />
              {inviteLoading ? 'Sending…' : 'Send invite'}
            </button>
          </form>
          {inviteSent && (
            <p className="mt-2 text-sm text-emerald-400">
              If the email is not already registered, an invitation has been sent.
            </p>
          )}
          {inviteError && (
            <p className="mt-2 text-sm text-red-400">{inviteError}</p>
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-3">Failed to load team members.</div>
      )}

      {showSpinner ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center py-20">
          <p className="text-gray-500 text-sm">Loading…</p>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl flex flex-col items-center justify-center py-20 gap-3">
          <Users className="w-8 h-8 text-gray-700" />
          <p className="text-gray-500 text-sm">No team members found.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-800/40">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Joined</th>
                  {isAdmin && <th className="px-6 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-white">{u.email}</td>
                    <td className="px-6 py-4"><RoleBadge role={u.role} /></td>
                    <td className="px-6 py-4"><StatusBadge active={u.isActive} /></td>
                    <td className="px-6 py-4 text-sm text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    {isAdmin && (
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleRole(u)}
                            disabled={actionLoading === u.id || u.role === 'super-admin' || (u.role === 'admin' && u.id === userId)}
                            title={u.role === 'admin' && u.id === userId ? 'Cannot demote yourself' : u.role === 'admin' ? 'Demote to member' : 'Promote to admin'}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-40 text-gray-400 border-gray-700 hover:text-white hover:border-gray-600 hover:bg-gray-800"
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
                              title={u.id === userId ? 'Cannot deactivate yourself' : undefined}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-40 text-red-400 border-red-900/50 hover:bg-red-950/30"
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
            </div>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {users.map((u) => (
              <div key={u.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-white truncate min-w-0">{u.email}</p>
                  <StatusBadge active={u.isActive} />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <RoleBadge role={u.role} />
                  <span className="text-xs text-gray-500">Joined {new Date(u.createdAt).toLocaleDateString()}</span>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-800">
                    <button
                      onClick={() => handleToggleRole(u)}
                      disabled={actionLoading === u.id || u.role === 'super-admin' || (u.role === 'admin' && u.id === userId)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-40 text-gray-400 border-gray-700 hover:text-white hover:border-gray-600 hover:bg-gray-800"
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
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-40 text-red-400 border-red-900/50 hover:bg-red-950/30"
                      >
                        Deactivate
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-400">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
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
