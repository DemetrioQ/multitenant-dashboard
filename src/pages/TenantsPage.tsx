import { useEffect, useState } from 'react'
import { Plus, Building2, Pencil, Trash2 } from 'lucide-react'
import {
  getTenants, getTenantMe, createTenant, updateTenant, deactivateTenant,
  type Tenant,
} from '../api/tenants'
import { useAuth } from '../hooks/useAuth'
import { Modal } from '../components/Modal'

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

// ─── Super-admin view: full platform tenant list ──────────────────────────────

function AllTenantsView() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showCreate, setShowCreate] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createSlug, setCreateSlug] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [editing, setEditing] = useState<Tenant | null>(null)
  const [editName, setEditName] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    getTenants()
      .then(setTenants)
      .catch(() => setError('Failed to load tenants.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateLoading(true)
    setCreateError(null)
    try {
      await createTenant(createName, createSlug)
      setShowCreate(false)
      setCreateName('')
      setCreateSlug('')
      load()
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
      await updateTenant(editing.id, editName)
      setEditing(null)
      load()
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
      load()
    } catch (err: any) {
      alert(err.response?.data?.detail ?? 'Failed to deactivate tenant.')
    }
  }

  const inputClass = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'

  return (
    <>
      <div className="flex items-center justify-between mb-6">
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
        <div className="mb-4 text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-3">{error}</div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-gray-500 text-sm">Loading…</p>
          </div>
        ) : tenants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Building2 className="w-8 h-8 text-gray-700" />
            <p className="text-gray-500 text-sm">No tenants yet.</p>
          </div>
        ) : (
          <table className="w-full">
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
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <Modal title="New Tenant" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">Name</label>
              <input type="text" required value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="Acme Corp" className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">Slug</label>
              <input type="text" required value={createSlug} onChange={(e) => setCreateSlug(e.target.value)} placeholder="acme-corp" className={inputClass} />
              <p className="text-xs text-gray-500">Lowercase letters, numbers and hyphens only</p>
            </div>
            {createError && <p className="text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">{createError}</p>}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowCreate(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">Cancel</button>
              <button type="submit" disabled={createLoading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
                {createLoading ? 'Creating…' : 'Create'}
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
              <input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)} className={inputClass} />
            </div>
            {editError && <p className="text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">{editError}</p>}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditing(null)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">Cancel</button>
              <button type="submit" disabled={editLoading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
                {editLoading ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

// ─── Regular user view: own tenant only via /me ───────────────────────────────

function MyTenantView() {
  const { isAdmin } = useAuth()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    getTenantMe()
      .then(setTenant)
      .catch(() => setError('Failed to load tenant details.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openEdit = () => {
    if (!tenant) return
    setEditName(tenant.name)
    setEditError(null)
    setEditing(true)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenant) return
    setEditLoading(true)
    setEditError(null)
    try {
      await updateTenant(tenant.id, editName)
      setEditing(false)
      load()
    } catch (err: any) {
      setEditError(err.response?.data?.detail ?? 'Failed to update tenant.')
    } finally {
      setEditLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Tenants</h1>
          <p className="text-gray-400 mt-1 text-sm">Your organisation's details</p>
        </div>
        {isAdmin && tenant && (
          <button
            onClick={openEdit}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors border border-gray-700"
          >
            <Pencil className="w-4 h-4" />
            Edit name
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-3">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-500 text-sm">Loading…</p>
        </div>
      ) : tenant ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
          {[
            { label: 'Name', value: tenant.name },
            { label: 'Slug', value: tenant.slug, mono: true },
            { label: 'Status', value: <Badge active={tenant.isActive} /> },
            { label: 'Created', value: new Date(tenant.createdAt).toLocaleDateString() },
            { label: 'ID', value: tenant.id, mono: true },
          ].map(({ label, value, mono }) => (
            <div key={label} className="flex items-center justify-between px-6 py-4">
              <span className="text-sm text-gray-400 w-24 flex-shrink-0">{label}</span>
              <span className={`text-sm text-white flex-1 text-right ${mono ? 'font-mono text-gray-300' : ''}`}>
                {value}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {editing && (
        <Modal title="Edit Tenant Name" onClose={() => setEditing(false)}>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">Name</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {editError && <p className="text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">{editError}</p>}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditing(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">Cancel</button>
              <button type="submit" disabled={editLoading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
                {editLoading ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

// ─── Page entry point ─────────────────────────────────────────────────────────

export function TenantsPage() {
  const { isSuperAdmin } = useAuth()

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {isSuperAdmin ? <AllTenantsView /> : <MyTenantView />}
    </div>
  )
}
