/**
 * Centralised TanStack Query keys.
 *
 * Use these instead of inline string arrays so refactors and invalidation are
 * grep-able. When invalidating "all admin queries" you can use the prefix:
 *   qc.invalidateQueries({ queryKey: qk.admin.all })
 */

import type { OrderStatus } from '../api/orders'

export const qk = {
  // Auth / session-scoped
  tenantMe: ['tenant', 'me'] as const,
  userMe: ['user', 'me'] as const,

  // Dashboard
  dashboard: ['dashboard'] as const,
  onboarding: ['onboarding'] as const,

  // Tenant-scoped lists
  products: (page?: number) =>
    page === undefined ? (['products'] as const) : (['products', page] as const),
  productsAll: ['products'] as const,
  orders: (page: number, status: OrderStatus | '' | undefined) =>
    ['orders', page, status ?? ''] as const,
  ordersAll: ['orders'] as const,
  order: (id: string | undefined) => ['order', id] as const,
  customers: (page: number) => ['customers', page] as const,
  customer: (id: string | undefined) => ['customer', id] as const,
  team: (page: number) => ['team', page] as const,
  teamAll: ['team'] as const,
  users: ['users'] as const,
  audit: (page: number) => ['audit', page] as const,
  emailTemplates: ['emailTemplates'] as const,
  emailTemplate: (type: string | null) => ['emailTemplate', type] as const,
  paymentsStatus: ['payments', 'status'] as const,

  // Super-admin
  admin: {
    all: ['admin'] as const,
    stats: ['admin', 'stats'] as const,
    signups: (period: string, entity: string) => ['admin', 'signups', period, entity] as const,
    tenants: ['admin', 'tenants'] as const,
    tenantsRecent: ['admin', 'tenants', 'recent'] as const,
    tenantsAll: ['admin', 'tenants', 'all'] as const,
    tenant: (id: string | undefined) => ['admin', 'tenant', id] as const,
    tenantUsers: (id: string | undefined, page: number) =>
      ['admin', 'tenant', id, 'users', page] as const,
    auditRecent: ['admin', 'audit', 'recent'] as const,
    audit: (page: number) => ['admin', 'audit', page] as const,
    products: (page: number) => ['admin', 'products', page] as const,
  },
}
