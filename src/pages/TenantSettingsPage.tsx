import { useEffect, useState } from 'react'
import { Globe, Mail, Pencil } from 'lucide-react'
import { getTenantMe, updateTenant, type Tenant } from '../api/tenants'
import { useAuth } from '../hooks/useAuth'
import { Modal } from '../components/Modal'

const CURRENCY_RE = /^[A-Z]{3}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function inputClass(error?: string) {
  return `block w-full bg-gray-800 border rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent ${
    error ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:ring-indigo-500'
  }`
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="text-red-400 text-xs mt-1">{msg}</p>
}

function Badge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
      active ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-800 text-gray-500 border-gray-700'
    }`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

interface EditForm {
  name: string
  timezone: string
  currency: string
  supportEmail: string
  websiteUrl: string
}
type EditErrors = Partial<Record<keyof EditForm, string>>

function validateEdit(f: EditForm): EditErrors {
  const errors: EditErrors = {}
  if (!f.name.trim()) errors.name = 'Name is required.'
  if (!f.timezone.trim()) errors.timezone = 'Timezone is required.'
  if (!f.currency.trim()) {
    errors.currency = 'Currency is required.'
  } else if (!CURRENCY_RE.test(f.currency)) {
    errors.currency = 'Must be 3 uppercase letters (e.g. USD).'
  }
  if (f.supportEmail && !EMAIL_RE.test(f.supportEmail)) {
    errors.supportEmail = 'Must be a valid email address.'
  }
  if (f.websiteUrl) {
    try {
      const u = new URL(f.websiteUrl)
      if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error()
    } catch {
      errors.websiteUrl = 'Must be a valid URL (e.g. https://example.com).'
    }
  }
  return errors
}

export function TenantSettingsPage() {
  const { isAdmin } = useAuth()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<EditForm>({ name: '', timezone: '', currency: '', supportEmail: '', websiteUrl: '' })
  const [editErrors, setEditErrors] = useState<EditErrors>({})
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
    setEditForm({
      name: tenant.name,
      timezone: tenant.timezone,
      currency: tenant.currency,
      supportEmail: tenant.supportEmail ?? '',
      websiteUrl: tenant.websiteUrl ?? '',
    })
    setEditErrors({})
    setEditError(null)
    setEditing(true)
  }

  const setField = (key: keyof EditForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = key === 'currency' ? e.target.value.toUpperCase() : e.target.value
    setEditForm((prev) => ({ ...prev, [key]: value }))
    if (editErrors[key]) setEditErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenant) return
    const errors = validateEdit(editForm)
    if (Object.keys(errors).length > 0) { setEditErrors(errors); return }
    setEditLoading(true)
    setEditError(null)
    try {
      await updateTenant(tenant.id, {
        name: editForm.name.trim(),
        timezone: editForm.timezone.trim(),
        currency: editForm.currency.trim(),
        supportEmail: editForm.supportEmail.trim() || null,
        websiteUrl: editForm.websiteUrl.trim() || null,
      })
      setEditing(false)
      load()
    } catch (err: any) {
      const apiErrors: Record<string, string[]> | undefined = err.response?.data?.errors
      if (apiErrors) {
        const keyMap: Record<string, keyof EditForm> = {
          Name: 'name', Timezone: 'timezone', Currency: 'currency',
          SupportEmail: 'supportEmail', WebsiteUrl: 'websiteUrl',
        }
        const mapped: EditErrors = {}
        for (const [k, msgs] of Object.entries(apiErrors)) {
          const local = keyMap[k]
          if (local) mapped[local] = (msgs as string[])[0]
        }
        if (Object.keys(mapped).length > 0) { setEditErrors(mapped); return }
      }
      setEditError(err.response?.data?.detail ?? 'Failed to save changes.')
    } finally {
      setEditLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Settings</h1>
          <p className="text-gray-400 mt-1 text-sm">Your organisation's details</p>
        </div>
        {isAdmin && tenant && (
          <button
            onClick={openEdit}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors border border-gray-700"
          >
            <Pencil className="w-4 h-4" /> Edit
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-3">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      ) : tenant ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
          {([
            { label: 'Name',    value: tenant.name },
            { label: 'Slug',    value: tenant.slug, mono: true },
            { label: 'Status',  value: <Badge active={tenant.isActive} /> },
            { label: 'Created', value: new Date(tenant.createdAt).toLocaleDateString() },
            { label: 'ID',      value: tenant.id, mono: true },
            { label: 'Timezone', value: tenant.timezone },
            { label: 'Currency', value: tenant.currency },
            ...(tenant.supportEmail ? [{
              label: 'Support email',
              value: (
                <a href={`mailto:${tenant.supportEmail}`} className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 justify-end">
                  <Mail className="w-3.5 h-3.5" />{tenant.supportEmail}
                </a>
              ),
            }] : []),
            ...(tenant.websiteUrl ? [{
              label: 'Website',
              value: (
                <a href={tenant.websiteUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 justify-end">
                  <Globe className="w-3.5 h-3.5" />{tenant.websiteUrl}
                </a>
              ),
            }] : []),
          ] as { label: string; value: React.ReactNode; mono?: boolean }[]).map(({ label, value, mono }) => (
            <div key={label} className="flex items-center justify-between px-6 py-4">
              <span className="text-sm text-gray-400 w-32 flex-shrink-0">{label}</span>
              <span className={`text-sm text-white flex-1 text-right ${mono ? 'font-mono text-gray-300' : ''}`}>{value}</span>
            </div>
          ))}
        </div>
      ) : null}

      {editing && (
        <Modal title="Edit tenant" onClose={() => setEditing(false)}>
          <form onSubmit={handleEdit} noValidate className="space-y-4">
            {([
              { key: 'name' as const, label: 'Name', type: 'text', placeholder: '' },
              { key: 'timezone' as const, label: 'Timezone', type: 'text', placeholder: 'UTC' },
              { key: 'currency' as const, label: 'Currency', type: 'text', placeholder: 'USD', maxLength: 3, hint: 'ISO 4217 — 3 uppercase letters.' },
              { key: 'supportEmail' as const, label: 'Support email', type: 'email', placeholder: 'support@example.com', optional: true },
              { key: 'websiteUrl' as const, label: 'Website URL', type: 'url', placeholder: 'https://example.com', optional: true },
            ]).map(({ key, label, type, placeholder, maxLength, hint, optional }) => (
              <div key={key} className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-300">
                  {label}{optional && <span className="text-gray-500 font-normal"> (optional)</span>}
                </label>
                <input
                  type={type}
                  value={editForm[key]}
                  onChange={setField(key)}
                  placeholder={placeholder}
                  maxLength={maxLength}
                  className={inputClass(editErrors[key])}
                />
                <FieldError msg={editErrors[key]} />
                {hint && <p className="text-xs text-gray-500">{hint}</p>}
              </div>
            ))}
            {editError && (
              <p className="text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">{editError}</p>
            )}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditing(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">Cancel</button>
              <button type="submit" disabled={editLoading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
                {editLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
