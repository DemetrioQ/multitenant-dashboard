import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Navigate } from 'react-router-dom'
import { Plus, Building2, Pencil, Trash2, Search, MoonStar } from 'lucide-react'
import {
  getTenants, createTenant, updateTenant, deactivateTenant,
  type Tenant,
} from '../api/tenants'
import { useAuth } from '../hooks/useAuth'
import { Modal } from '../components/Modal'

type SearchField = 'slug' | 'name'
type SortKey = 'recent' | 'oldest' | 'name' | 'slug' | 'activity'
type StatusFilter = 'all' | 'active' | 'inactive' | 'dormant'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'recent',   label: 'Recently added' },
  { value: 'oldest',   label: 'Oldest first' },
  { value: 'activity', label: 'Last activity' },
  { value: 'name',     label: 'Name (A–Z)' },
  { value: 'slug',     label: 'Slug (A–Z)' },
]

const DORMANT_MS = 30 * 24 * 60 * 60 * 1000

function isDormant(lastActivityAt: string | null): boolean {
  if (!lastActivityAt) return true
  return Date.now() - new Date(lastActivityAt).getTime() > DORMANT_MS
}

function activityLabel(lastActivityAt: string | null): string {
  if (!lastActivityAt) return 'Never'
  const diffMs = Date.now() - new Date(lastActivityAt).getTime()
  const sec = Math.floor(diffMs / 1000)
  if (sec < 60) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day}d ago`
  const month = Math.floor(day / 30)
  if (month < 12) return `${month}mo ago`
  return `${Math.floor(month / 12)}y ago`
}

function DormantBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-amber-500/10 text-amber-400 border-amber-500/20">
      <MoonStar className="w-3 h-3" /> Dormant
    </span>
  )
}

function Badge({ active }: { active: boolean }) {
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

function AllTenantsView() {
  const qc = useQueryClient()
  const { data: tenants = [], isLoading, error } = useQuery({
    queryKey: ['tenants'],
    queryFn: getTenants,
  })
  const hasCachedData = !!qc.getQueryData(['tenants'])
  const showSpinner = isLoading && !hasCachedData

  const invalidate = () => qc.invalidateQueries({ queryKey: ['tenants'] })

  const [showCreate, setShowCreate] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createSlug, setCreateSlug] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [editing, setEditing] = useState<Tenant | null>(null)
  const [editName, setEditName] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [searchField, setSearchField] = useState<SearchField>('slug')
  const [sortKey, setSortKey] = useState<SortKey>('recent')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const visibleTenants = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = tenants.filter((t) => {
      if (statusFilter === 'active' && !t.isActive) return false
      if (statusFilter === 'inactive' && t.isActive) return false
      if (statusFilter === 'dormant' && !isDormant(t.lastActivityAt)) return false
      if (!q) return true
      const haystack = searchField === 'name' ? t.name : t.slug
      return haystack.toLowerCase().includes(q)
    })
    const sorted = [...filtered]
    sorted.sort((a, b) => {
      switch (sortKey) {
        case 'recent':   return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'oldest':   return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'name':     return a.name.localeCompare(b.name)
        case 'slug':     return a.slug.localeCompare(b.slug)
        case 'activity': {
          const av = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0
          const bv = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0
          return bv - av
        }
      }
    })
    return sorted
  }, [tenants, search, searchField, sortKey, statusFilter])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateLoading(true)
    setCreateError(null)
    try {
      await createTenant(createName, createSlug)
      setShowCreate(false)
      setCreateName('')
      setCreateSlug('')
      invalidate()
    } catch (err: any) {
      setCreateError(err.response?.data?.detail ?? 'Failed to create tenant.')
    } finally {
      setCreateLoading(false)
    }
  }

  const openEdit = (tenant: Tenant) => {
    setEditing(tenant)
    setEditName(tenant.name)
    setEditError(null)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    setEditLoading(true)
    setEditError(null)
    try {
      await updateTenant(editing.id, {
        name: editName,
        supportEmail: editing.supportEmail,
        websiteUrl: editing.websiteUrl,
      })
      setEditing(null)
      invalidate()
    } catch (err: any) {
      setEditError(err.response?.data?.detail ?? 'Failed to update tenant.')
    } finally {
      setEditLoading(false)
    }
  }

  const handleDeactivate = async (tenant: Tenant) => {
    if (!confirm(`Deactivate "${tenant.name}"?`)) return
    try {
      await deactivateTenant(tenant.id)
      invalidate()
    } catch (err: any) {
      alert(err.response?.data?.detail ?? 'Failed to deactivate tenant.')
    }
  }

  const fieldClass = 'block w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Tenants</h1>
          <p className="text-gray-400 mt-1 text-sm">All registered tenants on this platform</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Tenant
        </button>
      </div>

      {error && (
        <div className="mb-4 text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-3">Failed to load tenants.</div>
      )}

      {tenants.length > 0 && (
        <div className="mb-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchField === 'slug' ? 'Search by slug…' : 'Search by name…'}
              className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-3 sm:flex-shrink-0">
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value as SearchField)}
              className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="slug">Slug</option>
              <option value="name">Name</option>
            </select>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="dormant">Dormant</option>
            </select>
          </div>
        </div>
      )}

      {showSpinner ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center py-20">
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      ) : tenants.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl flex flex-col items-center justify-center py-20 gap-3">
          <Building2 className="w-8 h-8 text-gray-700" />
          <p className="text-gray-500 text-sm">No tenants yet.</p>
        </div>
      ) : visibleTenants.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl flex flex-col items-center justify-center py-20 gap-3">
          <Search className="w-8 h-8 text-gray-700" />
          <p className="text-gray-500 text-sm">No tenants match your filters.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full min-w-[820px]">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-800/40">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Slug</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Users</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Products</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Last activity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {visibleTenants.map((t) => {
                  const dormant = isDormant(t.lastActivityAt)
                  return (
                    <tr key={t.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono text-white">{t.slug}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{t.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-300 font-mono text-right">{t.userCount}</td>
                      <td className="px-6 py-4 text-sm text-gray-300 font-mono text-right">{t.productCount}</td>
                      <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">{activityLabel(t.lastActivityAt)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge active={t.isActive} />
                          {t.isActive && dormant && <DormantBadge />}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(t)}
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {t.isActive && (
                            <button onClick={() => handleDeactivate(t)}
                              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {visibleTenants.map((t) => {
              const dormant = isDormant(t.lastActivityAt)
              return (
                <div key={t.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-mono text-white truncate">{t.slug}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{t.name}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <Badge active={t.isActive} />
                      {t.isActive && dormant && <DormantBadge />}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs">
                    <div>
                      <p className="text-gray-500">Users</p>
                      <p className="text-gray-200 font-mono mt-0.5">{t.userCount}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Products</p>
                      <p className="text-gray-200 font-mono mt-0.5">{t.productCount}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-gray-500">Activity</p>
                      <p className="text-gray-300 mt-0.5">{activityLabel(t.lastActivityAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
                    <span className="text-xs text-gray-500">Created {new Date(t.createdAt).toLocaleDateString()}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(t)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      {t.isActive && (
                        <button onClick={() => handleDeactivate(t)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {showCreate && (
        <Modal title="New Tenant" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">Name</label>
              <input type="text" required value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="Acme Corp" className={fieldClass} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">Slug</label>
              <input type="text" required value={createSlug} onChange={(e) => setCreateSlug(e.target.value)} placeholder="acme-corp" className={fieldClass} />
              <p className="text-xs text-gray-500">Lowercase letters, numbers and hyphens only</p>
            </div>
            {createError && <p className="text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">{createError}</p>}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowCreate(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">Cancel</button>
              <button type="submit" disabled={createLoading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
                {createLoading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {editing && (
        <Modal title="Edit Tenant" onClose={() => setEditing(null)}>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">Name</label>
              <input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)} className={fieldClass} />
            </div>
            {editError && <p className="text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">{editError}</p>}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditing(null)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">Cancel</button>
              <button type="submit" disabled={editLoading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
                {editLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

export function TenantsPage() {
  const { isSuperAdmin } = useAuth()

  if (!isSuperAdmin) return <Navigate to="/settings" replace />

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <AllTenantsView />
    </div>
  )
}
