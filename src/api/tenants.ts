import { apiClient } from './client'

export interface Tenant {
  id: string
  name: string
  slug: string
  isActive: boolean
  createdAt: string
}

export const getTenants = () =>
  apiClient.get<Tenant[]>('/api/tenants').then((r) => r.data)

export const getTenantMe = () =>
  apiClient.get<Tenant>('/api/tenants/me').then((r) => r.data)

export const getTenant = (id: string) =>
  apiClient.get<Tenant>(`/api/tenants/${id}`).then((r) => r.data)

export interface CreateTenantResponse {
  tenantId: string
}

export const createTenant = (name: string, slug: string) =>
  apiClient.post<CreateTenantResponse>('/api/tenants', { name, slug }).then((r) => r.data)

export const updateTenant = (id: string, name: string) =>
  apiClient.put(`/api/tenants/${id}`, { name })

export const deactivateTenant = (id: string) =>
  apiClient.delete(`/api/tenants/${id}`)
