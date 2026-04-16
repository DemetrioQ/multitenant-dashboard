import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Layout } from '../components/Layout'
import { LoginPage } from '../pages/LoginPage'
import { VerifyEmailPage } from '../pages/VerifyEmailPage'
import { DashboardPage } from '../pages/DashboardPage'
import { TenantsPage } from '../pages/TenantsPage'
import { ProductsPage } from '../pages/ProductsPage'
import { UsersPage } from '../pages/UsersPage'

function ProtectedLayout() {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Layout />
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tenants"   element={<TenantsPage />} />
          <Route path="/products"  element={<ProductsPage />} />
          <Route path="/users"     element={<UsersPage />} />
          <Route path="*"          element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
