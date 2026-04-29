import { apiClient } from './client'

export interface OAuthClient {
  id: string
  clientId: string
  name: string
  isRevoked: boolean
  createdAt: string
  lastUsedAt: string | null
}

export interface CreatedOAuthClient {
  clientId: string
  clientSecret: string
  name: string
}

export const getOAuthClients = () =>
  apiClient.get<OAuthClient[]>('/api/v1/oauth/clients').then((r) => r.data)

export const createOAuthClient = (name: string) =>
  apiClient.post<CreatedOAuthClient>('/api/v1/oauth/clients', { name }).then((r) => r.data)

export const revokeOAuthClient = (id: string) =>
  apiClient.post(`/api/v1/oauth/clients/${id}/revoke`)
