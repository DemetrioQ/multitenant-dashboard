import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Package,
  Users,
  Building2,
  ShieldCheck,
  Activity,
  ShoppingCart,
  UserCheck,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Info,
} from 'lucide-react'
import type { DashboardData } from '../api/tenants'
import { getDashboard, type RecentActivity, type TopProduct } from '../api/tenants'
import { getAdminStats, getAdminTenants, getAdminAudit } from '../api/admin'
import { useAuth } from '../hooks/useAuth'
import { OnboardingChecklist } from '../components/OnboardingChecklist'
import { formatMoney, formatDate } from '../utils/format'
import { Badge, Card } from '../components/ui'

// ─── Super-admin dashboard ────────────────────────────────────────────────────

function SuperAdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: getAdminStats,
  })
  const { data: tenantsData } = useQuery({
    queryKey: ['admin', 'tenants', 'recent'],
    queryFn: () => getAdminTenants(1, 5),
  })
  const { data: auditData } = useQuery({
    queryKey: ['admin', 'audit', 'recent'],
    queryFn: () => getAdminAudit(1, 10),
  })
  const showSkeleton = isLoading && !stats
  const recentTenants = tenantsData?.items ?? []
  const recentAudit = auditData?.items ?? []

  const cards = stats
    ? [
        {
          label: 'Total tenants',
          value: stats.totalTenants,
          icon: Building2,
          color: 'text-amber-400',
          bg: 'bg-amber-500/10',
        },
        {
          label: 'Total users',
          value: stats.totalUsers,
          icon: Users,
          color: 'text-brand',
          bg: 'bg-brand/10',
        },
        {
          label: 'Total products',
          value: stats.totalProducts,
          icon: Package,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10',
        },
      ]
    : []

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <p className="text-amber-400/80 mt-1 text-sm flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5" /> Platform overview
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {showSkeleton
          ? [1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <div className="h-4 bg-gray-800 rounded w-24 mb-4" />
                <div className="h-8 bg-gray-800 rounded w-16" />
              </Card>
            ))
          : cards.map(({ label, value, icon: Icon, color, bg }) => (
              <Card key={label} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-400">{label}</span>
                  <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-white">{value}</p>
              </Card>
            ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent platform activity */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-medium text-white">Recent platform activity</h2>
            </div>
            <Link
              to="/admin/audit"
              className="text-xs text-brand hover:text-brand-hover flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentAudit.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">No activity yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentAudit.map((e) => (
                <li
                  key={e.id}
                  className="flex items-start justify-between gap-4 pb-3 border-b border-gray-800 last:border-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white">{ACTION_LABELS[e.action] ?? e.action}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{e.userEmail}</p>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                    {formatDate(e.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Recent tenants */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-medium text-white">Recent tenants</h2>
            </div>
            <Link
              to="/admin"
              className="text-xs text-brand hover:text-brand-hover flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentTenants.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">No tenants yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentTenants.map((t) => (
                <li key={t.id}>
                  <Link
                    to={`/admin/tenants/${t.id}`}
                    className="flex items-center justify-between gap-4 pb-3 border-b border-gray-800 last:border-0 last:pb-0 hover:bg-gray-800/30 -mx-2 px-2 rounded-lg transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white truncate">{t.name}</p>
                      <p className="text-xs text-gray-500 font-mono mt-0.5 truncate">{t.slug}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant={t.isActive ? 'success' : 'muted'}>
                        {t.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(t.createdAt)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}

// ─── Activity feed ────────────────────────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
  'product.created': 'Product created',
  'product.updated': 'Product updated',
  'product.activated': 'Product activated',
  'product.deactivated': 'Product deactivated',
  'product.low_stock': 'Low stock alert',
  'tenant.updated': 'Tenant updated',
  'tenant.deactivated': 'Tenant deactivated',
  'user.role_updated': 'Role changed',
  'user.deactivated': 'User deactivated',
  'user.invited': 'User invited',
  'profile.updated': 'Profile updated',
}

function ActivityFeed({ items }: { items: RecentActivity[] }) {
  if (items.length === 0) return null
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-gray-500" />
        <h2 className="text-sm font-medium text-white">Recent activity</h2>
      </div>
      <ul className="space-y-3">
        {items.map((item, i) => {
          const isLowStock = item.action === 'product.low_stock'
          return (
            <li key={i} className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-2">
                {isLowStock && (
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`text-sm ${isLowStock ? 'text-amber-300' : 'text-white'}`}>
                    {ACTION_LABELS[item.action] ?? item.action}
                  </p>
                  {item.details && <p className="text-xs text-gray-500 mt-0.5">{item.details}</p>}
                </div>
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap shrink-0">
                {formatDate(item.createdAt)}
              </span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

// ─── Top products panel ──────────────────────────────────────────────────────

function TopProducts({ items }: { items: TopProduct[] }) {
  if (items.length === 0) return null
  const max = Math.max(...items.map((p) => p.revenue), 1)
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-gray-500" />
        <h2 className="text-sm font-medium text-white">Top products</h2>
      </div>
      <ul className="space-y-3">
        {items.map((p) => (
          <li key={p.productId}>
            <div className="flex items-center justify-between gap-4 mb-1">
              <span className="text-sm text-white truncate">{p.name}</span>
              <span className="text-sm text-gray-400 font-mono whitespace-nowrap">
                {formatMoney(p.revenue)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand rounded-full"
                  style={{ width: `${(p.revenue / max) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap">{p.unitsSold} sold</span>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}

// ─── Revenue breakdown panel ─────────────────────────────────────────────────

function RevenueBreakdown({ data }: { data: DashboardData }) {
  const feeLabel = `${(data.currentFeePercent * 100).toFixed(data.currentFeePercent < 0.01 ? 2 : 0)}%`
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-4 h-4 text-gray-500" />
        <h2 className="text-sm font-medium text-white">Revenue breakdown</h2>
      </div>
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Gross sales</span>
          <span className="text-white font-mono">{formatMoney(data.grossRevenue)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Platform fee ({feeLabel})</span>
          <span className="text-rose-400 font-mono">−{formatMoney(data.platformFees)}</span>
        </div>
        <div className="border-t border-gray-800 pt-2.5 flex items-center justify-between">
          <span className="text-sm font-medium text-white">Net revenue</span>
          <span className="text-lg font-semibold text-emerald-400 font-mono">
            {formatMoney(data.netRevenue)}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-start gap-2 text-xs text-gray-500 bg-gray-800/40 border border-gray-800 rounded-lg px-3 py-2">
        <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
        <p>
          Stripe processing fees (~2.9% + $0.30 per transaction) are deducted separately by Stripe.
          See your Stripe dashboard for your exact payout.
        </p>
      </div>
    </Card>
  )
}

// ─── Tenant dashboard ─────────────────────────────────────────────────────────

function TenantDashboard() {
  const { tenantSlug, isAdmin } = useAuth()
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  })
  const showSkeleton = isLoading && !data

  const primaryStats = data
    ? [
        {
          label: 'Net revenue',
          value: formatMoney(data.netRevenue),
          sub: `${formatMoney(data.grossRevenue)} gross · AOV ${formatMoney(data.averageOrderValue)}`,
          icon: DollarSign,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10',
        },
        {
          label: 'Paid orders',
          value: data.paidOrderCount.toString(),
          sub: `${data.pendingOrderCount} pending`,
          icon: ShoppingCart,
          color: 'text-brand',
          bg: 'bg-brand/10',
        },
        {
          label: 'Customers',
          value: data.customerCount.toString(),
          sub: 'total',
          icon: UserCheck,
          color: 'text-sky-400',
          bg: 'bg-sky-500/10',
        },
        {
          label: 'Products',
          value: data.productCount.toString(),
          sub: `${data.activeProductCount} active`,
          icon: Package,
          color: 'text-amber-400',
          bg: 'bg-amber-500/10',
        },
      ]
    : []

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1 text-sm flex items-center gap-2">
            {tenantSlug ? `Tenant: ${tenantSlug}` : 'Overview'}
            {isAdmin && <Badge variant="info">Admin</Badge>}
          </p>
        </div>
        {data && data.pendingOrderCount > 0 && (
          <Link
            to="/orders?status=pending"
            className="flex items-center gap-2 text-sm font-medium text-brand hover:text-brand-hover"
          >
            {data.pendingOrderCount} pending order{data.pendingOrderCount !== 1 ? 's' : ''}{' '}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {showSkeleton
          ? [1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6">
                <div className="h-4 bg-gray-800 rounded w-20 mb-4" />
                <div className="h-8 bg-gray-800 rounded w-24" />
              </Card>
            ))
          : primaryStats.map(({ label, value, sub, icon: Icon, color, bg }) => (
              <Card key={label} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-400">{label}</span>
                  <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-gray-500 mt-1">{sub}</p>
              </Card>
            ))}
      </div>

      {!isLoading && data && !data.onboardingComplete && (
        <div className="mb-6">
          <OnboardingChecklist />
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RevenueBreakdown data={data} />
          <TopProducts items={data.topProducts} />
          <ActivityFeed items={data.recentActivity} />
        </div>
      )}
    </div>
  )
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { isSuperAdmin } = useAuth()
  return isSuperAdmin ? <SuperAdminDashboard /> : <TenantDashboard />
}
