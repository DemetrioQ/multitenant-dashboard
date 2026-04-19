import { createContext, useState, useEffect, type ReactNode } from 'react'
import { BASE_URL, resetRefreshState } from '../api/client'
import { logout as apiLogout } from '../api/auth'
import { getTenantMe } from '../api/tenants'
import { getMe } from '../api/users'

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
  return (p['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] as string)
    ?? (p['sub'] as string)
    ?? null
}

interface AuthState {
  token: string | null
  userId: string | null
  tenantName: string | null
  tenantSlug: string | null
  tenantCurrency: string | null
  storeUrl: string | null
  role: string | null
  avatarUrl: string | null
  isAuthenticated: boolean
}

interface AuthContextType extends AuthState {
  isAdmin: boolean      // true for 'admin' and 'super-admin'
  isSuperAdmin: boolean // true only for 'super-admin' (platform-level account)
  signIn: (token: string, tenantSlug?: string) => void
  signOut: () => void
  setAvatarUrl: (url: string | null) => void
}

export const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    userId: null,
    tenantName: null,
    tenantSlug: localStorage.getItem('tenantSlug'),
    tenantCurrency: null,
    storeUrl: null,
    role: null,
    avatarUrl: null,
    isAuthenticated: false,
  })
  const [bootstrapped, setBootstrapped] = useState(false)

  // After authenticating, fetch tenant details + user profile.
  // Skipped for super-admin who is not scoped to a customer tenant.
  useEffect(() => {
    if (!state.isAuthenticated || state.role === 'super-admin') return

    Promise.all([getTenantMe(), getMe()])
      .then(([tenant, profile]) => {
        localStorage.setItem('tenantSlug', tenant.slug)
        setState((prev) => ({
          ...prev,
          tenantName: tenant.name,
          tenantSlug: tenant.slug,
          tenantCurrency: tenant.currency,
          storeUrl: tenant.storeUrl,
          avatarUrl: profile.avatarUrl,
        }))
      })
      .catch(() => {})
  }, [state.isAuthenticated, state.role])

  // On mount: silently restore session via HttpOnly cookie.
  // Skip if there's no sign of a prior session (no tenantSlug) to avoid
  // unnecessary failed refresh calls on public pages.
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
          tenantName: null,
          tenantSlug: localStorage.getItem('tenantSlug'),
          tenantCurrency: null,
          storeUrl: null,
          role: decodeRole(data.jwtToken),
          avatarUrl: null,
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
    setState({
      token,
      userId: decodeUserId(token),
      tenantName: null,
      tenantSlug: tenantSlug ?? localStorage.getItem('tenantSlug'),
      tenantCurrency: null,
      storeUrl: null,
      role: decodeRole(token),
      avatarUrl: null,
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
    setState({ token: null, userId: null, tenantName: null, tenantSlug: null, tenantCurrency: null, storeUrl: null, role: null, avatarUrl: null, isAuthenticated: false })
  }

  const setAvatarUrl = (url: string | null) => {
    setState((prev) => ({ ...prev, avatarUrl: url }))
  }

  if (!bootstrapped) return null

  return (
    <AuthContext.Provider value={{
      ...state,
      isAdmin: state.role === 'admin' || state.role === 'super-admin',
      isSuperAdmin: state.role === 'super-admin',
      signIn,
      signOut,
      setAvatarUrl,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
