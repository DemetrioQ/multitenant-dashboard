import { useEffect, useState } from 'react'
import { Package, Users, Building2, ShieldCheck } from 'lucide-react'
import { getProducts } from '../api/products'
import { getUsers } from '../api/users'
import { getTenants } from '../api/tenants'
import { useAuth } from '../hooks/useAuth'

export function DashboardPage() {
  const { tenantSlug, isAdmin, isSuperAdmin } = useAuth()
  const [productCount, setProductCount] = useState<number | null>(null)
  const [userCount, setUserCount] = useState<number | null>(null)
  const [tenantCount, setTenantCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetches = isSuperAdmin
      ? [getProducts(1, 1), getUsers(), getTenants()] as const
      : [getProducts(1, 1), getUsers()] as const

    Promise.all(fetches)
      .then((results) => {
        const [products, users] = results
        setProductCount((products as Awaited<ReturnType<typeof getProducts>>).totalCount)
        setUserCount((users as Awaited<ReturnType<typeof getUsers>>).length)
        if (isSuperAdmin && results.length === 3) {
          setTenantCount((results[2] as Awaited<ReturnType<typeof getTenants>>).length)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isSuperAdmin])

  const stats = [
    ...(isSuperAdmin ? [{
      label: 'Total Tenants',
      value: tenantCount,
      icon: Building2,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    }] : []),
    {
      label: 'Products',
      value: productCount,
      icon: Package,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
    },
    {
      label: 'Users',
      value: userCount,
      icon: Users,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
  ]

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1 text-sm flex items-center gap-2">
          {isSuperAdmin ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400">Platform overview</span>
            </>
          ) : (
            tenantSlug ? `Tenant: ${tenantSlug}` : 'Overview'
          )}
          {isAdmin && !isSuperAdmin && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              Admin
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-400">{label}</span>
              <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">
              {loading ? <span className="text-gray-600">—</span> : (value ?? '—')}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          {isSuperAdmin
            ? <ShieldCheck className="w-4 h-4 text-amber-400" />
            : <Building2 className="w-4 h-4 text-gray-500" />
          }
          <h2 className="text-sm font-medium text-white">
            {isSuperAdmin ? 'Platform account' : 'Your tenant'}
          </h2>
        </div>
        <p className="text-sm text-gray-400">
          {isSuperAdmin
            ? 'You are signed in as a platform super-admin. You have access to all tenants, products, and users across the platform.'
            : 'Use the sidebar to manage your tenant\'s products and users. Admin users can also update tenant details and manage user roles.'
          }
        </p>
      </div>
    </div>
  )
}
