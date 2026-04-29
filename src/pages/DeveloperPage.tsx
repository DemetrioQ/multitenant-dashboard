import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Navigate } from 'react-router-dom'
import { Code2, Plus, Trash2, Copy, AlertTriangle, KeyRound } from 'lucide-react'
import {
  createOAuthClient,
  getOAuthClients,
  revokeOAuthClient,
  type CreatedOAuthClient,
  type OAuthClient,
} from '../api/oauthClients'
import { useAuth } from '../hooks/useAuth'
import { formatDateTime } from '../utils/format'
import { Modal } from '../components/Modal'
import { PageLoading } from '../components/PageStates'
import {
  Badge,
  Button,
  Card,
  FieldError,
  IconButton,
  Input,
  Label,
  useConfirm,
  useToast,
} from '../components/ui'

function relativeTime(iso: string | null): string {
  if (!iso) return 'Never'
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  return formatDateTime(iso)
}

export function DeveloperPage() {
  const { isAdmin } = useAuth()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { confirm, dialog } = useConfirm()

  const [createOpen, setCreateOpen] = useState(false)
  const [created, setCreated] = useState<CreatedOAuthClient | null>(null)

  const {
    data: clients = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['oauth-clients'],
    queryFn: getOAuthClients,
    enabled: isAdmin,
  })

  const revokeMutation = useMutation({
    mutationFn: revokeOAuthClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oauth-clients'] })
      toast('Client revoked.', 'success')
    },
    onError: () => toast('Failed to revoke client.', 'error'),
  })

  if (!isAdmin) return <Navigate to="/dashboard" replace />

  const handleRevoke = async (client: OAuthClient) => {
    const ok = await confirm({
      title: `Revoke ${client.name}?`,
      message:
        'Existing access tokens for this client will stop working at next request. This cannot be undone.',
      confirmLabel: 'Revoke',
      destructive: true,
    })
    if (ok) revokeMutation.mutate(client.id)
  }

  const showSpinner = isLoading && clients.length === 0
  const activeCount = clients.filter((c) => !c.isRevoked).length

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Code2 className="w-5 h-5 text-gray-400" />
            <h1 className="text-2xl font-semibold text-white">Developer</h1>
          </div>
          <p className="text-gray-400 mt-1 text-sm max-w-2xl">
            OAuth 2.0 client credentials for server-to-server API access. Use these to authorize
            scripts, integrations, or AI agents (like the saas-api-mcp server) to act on behalf of
            your tenant.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="self-start sm:self-auto">
          <Plus className="w-4 h-4 mr-1.5" /> Create client
        </Button>
      </div>

      {error && (
        <div className="mb-4 text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-3">
          Failed to load OAuth clients.
        </div>
      )}

      {showSpinner ? (
        <PageLoading boxed />
      ) : clients.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 gap-3">
          <KeyRound className="w-8 h-8 text-gray-700" />
          <p className="text-gray-500 text-sm">No OAuth clients yet.</p>
          <Button variant="secondary" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Create your first client
          </Button>
        </Card>
      ) : (
        <>
          <p className="text-gray-400 text-sm mb-3">
            {activeCount} active · {clients.length - activeCount} revoked
          </p>

          {/* Desktop table */}
          <Card className="hidden sm:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-800/40">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Client ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Last used
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {clients.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-4 text-sm text-white">{c.name}</td>
                      <td className="px-4 py-4 text-sm font-mono text-gray-300">{c.clientId}</td>
                      <td className="px-4 py-4">
                        {c.isRevoked ? (
                          <Badge variant="destructive">Revoked</Badge>
                        ) : (
                          <Badge variant="success">Active</Badge>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-400 whitespace-nowrap">
                        {relativeTime(c.lastUsedAt)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-400 whitespace-nowrap">
                        {formatDateTime(c.createdAt)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        {!c.isRevoked && (
                          <IconButton
                            onClick={() => handleRevoke(c)}
                            aria-label={`Revoke ${c.name}`}
                            disabled={revokeMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </IconButton>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile cards */}
          <Card className="sm:hidden divide-y divide-gray-800 overflow-hidden">
            {clients.map((c) => (
              <div key={c.id} className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-medium text-white">{c.name}</p>
                  {c.isRevoked ? (
                    <Badge variant="destructive">Revoked</Badge>
                  ) : (
                    <Badge variant="success">Active</Badge>
                  )}
                </div>
                <p className="text-xs font-mono text-gray-400 break-all mb-2">{c.clientId}</p>
                <p className="text-xs text-gray-500">
                  Last used {relativeTime(c.lastUsedAt)} · Created {formatDateTime(c.createdAt)}
                </p>
                {!c.isRevoked && (
                  <Button
                    variant="secondary"
                    onClick={() => handleRevoke(c)}
                    disabled={revokeMutation.isPending}
                    className="mt-3"
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" /> Revoke
                  </Button>
                )}
              </div>
            ))}
          </Card>
        </>
      )}

      {createOpen && (
        <CreateClientModal
          onClose={() => setCreateOpen(false)}
          onCreated={(result) => {
            setCreateOpen(false)
            setCreated(result)
            queryClient.invalidateQueries({ queryKey: ['oauth-clients'] })
          }}
        />
      )}

      {created && <SecretRevealModal client={created} onClose={() => setCreated(null)} />}

      {dialog}
    </div>
  )
}

function CreateClientModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (result: CreatedOAuthClient) => void
}) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const mutation = useMutation({
    mutationFn: createOAuthClient,
    onSuccess: (result) => onCreated(result),
    onError: () => {
      setError('Failed to create client.')
      toast('Failed to create client.', 'error')
    },
  })

  const trimmed = name.trim()
  const canSubmit = trimmed.length > 0 && trimmed.length <= 100 && !mutation.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    mutation.mutate(trimmed)
  }

  return (
    <Modal title="New OAuth client" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="client-name">Name</Label>
          <Input
            id="client-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. saas-api-mcp"
            maxLength={100}
            autoFocus
          />
          <p className="text-xs text-gray-500 mt-1">
            A label so you can identify this client later. The client ID is generated server-side.
          </p>
          <FieldError message={error} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {mutation.isPending ? 'Creating…' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function SecretRevealModal({
  client,
  onClose,
}: {
  client: CreatedOAuthClient
  onClose: () => void
}) {
  const { toast } = useToast()

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast(`${label} copied.`, 'success')
    } catch {
      toast('Copy failed — your browser may not allow clipboard access.', 'error')
    }
  }

  return (
    <Modal title="Client created" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-200">
            This is the only time the client secret will be shown. Copy it now and store it
            somewhere safe.
          </p>
        </div>

        <CredentialField
          label="Client ID"
          value={client.clientId}
          onCopy={() => copy(client.clientId, 'Client ID')}
        />
        <CredentialField
          label="Client Secret"
          value={client.clientSecret}
          onCopy={() => copy(client.clientSecret, 'Client secret')}
          monospace
        />

        <div className="flex justify-end pt-2">
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </Modal>
  )
}

function CredentialField({
  label,
  value,
  onCopy,
  monospace = false,
}: {
  label: string
  value: string
  onCopy: () => void
  monospace?: boolean
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-2">
        <code
          className={`flex-1 px-3 py-2 rounded-md bg-gray-900 border border-gray-800 text-sm text-gray-200 break-all ${
            monospace ? 'font-mono' : ''
          }`}
        >
          {value}
        </code>
        <IconButton onClick={onCopy} aria-label={`Copy ${label}`}>
          <Copy className="w-4 h-4" />
        </IconButton>
      </div>
    </div>
  )
}
