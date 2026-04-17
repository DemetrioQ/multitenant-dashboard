import { useEffect, useState } from 'react'
import { Package, Users, Building2, ShieldCheck, Activity } from 'lucide-react'
import { getDashboard, type DashboardData, type RecentActivity } from '../api/tenants'
import { getAdminStats } from '../api/admin'
import { useAuth } from '../hooks/useAuth'
import { OnboardingChecklist } from '../components/OnboardingChecklist'

// ─── Super-admin dashboard ────────────────────────────────────────────────────

function SuperAdminDashboard() {
  const [stats, setStats] = useState<{ totalTenants: number; totalUsers: number; totalProducts: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const cards = stats
    ? [
        { label: 'Total tenants',  value: stats.totalTenants,  icon: Building2, color: 'text-amber-400',  bg: 'bg-amber-500/10' },
        { label: 'Total users',    value: stats.totalUsers,    icon: Users,     color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
        { label: 'Total products', value: stats.totalProducts, icon: Package,   color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
      ]
    : []

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <p className="text-amber-400/80 mt-1 text-sm flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5" /> Platform overview
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading
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
  'product.deactivated': 'Product deactivated',
  'tenant.updated': 'Tenant updated',
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
        {items.map((item, i) => (
          <li key={i} className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-white">{ACTION_LABELS[item.action] ?? item.action}</p>
              {item.details && <p className="text-xs text-gray-500 mt-0.5">{item.details}</p>}
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap shrink-0">
              {new Date(item.createdAt).toLocaleDateString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Tenant dashboard ─────────────────────────────────────────────────────────

function TenantDashboard() {
  const { tenantSlug, isAdmin } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const stats = data
    ? [
        { label: 'Products', value: data.productCount, sub: `${data.activeProductCount} active`, icon: Package, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
        { label: 'Users',    value: data.userCount,    sub: `${data.activeUserCount} active`,   icon: Users,   color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
      ]
    : []

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {loading
          ? [1, 2].map((i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="h-4 bg-gray-800 rounded w-20 mb-4" />
                <div className="h-8 bg-gray-800 rounded w-16" />
              </div>
            ))
          : stats.map(({ label, value, sub, icon: Icon, color, bg }) => (
              <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-400">{label}</span>
                  <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-white">{value}</p>
                <p className="text-xs text-gray-500 mt-1">{sub}</p>
              </div>
            ))
        }
      </div>

      {!data?.onboardingComplete && (
        <div className="mb-6">
          <OnboardingChecklist />
        </div>
      )}

      {data && <ActivityFeed items={data.recentActivity} />}
    </div>
  )
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { isSuperAdmin } = useAuth()
  return isSuperAdmin ? <SuperAdminDashboard /> : <TenantDashboard />
}
