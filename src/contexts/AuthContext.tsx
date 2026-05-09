import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BASE_URL, resetRefreshState } from '../api/client'
import { logout as apiLogout, demoProvision, demoElevate } from '../api/auth'
import { getTenantMe } from '../api/tenants'
import { getMe } from '../api/users'
import { clearQueryCache } from '../lib/queryClient'
import { qk } from '../lib/queryKeys'

const REFRESH_URL = `${BASE_URL}/api/v1/auth/refresh`
const NO_AUTO_DEMO_KEY = 'dashboard:no-auto-demo'

function decodePayload(token: string): Record<string, unknown> {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return {}
  }
}

function decodeRole(token: string): string | null {
  const p = decodePayload(token)
  return (p['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] as string) ?? null
}

function decodeUserId(token: string): string | null {
  const p = decodePayload(token)
  return (
    (p['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] as string) ??
    (p['sub'] as string) ??
    null
  )
}

function decodeIsDemo(token: string): boolean {
  return decodePayload(token)['demo'] === 'true'
}

function decodeDemoExpiresAt(token: string): string | null {
  return (decodePayload(token)['demo_expires_at'] as string) ?? null
}

interface AuthCoreState {
  token: string | null
  userId: string | null
  role: string | null
  isAuthenticated: boolean
  isDemo: boolean
  demoExpiresAt: string | null
}

interface AuthContextType {
  token: string | null
  userId: string | null
  tenantName: string | null
  tenantSlug: string | null
  storeUrl: string | null
  role: string | null
  avatarUrl: string | null
  isAuthenticated: boolean
  isAdmin: boolean // true for 'admin' and 'super-admin'
  isSuperAdmin: boolean // true only for 'super-admin' (platform-level account)
  isDemo: boolean
  demoExpiresAt: string | null
  signIn: (token: string, tenantSlug?: string) => void
  signOut: () => void
  signInAsDemo: () => Promise<void>
  elevateDemoRole: (role: 'member' | 'admin' | 'super-admin') => Promise<void>
}

export const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthCoreState>({
    token: null,
    userId: null,
    role: null,
    isAuthenticated: false,
    isDemo: false,
    demoExpiresAt: null,
  })
  const [bootstrapped, setBootstrapped] = useState(false)

  const applyToken = useCallback((token: string) => {
    sessionStorage.setItem('token', token)
    setState({
      token,
      userId: decodeUserId(token),
      role: decodeRole(token),
      isAuthenticated: true,
      isDemo: decodeIsDemo(token),
      demoExpiresAt: decodeDemoExpiresAt(token),
    })
  }, [])

  const tenantScoped = state.isAuthenticated && state.role !== 'super-admin'

  const { data: tenantData } = useQuery({
    queryKey: qk.tenantMe,
    queryFn: getTenantMe,
    enabled: tenantScoped,
  })

  const { data: profileData } = useQuery({
    queryKey: qk.userMe,
    queryFn: getMe,
    enabled: tenantScoped,
  })

  // Persist tenant slug for the next bootstrap (display only).
  useEffect(() => {
    if (tenantData?.slug) localStorage.setItem('tenantSlug', tenantData.slug)
  }, [tenantData?.slug])

  // On mount: try to silently restore via HttpOnly refresh cookie. If that fails
  // and the visitor hasn't explicitly signed out, auto-provision a per-visitor
  // demo account. Once they sign out, NO_AUTO_DEMO_KEY persists across reloads
  // so they land on /login with the "Try the demo" button instead.
  useEffect(() => {
    const restore = async () => {
      const hadSession = !!localStorage.getItem('tenantSlug') || !!sessionStorage.getItem('token')

      if (hadSession) {
        try {
          const res = await fetch(REFRESH_URL, { method: 'POST', credentials: 'include' })
          if (res.ok) {
            const data = await res.json()
            applyToken(data.jwtToken)
            setBootstrapped(true)
            return
          }
        } catch {
          // fall through
        }
        sessionStorage.removeItem('token')
        localStorage.removeItem('tenantSlug')
      }

      const noAutoDemo = localStorage.getItem(NO_AUTO_DEMO_KEY) === 'true'
      if (noAutoDemo) {
        setBootstrapped(true)
        return
      }

      try {
        const data = await demoProvision()
        localStorage.setItem('tenantSlug', data.tenantSlug)
        applyToken(data.jwtToken)
      } catch {
        // demo provision shouldn't fail in practice, but fall through to login
      } finally {
        setBootstrapped(true)
      }
    }

    restore()
  }, [applyToken])

  const signIn = (token: string, tenantSlug?: string) => {
    if (tenantSlug) localStorage.setItem('tenantSlug', tenantSlug)
    localStorage.removeItem(NO_AUTO_DEMO_KEY)
    resetRefreshState()
    clearQueryCache()
    applyToken(token)
  }

  const signOut = async () => {
    try {
      await apiLogout()
    } catch {
      // best-effort
    }
    sessionStorage.removeItem('token')
    localStorage.removeItem('tenantSlug')
    localStorage.setItem(NO_AUTO_DEMO_KEY, 'true')
    clearQueryCache()
    setState({
      token: null,
      userId: null,
      role: null,
      isAuthenticated: false,
      isDemo: false,
      demoExpiresAt: null,
    })
  }

  const signInAsDemo = async () => {
    const data = await demoProvision()
    localStorage.setItem('tenantSlug', data.tenantSlug)
    localStorage.removeItem(NO_AUTO_DEMO_KEY)
    resetRefreshState()
    clearQueryCache()
    applyToken(data.jwtToken)
  }

  const elevateDemoRole = async (role: 'member' | 'admin' | 'super-admin') => {
    const data = await demoElevate(role)
    clearQueryCache()
    applyToken(data.jwtToken)
  }

  if (!bootstrapped) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-950">
        <p className="text-gray-500 text-sm">Loading…</p>
      </div>
    )
  }

  const tenantSlugFallback = localStorage.getItem('tenantSlug')

  return (
    <AuthContext.Provider
      value={{
        token: state.token,
        userId: state.userId,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
        tenantName: tenantData?.name ?? null,
        tenantSlug: tenantData?.slug ?? tenantSlugFallback,
        storeUrl: tenantData?.storeUrl ?? null,
        avatarUrl: profileData?.avatarUrl ?? null,
        isAdmin: state.role === 'admin' || state.role === 'super-admin',
        isSuperAdmin: state.role === 'super-admin',
        isDemo: state.isDemo,
        demoExpiresAt: state.demoExpiresAt,
        signIn,
        signOut,
        signInAsDemo,
        elevateDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
