import { apiClient } from './client'

export interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number
  isActive: boolean
}

export interface ProductsResult {
  products: Product[]
  totalCount: number
}

export const getProducts = (page = 1, pageSize = 10) =>
  apiClient
    .get<ProductsResult>('/api/products', { params: { page, pageSize } })
    .then((r) => r.data)

export const getProduct = (id: string) =>
  apiClient.get<Product>(`/api/products/${id}`).then((r) => r.data)

export const createProduct = (data: { name: string; description: string; price: number; stock: number }) =>
  apiClient.post<{ productId: string }>('/api/products', data).then((r) => r.data)

export const updateProduct = (
  id: string,
  data: { name: string; description: string; price: number; stock: number }
) => apiClient.put(`/api/products/${id}`, data)

export const deleteProduct = (id: string) => apiClient.delete(`/api/products/${id}`)
