import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { AuthProvider } from './contexts/AuthContext'
import { AppRouter } from './router'
import { queryClient, persister } from './lib/queryClient'
import { ToastProvider } from './components/ui'

export default function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 }}
    >
      <ToastProvider>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </ToastProvider>
    </PersistQueryClientProvider>
  )
}
