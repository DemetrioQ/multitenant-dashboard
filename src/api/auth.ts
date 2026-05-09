import { apiClient } from './client'

export interface AuthResponse {
  jwtToken: string
  expiresAt: string
}

export interface RegisterResponse {
  userId: string
}

export const login = (slug: string, email: string, password: string) =>
  apiClient.post<AuthResponse>('/api/v1/auth/login', { slug, email, password }).then((r) => r.data)

// tenantId must come from POST /api/tenants first
export const register = (
  tenantId: string,
  email: string,
  password: string,
  firstName: string,
  lastName: string,
) =>
  apiClient
    .post<RegisterResponse>('/api/v1/auth/register', {
      tenantId,
      email,
      password,
      firstName,
      lastName,
    })
    .then((r) => r.data)

export const verifyEmail = (token: string) =>
  apiClient.get('/api/v1/auth/verify-email', { params: { token } })

export const refreshSession = () =>
  apiClient.post<AuthResponse>('/api/v1/auth/refresh', null).then((r) => r.data)

export const logout = () => apiClient.post('/api/v1/auth/logout')

export const forgotPassword = (slug: string, email: string) =>
  apiClient.post('/api/v1/auth/forgot-password', { slug, email })

export const resetPassword = (token: string, newPassword: string) =>
  apiClient.post('/api/v1/auth/reset-password', { token, newPassword })

export const resendVerification = (slug: string, email: string) =>
  apiClient.post('/api/v1/auth/resend-verification', { slug, email })

export const changePassword = (currentPassword: string, newPassword: string) =>
  apiClient.post('/api/v1/auth/change-password', { currentPassword, newPassword })

export interface DemoProvisionResponse {
  jwtToken: string
  tenantSlug: string
  tenantName: string
  demoExpiresAt: string
}

export const demoProvision = () =>
  apiClient.post<DemoProvisionResponse>('/api/v1/auth/demo/provision').then((r) => r.data)

export const demoElevate = (role: string) =>
  apiClient.post<{ jwtToken: string }>('/api/v1/auth/demo/elevate', { role }).then((r) => r.data)
