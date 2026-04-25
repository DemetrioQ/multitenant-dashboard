import { apiClient } from './client'

export interface User {
  id: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
}

export interface UserProfile {
  userId: string
  email: string
  role: string
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
  bio: string | null
  isComplete: boolean
}

export interface UsersResult {
  items: User[]
  totalCount: number
  page: number
  pageSize: number
}

export const getUsers = (page = 1, pageSize = 20) =>
  apiClient.get<UsersResult>('/api/v1/users', { params: { page, pageSize } }).then((r) => r.data)

export const getMe = () => apiClient.get<UserProfile>('/api/v1/users/me').then((r) => r.data)

export const updateMe = (data: {
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
  bio: string | null
}) => apiClient.put('/api/v1/users/me', data)

export const updateUserRole = (id: string, role: string) =>
  apiClient.put(`/api/v1/users/${id}/role`, { role })

export const deactivateUser = (id: string) => apiClient.delete(`/api/v1/users/${id}`)
