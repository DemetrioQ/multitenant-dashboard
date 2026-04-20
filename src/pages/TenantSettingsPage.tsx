import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Globe, Mail, Pencil, CreditCard, MailOpen, ChevronRight } from 'lucide-react'
import { getTenantMe, updateTenant } from '../api/tenants'
import { qk } from '../lib/queryKeys'
import { useAuth } from '../hooks/useAuth'
import { Modal } from '../components/Modal'

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
  supportEmail: string
  websiteUrl: string
}
type EditErrors = Partial<Record<keyof EditForm, string>>

function validateEdit(f: EditForm): EditErrors {
  const errors: EditErrors = {}
  if (!f.name.trim()) errors.name = 'Name is required.'
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
  const qc = useQueryClient()
  const { data: tenant, isLoading, error } = useQuery({
    queryKey: qk.tenantMe,
    queryFn: getTenantMe,
  })
  const showSpinner = isLoading && !tenant

  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<EditForm>({ name: '', supportEmail: '', websiteUrl: '' })
  const [editErrors, setEditErrors] = useState<EditErrors>({})
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const openEdit = () => {
    if (!tenant) return
    setEditForm({
      name: tenant.name,
      supportEmail: tenant.supportEmail ?? '',
      websiteUrl: tenant.websiteUrl ?? '',
    })
    setEditErrors({})
    setEditError(null)
    setEditing(true)
  }

  const setField = (key: keyof EditForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm((prev) => ({ ...prev, [key]: e.target.value }))
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
        supportEmail: editForm.supportEmail.trim() || null,
        websiteUrl: editForm.websiteUrl.trim() || null,
      })
      setEditing(false)
      qc.invalidateQueries({ queryKey: qk.tenantMe })
    } catch (err: any) {
      const apiErrors: Record<string, string[]> | undefined = err.response?.data?.errors
      if (apiErrors) {
        const keyMap: Record<string, keyof EditForm> = {
          Name: 'name',
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
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
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
        <div className="mb-4 text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-3">Failed to load tenant details.</div>
      )}

      {showSpinner ? (
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

      {isAdmin && tenant && (
        <div className="mt-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">Admin settings</p>
          <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800 overflow-hidden">
            <Link
              to="/settings/payments"
              className="flex items-center gap-4 px-6 py-4 hover:bg-gray-800/40 transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">Payments</p>
                <p className="text-xs text-gray-500">Connect a Stripe account to accept card payments on your storefront.</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 flex-shrink-0" />
            </Link>
            <Link
              to="/settings/emails"
              className="flex items-center gap-4 px-6 py-4 hover:bg-gray-800/40 transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <MailOpen className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">Email templates</p>
                <p className="text-xs text-gray-500">Customise the emails your storefront sends to customers.</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 flex-shrink-0" />
            </Link>
          </div>
        </div>
      )}

      {editing && (
        <Modal title="Edit tenant" onClose={() => setEditing(false)}>
          <form onSubmit={handleEdit} noValidate className="space-y-4">
            {([
              { key: 'name' as const, label: 'Name', type: 'text', placeholder: '' },
              { key: 'supportEmail' as const, label: 'Support email', type: 'email', placeholder: 'support@example.com', optional: true },
              { key: 'websiteUrl' as const, label: 'Website URL', type: 'url', placeholder: 'https://example.com', optional: true },
            ]).map(({ key, label, type, placeholder, optional }) => (
              <div key={key} className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-300">
                  {label}{optional && <span className="text-gray-500 font-normal"> (optional)</span>}
                </label>
                <input
                  type={type}
                  value={editForm[key]}
                  onChange={setField(key)}
                  placeholder={placeholder}
                  className={inputClass(editErrors[key])}
                />
                <FieldError msg={editErrors[key]} />
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
