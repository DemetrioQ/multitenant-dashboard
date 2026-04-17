export const BASE_URL = import.meta.env.VITE_API_URL_BROWSER ?? ''

export class ApiError extends Error {
  response: { status: number; data: any; headers: Record<string, string> }

  constructor(status: number, data: any, headers: Record<string, string>) {
    super(`Request failed with status ${status}`)
    this.response = { status, data, headers }
  }
}

// Prevent concurrent or repeated refresh attempts
let refreshPromise: Promise<string> | null = null
let refreshFailed = false

function doRefresh(): Promise<string> {
  if (refreshFailed) return Promise.reject(new Error('refresh already failed'))
  if (refreshPromise) return refreshPromise

  refreshPromise = fetch(`${BASE_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
    .then(async (res) => {
      if (!res.ok) throw new Error()
      const data = await res.json()
      sessionStorage.setItem('token', data.jwtToken)
      refreshFailed = false
      return data.jwtToken as string
    })
    .catch((err) => {
      refreshFailed = true
      sessionStorage.removeItem('token')
      localStorage.removeItem('tenantSlug')
      throw err
    })
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

/** Call after a successful login to re-enable refresh attempts. */
export function resetRefreshState() {
  refreshFailed = false
  refreshPromise = null
}

async function send<T>(
  method: string,
  url: string,
  body?: unknown,
  params?: Record<string, string | number>,
  isRetry = false,
): Promise<{ data: T }> {
  let path = BASE_URL + url
  if (params && Object.keys(params).length > 0) {
    path += '?' + new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)]),
    )
  }

  const headers: Record<string, string> = {}
  const token = sessionStorage.getItem('token')
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (body != null) headers['Content-Type'] = 'application/json'

  const res = await fetch(path, {
    method,
    credentials: 'include',
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  })

  const resHeaders = Object.fromEntries(res.headers.entries())
  const text = await res.text()
  const data = text ? JSON.parse(text) : undefined

  if (!res.ok) {
    if (res.status === 401 && token && !isRetry) {
      try {
        await doRefresh()
        return send<T>(method, url, body, params, true)
      } catch {
        window.location.href = '/login'
        return new Promise(() => {})
      }
    }
    throw new ApiError(res.status, data, resHeaders)
  }

  return { data: data as T }
}

export const apiClient = {
  get: <T>(url: string, options?: { params?: Record<string, string | number> }) =>
    send<T>('GET', url, undefined, options?.params),
  post: <T>(url: string, body?: unknown) =>
    send<T>('POST', url, body),
  put: <T>(url: string, body?: unknown) =>
    send<T>('PUT', url, body),
  delete: <T>(url: string) =>
    send<T>('DELETE', url),
}
