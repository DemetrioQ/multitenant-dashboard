import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail, Pencil, Undo2, CheckCircle2, Circle } from 'lucide-react'
import {
  listEmailTemplates,
  revertEmailTemplate,
  type EmailTemplateSummary,
} from '../api/emailTemplates'
import { useAuth } from '../hooks/useAuth'
import { formatDateTime } from '../utils/format'
import { PageLoading } from '../components/PageStates'
import { Badge, Button, Card, useConfirm, useToast } from '../components/ui'

const TYPE_LABELS: Record<string, { title: string; description: string }> = {
  CustomerVerification: {
    title: 'Customer verification',
    description: 'Sent after a customer registers on your storefront.',
  },
  CustomerPasswordReset: {
    title: 'Password reset',
    description: 'Sent when a customer requests a password reset.',
  },
  OrderPlaced: {
    title: 'Order placed',
    description: 'Sent when a customer completes checkout (cash-on-delivery).',
  },
  OrderPaid: { title: 'Order paid', description: 'Sent when Stripe confirms payment.' },
  OrderFulfilled: {
    title: 'Order fulfilled',
    description: 'Sent when you mark an order fulfilled.',
  },
}

function effectiveEnabled(t: EmailTemplateSummary): boolean {
  return t.customEnabled ?? t.defaultEnabled
}

function isCustom(t: EmailTemplateSummary): boolean {
  return t.customSubject !== null || t.customBodyHtml !== null || t.customEnabled !== null
}

export function EmailTemplatesPage() {
  const { isAdmin } = useAuth()
  const qc = useQueryClient()
  const { confirm, dialog } = useConfirm()
  const { toast } = useToast()
  const {
    data: templates = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['emailTemplates'],
    queryFn: listEmailTemplates,
    enabled: isAdmin,
  })
  const showSpinner = isLoading && templates.length === 0
  const [reverting, setReverting] = useState<string | null>(null)

  const handleRevert = async (t: EmailTemplateSummary) => {
    const label = TYPE_LABELS[t.type]?.title ?? t.type
    const ok = await confirm({
      title: 'Revert to default?',
      message: `Your customisations to "${label}" will be lost.`,
      destructive: true,
      confirmLabel: 'Revert',
    })
    if (!ok) return
    setReverting(t.type)
    try {
      await revertEmailTemplate(t.type)
      qc.invalidateQueries({ queryKey: ['emailTemplates'] })
      qc.invalidateQueries({ queryKey: ['emailTemplate', t.type] })
    } catch (err: any) {
      toast(err?.response?.data?.detail ?? 'Failed to revert template.', 'error')
    } finally {
      setReverting(null)
    }
  }

  if (!isAdmin) {
    return (
      <div className="p-4 sm:p-8 max-w-4xl mx-auto">
        <Link
          to="/settings"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to settings
        </Link>
        <div className="text-gray-400 text-sm bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
          Email templates are only visible to admins.
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      {dialog}
      <Link
        to="/settings"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to settings
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Email templates</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Customise the emails your storefront sends. Untouched templates use the built-in defaults.
        </p>
      </div>

      {error && (
        <div className="mb-4 text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-3">
          Failed to load email templates.
        </div>
      )}

      <Card className="overflow-hidden">
        {showSpinner ? (
          <PageLoading className="py-16" />
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
                      <Badge variant={custom ? 'info' : 'muted'}>
                        {custom ? 'Custom' : 'Default'}
                      </Badge>
                      <span
                        className={`inline-flex items-center gap-1 text-xs ${enabled ? 'text-emerald-400' : 'text-gray-500'}`}
                      >
                        {enabled ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <Circle className="w-3.5 h-3.5" />
                        )}
                        {enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{meta.description}</p>
                    <p className="text-xs text-gray-600 mt-2 truncate">
                      {custom && t.customSubject ? t.customSubject : t.defaultSubject}
                    </p>
                    {custom && t.customUpdatedAt && (
                      <p className="text-xs text-gray-600 mt-1">
                        Updated {formatDateTime(t.customUpdatedAt)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {custom && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRevert(t)}
                        disabled={reverting === t.type}
                        title="Revert to default"
                      >
                        <Undo2 className="w-3.5 h-3.5" /> Revert
                      </Button>
                    )}
                    <Button asChild size="sm">
                      <Link to={`/settings/emails/${t.type}`}>
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </Link>
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}
