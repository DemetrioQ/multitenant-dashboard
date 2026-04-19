import { apiClient } from './client'

export type ConnectStatus = 'pending' | 'complete' | 'rejected'

export interface PaymentsConnectStatus {
  connected: boolean
  provider: string | null
  status: ConnectStatus | null
  chargesEnabled: boolean
  detailsSubmitted: boolean
  canAcceptPayments: boolean
}

export interface OnboardingLink {
  onboardingUrl: string
  expiresAt: string
}

export const getConnectStatus = () =>
  apiClient.get<PaymentsConnectStatus>('/api/v1/payments/connect/status').then((r) => r.data)

export const startConnectOnboarding = (refreshUrl: string, returnUrl: string) =>
  apiClient.post<OnboardingLink>('/api/v1/payments/connect/onboarding', { refreshUrl, returnUrl }).then((r) => r.data)

export const refreshConnectStatus = () =>
  apiClient.post<PaymentsConnectStatus>('/api/v1/payments/connect/refresh-status').then((r) => r.data)
