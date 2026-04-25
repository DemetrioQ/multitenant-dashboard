import { createContext, useState, useEffect, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BASE_URL, resetRefreshState } from '../api/client'
import { logout as apiLogout } from '../api/auth'
import { getTenantMe } from '../api/tenants'
import { getMe } from '../api/users'
import { clearQueryCache } from '../lib/queryClient'
import { qk } from '../lib/queryKeys'

const REFRESH_URL = `${BASE_URL}/api/v1/auth/refresh`

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

interface AuthCoreState {
  token: string | null
  userId: string | null
  role: string | null
  isAuthenticated: boolean
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
  signIn: (token: string, tenantSlug?: string) => void
  signOut: () => void
}

export const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthCoreState>({
    token: null,
    userId: null,
    role: null,
    isAuthenticated: false,
  })
  const [bootstrapped, setBootstrapped] = useState(false)

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

  // On mount: silently restore session via HttpOnly cookie.
  // Skip if there's no sign of a prior session to avoid unnecessary failed refresh calls.
  useEffect(() => {
    const hadSession = !!localStorage.getItem('tenantSlug') || !!sessionStorage.getItem('token')

    if (!hadSession) {
      setBootstrapped(true)
      return
    }

    const restore = async () => {
      try {
        const res = await fetch(REFRESH_URL, { method: 'POST', credentials: 'include' })
        if (!res.ok) throw new Error()
        const data = await res.json()
        sessionStorage.setItem('token', data.jwtToken)
        setState({
          token: data.jwtToken,
          userId: decodeUserId(data.jwtToken),
          role: decodeRole(data.jwtToken),
          isAuthenticated: true,
        })
      } catch {
        sessionStorage.removeItem('token')
        localStorage.removeItem('tenantSlug')
      } finally {
        setBootstrapped(true)
      }
    }

    restore()
  }, [])

  const signIn = (token: string, tenantSlug?: string) => {
    sessionStorage.setItem('token', token)
    if (tenantSlug) localStorage.setItem('tenantSlug', tenantSlug)
    resetRefreshState()
    clearQueryCache()
    setState({
      token,
      userId: decodeUserId(token),
      role: decodeRole(token),
      isAuthenticated: true,
    })
  }

  const signOut = async () => {
    try {
      await apiLogout()
    } catch {
      // best-effort
    }
    sessionStorage.removeItem('token')
    localStorage.removeItem('tenantSlug')
    clearQueryCache()
    setState({ token: null, userId: null, role: null, isAuthenticated: false })
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
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
