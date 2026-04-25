import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Navigate, Link } from 'react-router-dom'
import {
  Building2,
  ShieldCheck,
  Users,
  Package,
  ClipboardList,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import {
  getAdminStats,
  getAdminTenants,
  getAdminAudit,
  getAdminSignups,
  type SignupsPeriod,
  type SignupsEntity,
} from '../api/admin'
import { useAuth } from '../hooks/useAuth'
import { parseUtc } from '../utils/format'
import { PageLoading } from '../components/PageStates'
import { Badge, Card, Select } from '../components/ui'

const ACTION_LABELS: Record<string, string> = {
  'product.created': 'Product created',
  'product.updated': 'Product updated',
  'product.activated': 'Product activated',
  'product.deactivated': 'Product deactivated',
  'tenant.updated': 'Tenant updated',
  'tenant.deactivated': 'Tenant deactivated',
  'user.role_updated': 'Role changed',
  'user.deactivated': 'User deactivated',
  'user.invited': 'User invited',
  'profile.updated': 'Profile updated',
}

function ActionBadge({ action }: { action: string }) {
  const isDestructive = action.includes('deactivated')
  const isPositive =
    action.includes('created') ||
    action.includes('invited') ||
    (action.includes('activated') && !isDestructive)
  const variant = isDestructive ? 'destructive' : isPositive ? 'success' : 'default'
  return <Badge variant={variant}>{ACTION_LABELS[action] ?? action}</Badge>
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  sub,
}: {
  label: string
  value: number
  icon: React.ElementType
  color: string
  bg: string
  sub?: React.ReactNode
}) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <span className="text-xs sm:text-sm font-medium text-gray-400">{label}</span>
        <div className={`w-8 h-8 sm:w-9 sm:h-9 ${bg} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-white">{value}</p>
      {sub && <div className="mt-1.5">{sub}</div>}
    </Card>
  )
}

function DeltaBadge({ value, label }: { value: number; label: string }) {
  if (value <= 0) return <span className="text-xs text-gray-500">{label}</span>
  return (
    <span className="inline-flex items-center text-xs font-medium text-emerald-400">
      +{value} {label}
    </span>
  )
}

const PERIOD_OPTIONS: { value: SignupsPeriod; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
]

const ENTITY_OPTIONS: { value: SignupsEntity; label: string }[] = [
  { value: 'tenants', label: 'Tenants' },
  { value: 'users', label: 'Users' },
  { value: 'customers', label: 'Customers' },
]

function SignupsChart() {
  const [period, setPeriod] = useState<SignupsPeriod>('30d')
  const [entity, setEntity] = useState<SignupsEntity>('tenants')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'signups', period, entity],
    queryFn: () => getAdminSignups(period, entity),
    placeholderData: (prev) => prev,
  })

  const points = data?.points ?? []
  const total = points.reduce((sum, p) => sum + p.count, 0)
  const showEmpty = !isLoading && total === 0

  return (
    <Card className="p-4 sm:p-6 mb-4 sm:mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-white">Signups</h2>
          <span className="text-xs text-gray-500">· {total} total</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2 sm:flex-shrink-0">
          <Select
            value={entity}
            onChange={(e) => setEntity(e.target.value as SignupsEntity)}
            className="bg-gray-950 text-xs px-2.5 py-1.5"
          >
            {ENTITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value as SignupsPeriod)}
            className="bg-gray-950 text-xs px-2.5 py-1.5"
          >
            {PERIOD_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="w-full h-48 sm:h-56">
        {showEmpty ? (
          <div className="h-full flex items-center justify-center text-sm text-gray-500">
            No signups in this range.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="signupsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1f2937" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#6b7280', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                minTickGap={24}
                tickFormatter={(v: string) => {
                  const d = parseUtc(v)
                  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                }}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={28}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #1f2937',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: '#9ca3af' }}
                itemStyle={{ color: '#fff' }}
                labelFormatter={(v) =>
                  parseUtc(v as string).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                }
                formatter={(value) =>
                  [
                    String(value),
                    entity === 'tenants' ? 'Tenants' : entity === 'users' ? 'Users' : 'Customers',
                  ] as [string, string]
                }
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#signupsFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  )
}

function SectionHeader({
  icon: Icon,
  title,
  href,
  linkLabel,
}: {
  icon: React.ElementType
  title: string
  href: string
  linkLabel: string
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-gray-400" />
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      <Link
        to={href}
        className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:text-brand-hover transition-colors"
      >
        {linkLabel} <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - parseUtc(iso).getTime()
  const sec = Math.floor(diffMs / 1000)
  if (sec < 60) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day}d ago`
  const month = Math.floor(day / 30)
  if (month < 12) return `${month}mo ago`
  const year = Math.floor(month / 12)
  return `${year}y ago`
}

export function AdminPage() {
  const { isSuperAdmin } = useAuth()

  const { data: stats } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: getAdminStats,
    enabled: isSuperAdmin,
  })

  const { data: recentTenantsData, isLoading: tenantsLoading } = useQuery({
    queryKey: ['admin', 'tenants', 'recent'],
    queryFn: () => getAdminTenants(1, 5),
    enabled: isSuperAdmin,
  })
  const recentTenants = recentTenantsData?.items ?? []

  const { data: recentAuditData, isLoading: auditLoading } = useQuery({
    queryKey: ['admin', 'audit', 'recent'],
    queryFn: () => getAdminAudit(1, 10),
    enabled: isSuperAdmin,
  })
  const recentAudit = recentAuditData?.items ?? []

  if (!isSuperAdmin) return <Navigate to="/dashboard" replace />

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          <h1 className="text-2xl font-semibold text-white">Platform admin</h1>
        </div>
        <p className="text-amber-400/70 mt-1 text-sm">Super-admin overview</p>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <StatCard
          label="Tenants"
          value={stats?.totalTenants ?? 0}
          icon={Building2}
          color="text-amber-400"
          bg="bg-amber-500/10"
          sub={stats ? <DeltaBadge value={stats.newTenantsThisWeek} label="this week" /> : null}
        />
        <StatCard
          label="Users"
          value={stats?.totalUsers ?? 0}
          icon={Users}
          color="text-indigo-400"
          bg="bg-indigo-500/10"
          sub={stats ? <span className="text-xs text-gray-500">across all tenants</span> : null}
        />
        <StatCard
          label="Products"
          value={stats?.totalProducts ?? 0}
          icon={Package}
          color="text-emerald-400"
          bg="bg-emerald-500/10"
          sub={stats ? <span className="text-xs text-gray-500">across all tenants</span> : null}
        />
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card className="px-4 py-3 sm:px-5 sm:py-4">
            <p className="text-xs text-gray-500">Active tenants</p>
            <p className="text-lg sm:text-xl font-semibold text-emerald-400 mt-0.5">
              {stats.activeTenants}
            </p>
          </Card>
          <Card className="px-4 py-3 sm:px-5 sm:py-4">
            <p className="text-xs text-gray-500">Inactive tenants</p>
            <p className="text-lg sm:text-xl font-semibold text-gray-400 mt-0.5">
              {stats.inactiveTenants}
            </p>
          </Card>
        </div>
      )}

      <SignupsChart />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recently added tenants */}
        <section>
          <SectionHeader
            icon={Building2}
            title="Recently added tenants"
            href="/tenants"
            linkLabel="Manage"
          />
          <Card className="overflow-hidden">
            {tenantsLoading && !recentTenantsData ? (
              <PageLoading className="py-10" />
            ) : recentTenants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Building2 className="w-6 h-6 text-gray-700" />
                <p className="text-gray-500 text-sm">No tenants yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {recentTenants.map((t) => (
                  <Link
                    key={t.id}
                    to={`/admin/tenants/${t.id}`}
                    className="flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-4 hover:bg-gray-800/30 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{t.name}</p>
                      <p className="text-xs text-gray-500 font-mono truncate">{t.slug}</p>
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                      {timeAgo(t.createdAt)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </section>

        {/* Recent activity */}
        <section>
          <SectionHeader
            icon={ClipboardList}
            title="Recent activity"
            href="/admin/audit"
            linkLabel="View all"
          />
          <Card className="overflow-hidden">
            {auditLoading && !recentAuditData ? (
              <PageLoading className="py-10" />
            ) : recentAudit.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <ClipboardList className="w-6 h-6 text-gray-700" />
                <p className="text-gray-500 text-sm">No activity yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {recentAudit.map((e) => (
                  <div key={e.id} className="px-4 py-3 sm:px-5 sm:py-4">
                    <div className="flex items-start justify-between gap-2">
                      <ActionBadge action={e.action} />
                      <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                        {timeAgo(e.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 mt-1.5 truncate">{e.userEmail}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>
      </div>
    </div>
  )
}
