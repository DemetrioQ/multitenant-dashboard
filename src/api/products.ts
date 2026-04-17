import { apiClient } from './client'

export interface Product {
  id: string
  tenantId: string
  name: string
  description: string
  price: number
  stock: number
  isActive: boolean
}

export interface ProductsResult {
  items: Product[]
  totalCount: number
  page: number
  pageSize: number
}

export const getProducts = (page = 1, pageSize = 10) =>
  apiClient
    .get<ProductsResult>('/api/v1/products', { params: { page, pageSize } })
    .then((r) => r.data)

export const getProduct = (id: string) =>
  apiClient.get<Product>(`/api/v1/products/${id}`).then((r) => r.data)

export const createProduct = (data: { name: string; description: string; price: number; stock: number }) =>
  apiClient.post<{ productId: string }>('/api/v1/products', data).then((r) => r.data)

export const updateProduct = (
  id: string,
  data: { name: string; description: string; price: number; stock: number }
) => apiClient.put(`/api/v1/products/${id}`, data)

export const setProductStatus = (id: string, isActive: boolean) =>
  apiClient.put(`/api/v1/products/${id}/status`, { isActive })

export const deleteProduct = (id: string) => apiClient.delete(`/api/v1/products/${id}`)
