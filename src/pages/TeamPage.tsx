import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Users, ShieldCheck, ShieldOff, ChevronLeft, ChevronRight, UserPlus } from 'lucide-react'
import { getUsers, updateUserRole, deactivateUser, type User } from '../api/users'
import { sendInvitation } from '../api/invitations'
import { useAuth } from '../hooks/useAuth'
import { formatDate } from '../utils/format'
import { PageLoading } from '../components/PageStates'
import { Badge, Button, Card, IconButton, Input, useConfirm, useToast } from '../components/ui'

const PAGE_SIZE = 20

function RoleBadge({ role }: { role: string }) {
  const isAdminRole = role === 'admin' || role === 'super-admin'
  return <Badge variant={isAdminRole ? 'info' : 'default'}>{role}</Badge>
}

function StatusBadge({ active }: { active: boolean }) {
  return <Badge variant={active ? 'success' : 'muted'}>{active ? 'Active' : 'Inactive'}</Badge>
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
  const { confirm, dialog } = useConfirm()
  const { toast } = useToast()

  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

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
      {dialog}
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
        <Card className="mb-6 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            Invite member
          </p>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => {
                setInviteEmail(e.target.value)
                setInviteSent(false)
                setInviteError(null)
              }}
              placeholder="colleague@example.com"
              className="sm:flex-1 min-w-0"
            />
            <Button
              type="submit"
              disabled={inviteLoading || !inviteEmail.trim()}
              className="whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4" />
              {inviteLoading ? 'Sending…' : 'Send invite'}
            </Button>
          </form>
          {inviteSent && (
            <p className="mt-2 text-sm text-emerald-400">
              If the email is not already registered, an invitation has been sent.
            </p>
          )}
          {inviteError && <p className="mt-2 text-sm text-red-400">{inviteError}</p>}
        </Card>
      )}

      {error && (
        <div className="mb-4 text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-3">
          Failed to load team members.
        </div>
      )}

      {showSpinner ? (
        <PageLoading boxed />
      ) : users.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 gap-3">
          <Users className="w-8 h-8 text-gray-700" />
          <p className="text-gray-500 text-sm">No team members found.</p>
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
                    {isAdmin && <th className="px-6 py-3" />}
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
                      {isAdmin && (
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
                                title={u.id === userId ? 'Cannot deactivate yourself' : undefined}
                                className="text-red-400 border-red-900/50 hover:bg-red-950/30"
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
                {isAdmin && (
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
