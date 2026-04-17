import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, Users, LogOut, ShieldCheck,
  Settings, UserCircle, ClipboardList, Building2,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export function Layout() {
  const { tenantName, tenantSlug, avatarUrl, isAdmin, isSuperAdmin, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
    }`

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <aside className="w-60 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-gray-800">
          <p className="text-sm font-semibold text-white tracking-tight">SaaS Dashboard</p>
          {isSuperAdmin ? (
            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <ShieldCheck className="w-3 h-3" /> Super Admin
            </span>
          ) : (tenantName || tenantSlug) ? (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{tenantName ?? tenantSlug}</p>
          ) : null}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          <NavLink to="/dashboard" className={navClass}>
            <LayoutDashboard className="w-4 h-4 flex-shrink-0" /> Dashboard
          </NavLink>

          {isSuperAdmin ? (
            <>
              <NavLink to="/admin" className={navClass}>
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
                <img src={avatarUrl} alt="" className="w-4 h-4 rounded-full object-cover flex-shrink-0" />
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

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
