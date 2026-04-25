import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Navigate } from 'react-router-dom'
import { ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react'
import { getAuditLog } from '../api/audit'
import { useAuth } from '../hooks/useAuth'
import { formatDateTime } from '../utils/format'
import { PageLoading } from '../components/PageStates'
import { Badge, Card, IconButton } from '../components/ui'

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
  const isPositive =
    action.includes('created') ||
    action.includes('invited') ||
    (action.includes('activated') && !isDestructive)
  const variant = isDestructive ? 'destructive' : isPositive ? 'success' : 'default'
  return <Badge variant={variant}>{ACTION_LABELS[action] ?? action}</Badge>
}

export function AuditPage() {
  const { isAdmin } = useAuth()
  const [page, setPage] = useState(1)

  const { data, isLoading, error } = useQuery({
    queryKey: ['audit', page],
    queryFn: () => getAuditLog(page, PAGE_SIZE),
    placeholderData: (prev) => prev,
    enabled: isAdmin,
  })
  const entries = data?.items ?? []
  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const showSpinner = isLoading && !data

  if (!isAdmin) return <Navigate to="/dashboard" replace />

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-5 h-5 text-gray-400" />
          <h1 className="text-2xl font-semibold text-white">Audit log</h1>
        </div>
        <p className="text-gray-400 mt-1 text-sm">
          {totalCount} event{totalCount !== 1 ? 's' : ''}
        </p>
      </div>

      {error && (
        <div className="mb-4 text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-3">
          Failed to load audit log.
        </div>
      )}

      {showSpinner ? (
        <PageLoading boxed />
      ) : entries.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 gap-3">
          <ClipboardList className="w-8 h-8 text-gray-700" />
          <p className="text-gray-500 text-sm">No audit events yet.</p>
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
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Entity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      When
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {entries.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4 text-sm text-white">{e.userEmail}</td>
                      <td className="px-6 py-4">
                        <ActionBadge action={e.action} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">{e.entityType}</td>
                      <td className="px-6 py-4 text-sm text-gray-300 max-w-xs truncate">
                        {e.details ?? '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">
                        {formatDateTime(e.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile timeline */}
          <Card className="sm:hidden divide-y divide-gray-800 overflow-hidden">
            {entries.map((e) => (
              <div key={e.id} className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <ActionBadge action={e.action} />
                  <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                    {formatDateTime(e.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-white truncate">{e.userEmail}</p>
                <p className="text-xs text-gray-500 mt-0.5">{e.entityType}</p>
                {e.details && <p className="text-xs text-gray-300 mt-2 break-words">{e.details}</p>}
              </div>
            ))}
          </Card>
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
