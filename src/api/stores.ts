import { BASE_URL } from './client'

export interface StoreEntry {
  name: string
  slug: string
  storeUrl: string
}

export interface StoresResult {
  items: StoreEntry[]
  totalCount: number
  page: number
  pageSize: number
}

// Public endpoint — no auth, no token. Uses raw fetch to avoid the interceptor
// attaching a stale Authorization header or triggering a refresh on failure.
export async function getStores(page = 1, pageSize = 50): Promise<StoresResult> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  const res = await fetch(`${BASE_URL}/api/v1/stores?${params}`)
  if (!res.ok) throw new Error(`stores request failed: ${res.status}`)
  return res.json()
}
