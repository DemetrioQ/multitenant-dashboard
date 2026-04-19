import { apiClient } from './client'

export type OrderStatus = 'pending' | 'paid' | 'fulfilled' | 'canceled' | 'refunded'

export interface OrderSummary {
  id: string
  number: string
  status: OrderStatus
  customerId: string
  customerEmail: string
  customerName: string
  total: number
  itemCount: number
  createdAt: string
}

export interface OrderLineItem {
  productId: string
  productName: string
  productSlug: string
  productSku: string | null
  unitPrice: number
  quantity: number
  lineTotal: number
}

export interface OrderCustomer {
  id: string
  email: string
  firstName: string
  lastName: string
}

export interface OrderDetail {
  id: string
  number: string
  status: OrderStatus
  customer: OrderCustomer
  subtotal: number
  total: number
  paymentProvider: string | null
  shippingLine1: string
  shippingLine2: string | null
  shippingCity: string
  shippingRegion: string | null
  shippingPostalCode: string
  shippingCountry: string
  items: OrderLineItem[]
  createdAt: string
  paidAt: string | null
  fulfilledAt: string | null
  canceledAt: string | null
}

export interface OrdersResult {
  items: OrderSummary[]
  totalCount: number
  page: number
  pageSize: number
}

export const getOrders = (
  params: { page?: number; pageSize?: number; status?: OrderStatus } = {},
) => {
  const query: Record<string, string | number> = {
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
  }
  if (params.status) query.status = params.status
  return apiClient.get<OrdersResult>('/api/v1/orders', { params: query }).then((r) => r.data)
}

export const getOrder = (id: string) =>
  apiClient.get<OrderDetail>(`/api/v1/orders/${id}`).then((r) => r.data)

export const fulfillOrder = (id: string) =>
  apiClient.post<OrderDetail>(`/api/v1/orders/${id}/fulfill`).then((r) => r.data)

export const cancelOrder = (id: string) =>
  apiClient.post<OrderDetail>(`/api/v1/orders/${id}/cancel`).then((r) => r.data)
