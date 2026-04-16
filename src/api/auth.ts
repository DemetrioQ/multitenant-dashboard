import { apiClient } from './client'

export interface AuthResponse {
  jwtToken: string
  expiresAt: string
}

export interface RegisterResponse {
  userId: string
  jwtToken: string
  expiresAt: string
}

export const login = (slug: string, email: string, password: string) =>
  apiClient.post<AuthResponse>('/api/auth/login', { slug, email, password }).then((r) => r.data)

// tenantId must come from POST /api/tenants first
export const register = (tenantId: string, email: string, password: string) =>
  apiClient
    .post<RegisterResponse>('/api/auth/register', { tenantId, email, password })
    .then((r) => r.data)

export const refreshSession = () =>
  apiClient.post<AuthResponse>('/api/auth/refresh', null).then((r) => r.data)

export const logout = () =>
  apiClient.post('/api/auth/logout')
