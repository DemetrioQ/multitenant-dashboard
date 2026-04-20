import { apiClient } from './client'

export interface Tenant {
  id: string
  name: string
  slug: string
  isActive: boolean
  createdAt: string
  supportEmail: string | null
  websiteUrl: string | null
  storeUrl: string | null
}

export interface TenantWithMetrics extends Tenant {
  userCount: number
  productCount: number
  lastActivityAt: string | null
}

export const getTenants = () =>
  apiClient.get<TenantWithMetrics[]>('/api/v1/tenants').then((r) => r.data)

export const getTenantMe = () =>
  apiClient.get<Tenant>('/api/v1/tenants/me').then((r) => r.data)

export const getTenant = (id: string) =>
  apiClient.get<Tenant>(`/api/v1/tenants/${id}`).then((r) => r.data)

export interface CreateTenantResponse {
  tenantId: string
}

export const createTenant = (name: string, slug: string) =>
  apiClient.post<CreateTenantResponse>('/api/v1/tenants', { name, slug }).then((r) => r.data)

export const updateTenant = (id: string, data: {
  name: string
  supportEmail: string | null
  websiteUrl: string | null
}) => apiClient.put(`/api/v1/tenants/${id}`, data)

export const deactivateTenant = (id: string) =>
  apiClient.delete(`/api/v1/tenants/${id}`)

export interface RecentActivity {
  action: string
  entityType: string
  details: string | null
  createdAt: string
}

export interface TopProduct {
  productId: string
  name: string
  slug: string
  unitsSold: number
  revenue: number
}

export interface DashboardData {
  userCount: number
  activeUserCount: number
  productCount: number
  activeProductCount: number
  customerCount: number
  pendingOrderCount: number
  paidOrderCount: number
  grossRevenue: number
  platformFees: number
  netRevenue: number
  currentFeePercent: number
  averageOrderValue: number
  topProducts: TopProduct[]
  onboardingComplete: boolean
  recentActivity: RecentActivity[]
}

export const getDashboard = () =>
  apiClient.get<DashboardData>('/api/v1/tenants/dashboard').then((r) => r.data)

export interface OnboardingStatus {
  profileCompleted: boolean
  firstProductCreated: boolean
  isComplete: boolean
}

export const getOnboarding = () =>
  apiClient.get<OnboardingStatus>('/api/v1/tenants/onboarding').then((r) => r.data)
