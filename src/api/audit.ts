import { apiClient } from './client'

export interface AuditEntry {
  id: string
  tenantId: string
  userId: string
  userEmail: string
  action: string
  entityType: string
  entityId: string | null
  details: string | null
  createdAt: string
}

export interface AuditResult {
  items: AuditEntry[]
  totalCount: number
  page: number
  pageSize: number
}

export const getAuditLog = (page = 1, pageSize = 20) =>
  apiClient.get<AuditResult>('/api/v1/audit', { params: { page, pageSize } }).then((r) => r.data)
