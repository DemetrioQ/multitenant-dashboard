import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Users,
  LogOut,
  ShieldCheck,
  Settings,
  UserCircle,
  ClipboardList,
  Building2,
  ShoppingCart,
  UserCheck,
  ExternalLink,
  Menu,
  X,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { ErrorBoundary } from './ErrorBoundary'
import { FetchingBar } from './PageStates'

export function Layout() {
  const { tenantName, tenantSlug, storeUrl, avatarUrl, isAdmin, isSuperAdmin, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const mainRef = useRef<HTMLElement>(null)

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  // Reset scroll before paint so it doesn't race with content mount
  useLayoutEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0 })
  }, [location.pathname])

  // Lock body scroll while drawer open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [drawerOpen])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
    }`

  return (
    <div className="flex h-[100dvh] bg-gray-950 overflow-hidden">
      {/* Mobile backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-40
          w-64 md:w-60 flex-shrink-0
          bg-gray-900 border-r border-gray-800 flex flex-col
          transform transition-transform duration-200 ease-out
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {/* Brand */}
        <div className="px-5 py-5 border-b border-gray-800 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white tracking-tight">SaaS Dashboard</p>
            {isSuperAdmin ? (
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <ShieldCheck className="w-3 h-3" /> Super Admin
              </span>
            ) : tenantName || tenantSlug ? (
              <>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{tenantName ?? tenantSlug}</p>
                {storeUrl && (
                  <a
                    href={storeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={storeUrl}
                    className="mt-1 inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors max-w-full"
                  >
                    <span className="truncate">{storeUrl.replace(/^https?:\/\//, '')}</span>
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                )}
              </>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="md:hidden p-1 text-gray-400 hover:text-white"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          <NavLink to="/dashboard" className={navClass}>
            <LayoutDashboard className="w-4 h-4 flex-shrink-0" /> Dashboard
          </NavLink>

          {isSuperAdmin ? (
            <>
              <NavLink to="/admin" end className={navClass}>
                <Building2 className="w-4 h-4 flex-shrink-0" /> Tenants
              </NavLink>
              <NavLink to="/admin/products" className={navClass}>
                <Package className="w-4 h-4 flex-shrink-0" /> Products
              </NavLink>
              <NavLink to="/admin/audit" className={navClass}>
                <ClipboardList className="w-4 h-4 flex-shrink-0" /> Audit log
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/products" className={navClass}>
                <Package className="w-4 h-4 flex-shrink-0" /> Products
              </NavLink>
              <NavLink to="/orders" className={navClass}>
                <ShoppingCart className="w-4 h-4 flex-shrink-0" /> Orders
              </NavLink>
              <NavLink to="/customers" className={navClass}>
                <UserCheck className="w-4 h-4 flex-shrink-0" /> Customers
              </NavLink>
              <NavLink to="/team" className={navClass}>
                <Users className="w-4 h-4 flex-shrink-0" /> Team
              </NavLink>
              <NavLink to="/settings" end className={navClass}>
                <Settings className="w-4 h-4 flex-shrink-0" /> Settings
              </NavLink>
              {isAdmin && (
                <NavLink to="/audit" className={navClass}>
                  <ClipboardList className="w-4 h-4 flex-shrink-0" /> Audit log
                </NavLink>
              )}
            </>
          )}
        </nav>

        {/* Bottom: profile + sign out */}
        <div className="p-2 border-t border-gray-800 space-y-0.5">
          {!isSuperAdmin && (
            <NavLink to="/settings/profile" className={navClass}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="w-4 h-4 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <UserCircle className="w-4 h-4 flex-shrink-0" />
              )}
              Profile
            </NavLink>
          )}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-gray-900 border-b border-gray-800">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="p-1 text-gray-300 hover:text-white"
            aria-label="Open navigation"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="text-sm font-semibold text-white tracking-tight">SaaS Dashboard</span>
        </header>

        <main ref={mainRef} className="flex-1 overflow-y-auto overscroll-contain">
          <ErrorBoundary resetKey={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
        <FetchingBar />
      </div>
    </div>
  )
}
