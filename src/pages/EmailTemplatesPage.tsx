import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail, Pencil, Undo2, CheckCircle2, Circle } from 'lucide-react'
import {
  listEmailTemplates, revertEmailTemplate,
  type EmailTemplateSummary,
} from '../api/emailTemplates'
import { useAuth } from '../hooks/useAuth'
import { formatDateTime } from '../utils/format'

const TYPE_LABELS: Record<string, { title: string; description: string }> = {
  CustomerVerification:  { title: 'Customer verification', description: 'Sent after a customer registers on your storefront.' },
  CustomerPasswordReset: { title: 'Password reset',        description: 'Sent when a customer requests a password reset.' },
  OrderPlaced:           { title: 'Order placed',          description: 'Sent when a customer completes checkout (cash-on-delivery).' },
  OrderPaid:             { title: 'Order paid',            description: 'Sent when Stripe confirms payment.' },
  OrderFulfilled:        { title: 'Order fulfilled',       description: 'Sent when you mark an order fulfilled.' },
}

function effectiveEnabled(t: EmailTemplateSummary): boolean {
  return t.customEnabled ?? t.defaultEnabled
}

function isCustom(t: EmailTemplateSummary): boolean {
  return t.customSubject !== null || t.customBodyHtml !== null || t.customEnabled !== null
}

export function EmailTemplatesPage() {
  const { isAdmin } = useAuth()
  const [templates, setTemplates] = useState<EmailTemplateSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reverting, setReverting] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setError(null)
    listEmailTemplates()
      .then(setTemplates)
      .catch(() => setError('Failed to load email templates.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleRevert = async (t: EmailTemplateSummary) => {
    const label = TYPE_LABELS[t.type]?.title ?? t.type
    if (!confirm(`Revert "${label}" to the built-in default? Your customisations will be lost.`)) return
    setReverting(t.type)
    try {
      await revertEmailTemplate(t.type)
      load()
    } catch (err: any) {
      alert(err?.response?.data?.detail ?? 'Failed to revert template.')
    } finally {
      setReverting(null)
    }
  }

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <Link to="/settings" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to settings
        </Link>
        <div className="text-gray-400 text-sm bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
          Email templates are only visible to admins.
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link to="/settings" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to settings
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Email templates</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Customise the emails your storefront sends. Untouched templates use the built-in defaults.
        </p>
      </div>

      {error && (
        <div className="mb-4 text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-3">{error}</div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-500 text-sm">Loading…</div>
        ) : templates.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <Mail className="w-8 h-8 text-gray-700" />
            <p className="text-gray-500 text-sm">No templates found.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-800">
            {templates.map((t) => {
              const meta = TYPE_LABELS[t.type] ?? { title: t.type, description: '' }
              const custom = isCustom(t)
              const enabled = effectiveEnabled(t)
              return (
                <li key={t.type} className="px-5 py-4 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white text-sm font-medium">{meta.title}</p>
                      {custom ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-indigo-500/15 text-indigo-300 border-indigo-500/30">
                          Custom
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-gray-800 text-gray-500 border-gray-700">
                          Default
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-1 text-xs ${enabled ? 'text-emerald-400' : 'text-gray-500'}`}>
                        {enabled ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                        {enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{meta.description}</p>
                    <p className="text-xs text-gray-600 mt-2 truncate">
                      {custom && t.customSubject ? t.customSubject : t.defaultSubject}
                    </p>
                    {custom && t.customUpdatedAt && (
                      <p className="text-xs text-gray-600 mt-1">Updated {formatDateTime(t.customUpdatedAt)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {custom && (
                      <button
                        onClick={() => handleRevert(t)}
                        disabled={reverting === t.type}
                        className="inline-flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-gray-700 text-gray-300 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
                        title="Revert to default"
                      >
                        <Undo2 className="w-3.5 h-3.5" /> Revert
                      </button>
                    )}
                    <Link
                      to={`/settings/emails/${t.type}`}
                      className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
