import axios from 'axios'

// Empty base URL = relative requests, proxied by Vite to the API in dev.
// In production set VITE_API_URL_BROWSER if frontend and API are on different domains.
export const BASE_URL = import.meta.env.VITE_API_URL_BROWSER ?? ''

export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
})

apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true

      try {
        const { data } = await axios.post(
          `${BASE_URL}/api/auth/refresh`,
          null,
          { withCredentials: true }
        )
        sessionStorage.setItem('token', data.jwtToken)
        original.headers.Authorization = `Bearer ${data.jwtToken}`
        return apiClient(original)
      } catch {
        sessionStorage.removeItem('token')
        localStorage.removeItem('tenantSlug')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)
