import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Layout } from '../components/Layout'
import { PageLoading } from '../components/PageStates'

// Eager imports — public + main tenant flow (hot path).
import { LoginPage } from '../pages/LoginPage'
import { VerifyEmailPage } from '../pages/VerifyEmailPage'
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage'
import { ResetPasswordPage } from '../pages/ResetPasswordPage'
import { AcceptInvitationPage } from '../pages/AcceptInvitationPage'
import { DashboardPage } from '../pages/DashboardPage'
import { ProductsPage } from '../pages/ProductsPage'
import { OrdersPage } from '../pages/OrdersPage'
import { OrderDetailPage } from '../pages/OrderDetailPage'
import { CustomersPage } from '../pages/CustomersPage'
import { CustomerDetailPage } from '../pages/CustomerDetailPage'
import { TeamPage } from '../pages/TeamPage'
import { TenantSettingsPage } from '../pages/TenantSettingsPage'
import { ProfilePage } from '../pages/ProfilePage'
import { AuditPage } from '../pages/AuditPage'

// Lazy imports — admin (super-admin only) + niche admin settings (separate chunks).
const AdminPage = lazy(() => import('../pages/AdminPage').then((m) => ({ default: m.AdminPage })))
const AdminTenantDetailPage = lazy(() =>
  import('../pages/AdminTenantDetailPage').then((m) => ({ default: m.AdminTenantDetailPage })),
)
const AdminAuditPage = lazy(() =>
  import('../pages/AdminAuditPage').then((m) => ({ default: m.AdminAuditPage })),
)
const AdminProductsPage = lazy(() =>
  import('../pages/AdminProductsPage').then((m) => ({ default: m.AdminProductsPage })),
)
const TenantsPage = lazy(() =>
  import('../pages/TenantsPage').then((m) => ({ default: m.TenantsPage })),
)
const PaymentsSettingsPage = lazy(() =>
  import('../pages/PaymentsSettingsPage').then((m) => ({ default: m.PaymentsSettingsPage })),
)
const EmailTemplatesPage = lazy(() =>
  import('../pages/EmailTemplatesPage').then((m) => ({ default: m.EmailTemplatesPage })),
)
const EmailTemplateEditorPage = lazy(() =>
  import('../pages/EmailTemplateEditorPage').then((m) => ({ default: m.EmailTemplateEditorPage })),
)

function ProtectedLayout() {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Layout />
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoading />}>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/accept-invitation" element={<AcceptInvitationPage />} />

          {/* Protected */}
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/new" element={<ProductsPage initialCreate />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/customers/:id" element={<CustomerDetailPage />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="/settings" element={<TenantSettingsPage />} />
            <Route path="/settings/profile" element={<ProfilePage />} />
            <Route path="/settings/payments" element={<PaymentsSettingsPage />} />
            <Route path="/settings/emails" element={<EmailTemplatesPage />} />
            <Route path="/settings/emails/:type" element={<EmailTemplateEditorPage />} />
            <Route path="/audit" element={<AuditPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/tenants/:id" element={<AdminTenantDetailPage />} />
            <Route path="/admin/products" element={<AdminProductsPage />} />
            <Route path="/admin/audit" element={<AdminAuditPage />} />
            {/* Legacy / compat */}
            <Route path="/tenants" element={<TenantsPage />} />
            <Route path="/users" element={<Navigate to="/team" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
