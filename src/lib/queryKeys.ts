export const qk = {
  tenantMe: ['tenant', 'me'] as const,
  userMe: ['user', 'me'] as const,
  dashboard: ['dashboard'] as const,
  adminStats: ['admin', 'stats'] as const,
  tenants: ['tenants'] as const,
  users: ['users'] as const,
  products: (page?: number) => (page === undefined ? ['products'] as const : ['products', page] as const),
}
