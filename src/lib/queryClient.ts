import { QueryClient } from '@tanstack/react-query'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

export const PERSIST_KEY = 'sd-query-cache'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 1000 * 60 * 60 * 24,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: PERSIST_KEY,
})

export function clearQueryCache() {
  queryClient.clear()
  try {
    window.localStorage.removeItem(PERSIST_KEY)
  } catch {
    // ignore
  }
}
