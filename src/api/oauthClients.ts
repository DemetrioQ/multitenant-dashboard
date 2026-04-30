import { apiClient } from './client'

export const OAUTH_SCOPES = [
  { value: 'products:read', label: 'Read products' },
  { value: 'products:write', label: 'Write products' },
  { value: 'orders:read', label: 'Read orders' },
  { value: 'orders:write', label: 'Write orders (fulfill, cancel)' },
  { value: 'customers:read', label: 'Read customers' },
  { value: 'dashboard:read', label: 'Read dashboard' },
] as const

export type OAuthScope = (typeof OAUTH_SCOPES)[number]['value']

export interface OAuthClient {
  id: string
  clientId: string
  name: string
  scopes: OAuthScope[]
  isRevoked: boolean
  createdAt: string
  lastUsedAt: string | null
}

export interface CreatedOAuthClient {
  clientId: string
  clientSecret: string
  name: string
  scopes: OAuthScope[]
}

export const getOAuthClients = () =>
  apiClient.get<OAuthClient[]>('/api/v1/oauth/clients').then((r) => r.data)

export const createOAuthClient = (name: string, scopes: OAuthScope[]) =>
  apiClient.post<CreatedOAuthClient>('/api/v1/oauth/clients', { name, scopes }).then((r) => r.data)

export const revokeOAuthClient = (id: string) =>
  apiClient.post(`/api/v1/oauth/clients/${id}/revoke`)
