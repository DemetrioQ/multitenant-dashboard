import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Package, Users, Building2, ShieldCheck, Activity, ShoppingCart,
  UserCheck, DollarSign, TrendingUp, AlertTriangle, ArrowRight,
} from 'lucide-react'
import { getDashboard, type RecentActivity, type TopProduct } from '../api/tenants'
import { getAdminStats } from '../api/admin'
import { useAuth } from '../hooks/useAuth'
import { OnboardingChecklist } from '../components/OnboardingChecklist'
import { formatMoney } from '../utils/format'

// ─── Super-admin dashboard ────────────────────────────────────────────────────

function SuperAdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: getAdminStats,
  })
  const showSkeleton = isLoading && !stats

  const cards = stats
    ? [
        { label: 'Total tenants',  value: stats.totalTenants,  icon: Building2, color: 'text-amber-400',  bg: 'bg-amber-500/10' },
        { label: 'Total users',    value: stats.totalUsers,    icon: Users,     color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
        { label: 'Total products', value: stats.totalProducts, icon: Package,   color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
      ]
    : []

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <p className="text-amber-400/80 mt-1 text-sm flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5" /> Platform overview
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {showSkeleton
          ? [1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="h-4 bg-gray-800 rounded w-24 mb-4" />
                <div className="h-8 bg-gray-800 rounded w-16" />
              </div>
            ))
          : cards.map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-400">{label}</span>
                  <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-white">{value}</p>
              </div>
            ))
        }
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
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
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
                {new Date(item.createdAt.endsWith('Z') ? item.createdAt : item.createdAt + 'Z').toLocaleDateString()}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// ─── Top products panel ──────────────────────────────────────────────────────

function TopProducts({ items, currency }: { items: TopProduct[]; currency: string | null }) {
  if (items.length === 0) return null
  const max = Math.max(...items.map((p) => p.revenue), 1)
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
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
                {formatMoney(p.revenue, currency)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${(p.revenue / max) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap">{p.unitsSold} sold</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Tenant dashboard ─────────────────────────────────────────────────────────

function TenantDashboard() {
  const { tenantSlug, tenantCurrency, isAdmin } = useAuth()
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  })
  const showSkeleton = isLoading && !data

  const primaryStats = data
    ? [
        { label: 'Revenue',       value: formatMoney(data.totalRevenue, tenantCurrency), sub: `AOV ${formatMoney(data.averageOrderValue, tenantCurrency)}`, icon: DollarSign,  color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { label: 'Paid orders',   value: data.paidOrderCount.toString(), sub: `${data.pendingOrderCount} pending`, icon: ShoppingCart, color: 'text-indigo-400',  bg: 'bg-indigo-500/10' },
        { label: 'Customers',     value: data.customerCount.toString(),  sub: 'total',                             icon: UserCheck,    color: 'text-sky-400',     bg: 'bg-sky-500/10' },
        { label: 'Products',      value: data.productCount.toString(),   sub: `${data.activeProductCount} active`, icon: Package,      color: 'text-amber-400',   bg: 'bg-amber-500/10' },
      ]
    : []

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1 text-sm flex items-center gap-2">
            {tenantSlug ? `Tenant: ${tenantSlug}` : 'Overview'}
            {isAdmin && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                Admin
              </span>
            )}
          </p>
        </div>
        {data && data.pendingOrderCount > 0 && (
          <Link
            to="/orders?status=pending"
            className="flex items-center gap-2 text-sm font-medium text-indigo-400 hover:text-indigo-300"
          >
            {data.pendingOrderCount} pending order{data.pendingOrderCount !== 1 ? 's' : ''} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {showSkeleton
          ? [1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="h-4 bg-gray-800 rounded w-20 mb-4" />
                <div className="h-8 bg-gray-800 rounded w-24" />
              </div>
            ))
          : primaryStats.map(({ label, value, sub, icon: Icon, color, bg }) => (
              <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-400">{label}</span>
                  <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-gray-500 mt-1">{sub}</p>
              </div>
            ))
        }
      </div>

      {!isLoading && data && !data.onboardingComplete && (
        <div className="mb-6">
          <OnboardingChecklist />
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TopProducts items={data.topProducts} currency={tenantCurrency} />
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
