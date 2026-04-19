import { apiClient } from './client'
import type { OrderStatus } from './orders'

export interface CustomerSummary {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  isActive: boolean
  isEmailVerified: boolean
  orderCount: number
  lifetimeSpend: number
  createdAt: string
}

export interface CustomerOrderRef {
  id: string
  number: string
  status: OrderStatus
  total: number
  createdAt: string
}

export interface CustomerDetail extends CustomerSummary {
  orders: CustomerOrderRef[]
}

export interface CustomersResult {
  items: CustomerSummary[]
  totalCount: number
  page: number
  pageSize: number
}

export const getCustomers = (page = 1, pageSize = 20) =>
  apiClient
    .get<CustomersResult>('/api/v1/customers', { params: { page, pageSize } })
    .then((r) => r.data)

export const getCustomer = (id: string) =>
  apiClient.get<CustomerDetail>(`/api/v1/customers/${id}`).then((r) => r.data)
