import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Undo2, Eye, Loader2 } from 'lucide-react'
import {
  getEmailTemplate, saveEmailTemplate, revertEmailTemplate, previewEmailTemplate,
  type EmailTemplateDetail, type EmailTemplatePreview, type EmailTemplateType,
} from '../api/emailTemplates'
import { useAuth } from '../hooks/useAuth'

const VALID_TYPES: EmailTemplateType[] = [
  'CustomerVerification',
  'CustomerPasswordReset',
  'OrderPlaced',
  'OrderPaid',
  'OrderFulfilled',
]

const TYPE_LABELS: Record<EmailTemplateType, string> = {
  CustomerVerification:  'Customer verification',
  CustomerPasswordReset: 'Password reset',
  OrderPlaced:           'Order placed',
  OrderPaid:             'Order paid',
  OrderFulfilled:        'Order fulfilled',
}

const SUBJECT_MAX = 200
const BODY_MAX = 20_000

export function EmailTemplateEditorPage() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const { type } = useParams<{ type: string }>()

  const isValidType = (t: string | undefined): t is EmailTemplateType =>
    !!t && (VALID_TYPES as string[]).includes(t)

  const [detail, setDetail] = useState<EmailTemplateDetail | null>(null)
  const [subject, setSubject] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [enabled, setEnabled] = useState(true)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [reverting, setReverting] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedFlash, setSavedFlash] = useState(false)

  const [preview, setPreview] = useState<EmailTemplatePreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const subjectRef = useRef<HTMLInputElement>(null)
  const lastFocusedField = useRef<'subject' | 'body'>('body')

  useEffect(() => {
    if (!isValidType(type)) {
      setLoadError('Unknown template type.')
      setLoading(false)
      return
    }
    setLoading(true)
    setLoadError(null)
    getEmailTemplate(type)
      .then((d) => {
        setDetail(d)
        setSubject(d.subject)
        setBodyHtml(d.bodyHtml)
        setEnabled(d.enabled)
      })
      .catch(() => setLoadError('Failed to load template.'))
      .finally(() => setLoading(false))
  }, [type])

  // Debounced live preview
  useEffect(() => {
    if (!detail || !isValidType(type)) return
    const handle = setTimeout(async () => {
      setPreviewLoading(true)
      setPreviewError(null)
      try {
        const res = await previewEmailTemplate(type, { subject, bodyHtml, enabled })
        setPreview(res)
      } catch {
        setPreviewError('Failed to render preview.')
      } finally {
        setPreviewLoading(false)
      }
    }, 400)
    return () => clearTimeout(handle)
  }, [subject, bodyHtml, enabled, detail, type])

  const insertPlaceholder = (name: string) => {
    const token = `{{ ${name} }}`
    if (lastFocusedField.current === 'subject' && subjectRef.current) {
      const el = subjectRef.current
      const start = el.selectionStart ?? subject.length
      const end = el.selectionEnd ?? subject.length
      const next = subject.slice(0, start) + token + subject.slice(end)
      if (next.length <= SUBJECT_MAX) {
        setSubject(next)
        requestAnimationFrame(() => {
          el.focus()
          const pos = start + token.length
          el.setSelectionRange(pos, pos)
        })
      }
      return
    }
    const el = bodyRef.current
    if (!el) return
    const start = el.selectionStart ?? bodyHtml.length
    const end = el.selectionEnd ?? bodyHtml.length
    const next = bodyHtml.slice(0, start) + token + bodyHtml.slice(end)
    if (next.length <= BODY_MAX) {
      setBodyHtml(next)
      requestAnimationFrame(() => {
        el.focus()
        const pos = start + token.length
        el.setSelectionRange(pos, pos)
      })
    }
  }

  const handleSave = async () => {
    if (!isValidType(type)) return
    if (!subject.trim()) { setSaveError('Subject is required.'); return }
    if (!bodyHtml.trim()) { setSaveError('Body is required.'); return }
    setSaving(true)
    setSaveError(null)
    setSavedFlash(false)
    try {
      const updated = await saveEmailTemplate(type, { subject, bodyHtml, enabled })
      setDetail(updated)
      setSavedFlash(true)
      setTimeout(() => setSavedFlash(false), 2500)
    } catch (err: any) {
      setSaveError(err?.response?.data?.detail ?? 'Failed to save template.')
    } finally {
      setSaving(false)
    }
  }

  const handleRevert = async () => {
    if (!isValidType(type) || !detail) return
    if (!confirm('Revert to the built-in default? Your customisations will be lost.')) return
    setReverting(true)
    setSaveError(null)
    try {
      await revertEmailTemplate(type)
      navigate('/settings/emails')
    } catch (err: any) {
      setSaveError(err?.response?.data?.detail ?? 'Failed to revert template.')
      setReverting(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <Link to="/settings/emails" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to templates
        </Link>
        <div className="text-gray-400 text-sm bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
          Email templates are only visible to admins.
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <p className="text-gray-500 text-sm">Loading…</p>
      </div>
    )
  }

  if (loadError || !detail || !isValidType(type)) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <Link to="/settings/emails" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to templates
        </Link>
        <div className="text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-3">
          {loadError ?? 'Template not found.'}
        </div>
      </div>
    )
  }

  const dirty = subject !== detail.subject || bodyHtml !== detail.bodyHtml || enabled !== detail.enabled

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Link to="/settings/emails" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to templates
      </Link>

      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold text-white">{TYPE_LABELS[type]}</h1>
            {detail.isCustom ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-indigo-500/15 text-indigo-300 border-indigo-500/30">
                Custom
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-gray-800 text-gray-500 border-gray-700">
                Default
              </span>
            )}
          </div>
          <p className="text-gray-400 mt-1 text-sm">Use <code className="px-1 py-0.5 rounded bg-gray-800 text-indigo-300 text-xs">&#123;&#123; placeholder &#125;&#125;</code> tokens — they'll be replaced when the email is sent.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {detail.isCustom && (
            <button
              onClick={handleRevert}
              disabled={reverting || saving}
              className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-gray-700 text-gray-300 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Undo2 className="w-4 h-4" /> {reverting ? 'Reverting…' : 'Revert to default'}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || reverting || !dirty}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {savedFlash && (
        <div className="mb-4 text-emerald-400 text-sm bg-emerald-950/40 border border-emerald-900/50 rounded-lg px-4 py-3">
          Saved.
        </div>
      )}
      {saveError && (
        <div className="mb-4 text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-3">{saveError}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Placeholders</p>
            <p className="text-xs text-gray-500 mb-3">Click to insert at cursor.</p>
            <div className="flex flex-wrap gap-1.5">
              {detail.placeholders.map((p) => (
                <button
                  key={p}
                  onClick={() => insertPlaceholder(p)}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-mono bg-gray-800 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-gray-700 hover:border-indigo-500 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-gray-900"
              />
              <span className="text-sm text-gray-300">Send this email</span>
            </label>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-300">Subject</label>
                <span className="text-xs text-gray-500">{subject.length}/{SUBJECT_MAX}</span>
              </div>
              <input
                ref={subjectRef}
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                onFocus={() => { lastFocusedField.current = 'subject' }}
                maxLength={SUBJECT_MAX}
                className="block w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-300">Body (HTML)</label>
                <span className="text-xs text-gray-500">{bodyHtml.length.toLocaleString()}/{BODY_MAX.toLocaleString()}</span>
              </div>
              <textarea
                ref={bodyRef}
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
                onFocus={() => { lastFocusedField.current = 'body' }}
                maxLength={BODY_MAX}
                rows={18}
                spellCheck={false}
                className="block w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-xs font-mono placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
              />
            </div>
          </div>
        </div>

        <div className="lg:sticky lg:top-8 lg:self-start space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Eye className="w-4 h-4 text-gray-500" /> Live preview
            </div>
            {previewLoading && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <Loader2 className="w-3 h-3 animate-spin" /> Rendering…
              </span>
            )}
          </div>
          {previewError && (
            <div className="text-red-400 text-xs bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">{previewError}</div>
          )}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-800">
              <p className="text-xs text-gray-500 mb-1">Subject</p>
              <p className="text-sm text-white">{preview?.subject ?? subject}</p>
            </div>
            <div className="bg-white max-h-[600px] overflow-auto">
              <iframe
                title="Email preview"
                sandbox=""
                srcDoc={preview?.bodyHtml ?? bodyHtml}
                className="w-full h-[600px] border-0"
              />
            </div>
            {preview && !preview.enabled && (
              <div className="px-5 py-2 bg-amber-950/30 border-t border-amber-900/40 text-xs text-amber-300">
                This email is disabled — it won't be sent to customers.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
