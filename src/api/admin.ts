import { apiClient } from './client'
import type { User } from './users'
import type { Tenant, TenantWithMetrics } from './tenants'
import type { AuditResult } from './audit'
import type { ProductsResult } from './products'

export interface AdminStats {
  totalTenants: number
  activeTenants: number
  inactiveTenants: number
  newTenantsThisWeek: number
  totalUsers: number
  totalProducts: number
}

export type AdminTenant = TenantWithMetrics

export interface TenantsResult {
  items: TenantWithMetrics[]
  totalCount: number
  page: number
  pageSize: number
}

export type SignupsPeriod = '7d' | '30d' | '90d'
export type SignupsEntity = 'tenants' | 'users' | 'customers'

export interface SignupsPoint {
  date: string
  count: number
}

export interface SignupsResult {
  entity: SignupsEntity
  days: number
  points: SignupsPoint[]
}

export const getAdminSignups = (period: SignupsPeriod = '30d', entity: SignupsEntity = 'tenants') =>
  apiClient
    .get<SignupsResult>('/api/v1/admin/stats/signups', { params: { period, entity } })
    .then((r) => r.data)

export interface UsersResult {
  items: User[]
  totalCount: number
  page: number
  pageSize: number
}

export const getAdminStats = () =>
  apiClient.get<AdminStats>('/api/v1/admin/stats').then((r) => r.data)

export const getAdminTenants = (page = 1, pageSize = 20) =>
  apiClient
    .get<TenantsResult>('/api/v1/tenants', { params: { page, pageSize } })
    .then((r) => r.data)

export const getAdminTenant = (id: string) =>
  apiClient.get<Tenant>(`/api/v1/tenants/${id}`).then((r) => r.data)

export const getAdminTenantUsers = (tenantId: string, page = 1, pageSize = 20) =>
  apiClient
    .get<UsersResult>(`/api/v1/admin/tenants/${tenantId}/users`, { params: { page, pageSize } })
    .then((r) => r.data)

export const setTenantStatus = (tenantId: string, isActive: boolean) =>
  apiClient.put(`/api/v1/admin/tenants/${tenantId}/status`, { isActive })

export const getAdminAudit = (page = 1, pageSize = 20) =>
  apiClient
    .get<AuditResult>('/api/v1/admin/audit', { params: { page, pageSize } })
    .then((r) => r.data)

export const getAdminProducts = (page = 1, pageSize = 20) =>
  apiClient
    .get<ProductsResult>('/api/v1/admin/products', { params: { page, pageSize } })
    .then((r) => r.data)
