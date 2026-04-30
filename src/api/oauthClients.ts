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

export type OAuthClientType = 'confidential' | 'public'

export interface OAuthClient {
  id: string
  clientId: string
  name: string
  clientType: OAuthClientType
  scopes: OAuthScope[]
  redirectUris: string[]
  isRevoked: boolean
  createdAt: string
  lastUsedAt: string | null
}

export interface CreatedOAuthClient {
  clientId: string
  /** Null for public clients (PKCE-only). */
  clientSecret: string | null
  name: string
  clientType: OAuthClientType
  scopes: OAuthScope[]
  redirectUris: string[]
}

export interface CreateOAuthClientInput {
  name: string
  scopes: OAuthScope[]
  clientType: OAuthClientType
  redirectUris?: string[]
}

export const getOAuthClients = () =>
  apiClient.get<OAuthClient[]>('/api/v1/oauth/clients').then((r) => r.data)

export const createOAuthClient = (input: CreateOAuthClientInput) =>
  apiClient.post<CreatedOAuthClient>('/api/v1/oauth/clients', input).then((r) => r.data)

export const revokeOAuthClient = (id: string) =>
  apiClient.post(`/api/v1/oauth/clients/${id}/revoke`)

// ── authorization_code flow (consent screen) ────────────────────────────

export interface AuthorizeRequestInfo {
  clientId: string
  clientName: string
  requestedScopes: string[]
  grantableScopes: string[]
  redirectUri: string
}

export interface AuthorizeBody {
  clientId: string
  redirectUri: string
  scope: string
  codeChallenge: string
  codeChallengeMethod: string
  state?: string | null
}

export const getAuthorizeInfo = (clientId: string, redirectUri: string, scope: string) =>
  apiClient
    .get<AuthorizeRequestInfo>('/api/v1/oauth/authorize/info', {
      params: { client_id: clientId, redirect_uri: redirectUri, scope },
    })
    .then((r) => r.data)

export const grantAuthorize = (body: AuthorizeBody) =>
  apiClient.post<{ redirectUrl: string }>('/api/v1/oauth/authorize', body).then((r) => r.data)
