import { apiClient } from './client'

export interface User {
  id: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
}

export const getUsers = () =>
  apiClient.get<User[]>('/api/users').then((r) => r.data)

export const updateUserRole = (id: string, role: string) =>
  apiClient.put(`/api/users/${id}/role`, { role })

export const deactivateUser = (id: string) =>
  apiClient.delete(`/api/users/${id}`)
