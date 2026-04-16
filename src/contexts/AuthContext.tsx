import { createContext, useState, useEffect, type ReactNode } from 'react'
import axios from 'axios'
import { BASE_URL } from '../api/client'
import { logout as apiLogout } from '../api/auth'
import { getTenantMe } from '../api/tenants'

const REFRESH_URL = `${BASE_URL}/api/auth/refresh`

function decodeRole(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ?? null
  } catch {
    return null
  }
}

interface AuthState {
  token: string | null
  tenantName: string | null
  tenantSlug: string | null
  role: string | null
  isAuthenticated: boolean
}

interface AuthContextType extends AuthState {
  isAdmin: boolean      // true for 'admin' and 'super-admin'
  isSuperAdmin: boolean // true only for 'super-admin' (platform-level account)
  signIn: (token: string, tenantSlug?: string) => void
  signOut: () => void
}

export const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    tenantName: null,
    tenantSlug: localStorage.getItem('tenantSlug'),
    role: null,
    isAuthenticated: false,
  })
  const [bootstrapped, setBootstrapped] = useState(false)

  // After authenticating, fetch the current tenant details from /api/tenants/me.
  // Skipped for super-admin who is not scoped to a customer tenant.
  useEffect(() => {
    if (!state.isAuthenticated || state.role === 'super-admin') return

    getTenantMe()
      .then((tenant) => {
        localStorage.setItem('tenantSlug', tenant.slug)
        setState((prev) => ({ ...prev, tenantName: tenant.name, tenantSlug: tenant.slug }))
      })
      .catch(() => {})
  }, [state.isAuthenticated, state.role])

  // On mount: silently restore session via HttpOnly cookie
  useEffect(() => {
    const restore = async () => {
      try {
        const { data } = await axios.post(REFRESH_URL, null, { withCredentials: true })
        sessionStorage.setItem('token', data.jwtToken)
        setState({
          token: data.jwtToken,
          tenantName: null,
          tenantSlug: localStorage.getItem('tenantSlug'),
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
    setState({
      token,
      tenantName: null,
      tenantSlug: tenantSlug ?? localStorage.getItem('tenantSlug'),
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
    setState({ token: null, tenantName: null, tenantSlug: null, role: null, isAuthenticated: false })
  }

  if (!bootstrapped) return null

  return (
    <AuthContext.Provider value={{
      ...state,
      isAdmin: state.role === 'admin' || state.role === 'super-admin',
      isSuperAdmin: state.role === 'super-admin',
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
