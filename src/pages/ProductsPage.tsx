import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Package, Pencil, Trash2, Power, ChevronLeft, ChevronRight, Camera } from 'lucide-react'
import { getProducts, createProduct, updateProduct, deleteProduct, setProductStatus, type Product } from '../api/products'
import { useAuth } from '../hooks/useAuth'
import { Modal } from '../components/Modal'
import { ImageCropModal } from '../components/ImageCropModal'
import { formatMoney, currencySymbol } from '../utils/format'

const PAGE_SIZE = 10

interface ProductForm {
  name: string
  description: string
  price: string
  stock: string
  imageUrl: string
}

const emptyForm: ProductForm = { name: '', description: '', price: '', stock: '', imageUrl: '' }

function ProductThumb({ src, size = 'sm' }: { src: string | null; size?: 'sm' | 'md' }) {
  const dim = size === 'md' ? 'w-14 h-14' : 'w-10 h-10'
  const icon = size === 'md' ? 'w-5 h-5' : 'w-4 h-4'
  if (!src) {
    return (
      <div className={`${dim} rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center flex-shrink-0`}>
        <Package className={`${icon} text-gray-600`} />
      </div>
    )
  }
  return (
    <img
      src={src}
      alt=""
      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
      className={`${dim} rounded-lg object-cover bg-gray-800 border border-gray-700 flex-shrink-0`}
    />
  )
}

function Badge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
      active
        ? 'bg-green-500/20 text-green-400 border-green-500/30'
        : 'bg-gray-800 text-gray-500 border-gray-700'
    }`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

// Defined outside ProductsPage so React doesn't treat it as a new type on every render
function ProductFormFields({
  form,
  onChange,
  symbol,
  onOpenImageUpload,
}: {
  form: ProductForm
  onChange: (f: ProductForm) => void
  symbol: string
  onOpenImageUpload: () => void
}) {
  const pricePadding = symbol.length > 1 ? 'pl-10' : 'pl-8'
  const hasImage = !!form.imageUrl
  return (
    <>
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-300">Name</label>
        <input
          type="text"
          required
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          placeholder="Widget Pro"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-300">Description</label>
        <textarea
          required
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
          placeholder="A short description"
          rows={3}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-300">
          Image <span className="text-gray-500 font-normal">(optional)</span>
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenImageUpload}
            className="relative group w-20 h-20 rounded-lg overflow-hidden border border-gray-700 bg-gray-800 flex items-center justify-center flex-shrink-0"
          >
            {hasImage ? (
              <img src={form.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <Package className="w-6 h-6 text-gray-600" />
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
              <Camera className="w-4 h-4 text-white" />
              <span className="text-white text-[10px] font-medium mt-0.5">{hasImage ? 'Change' : 'Upload'}</span>
            </div>
          </button>
          <div className="flex-1 min-w-0">
            <button
              type="button"
              onClick={onOpenImageUpload}
              className="text-sm text-indigo-400 hover:text-indigo-300 font-medium"
            >
              {hasImage ? 'Replace image' : 'Upload image'}
            </button>
            {hasImage && (
              <button
                type="button"
                onClick={() => onChange({ ...form, imageUrl: '' })}
                className="block text-xs text-gray-500 hover:text-red-400 mt-1 transition-colors"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-300">Price</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none select-none">{symbol}</span>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => onChange({ ...form, price: e.target.value })}
              placeholder="9.99"
              className={`w-full bg-gray-800 border border-gray-700 rounded-lg ${pricePadding} pr-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-300">Stock</label>
          <input
            type="number"
            required
            min="0"
            step="1"
            value={form.stock}
            onChange={(e) => onChange({ ...form, stock: e.target.value })}
            placeholder="100"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
    </>
  )
}

export function ProductsPage({ initialCreate = false }: { initialCreate?: boolean }) {
  const { isAdmin, tenantCurrency } = useAuth()
  const symbol = currencySymbol(tenantCurrency)
  const qc = useQueryClient()
  const [page, setPage] = useState(1)

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', page],
    queryFn: () => getProducts(page, PAGE_SIZE),
    placeholderData: (prev) => prev,
  })

  const products = data?.items ?? []
  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const hasCachedData = !!data
  const showSpinner = isLoading && !hasCachedData

  const invalidate = () => qc.invalidateQueries({ queryKey: ['products'] })

  const [showCreate, setShowCreate] = useState(initialCreate)
  const [createForm, setCreateForm] = useState<ProductForm>(emptyForm)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [editing, setEditing] = useState<Product | null>(null)
  const [editForm, setEditForm] = useState<ProductForm>(emptyForm)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const [imageUploadTarget, setImageUploadTarget] = useState<'create' | 'edit' | null>(null)

  const handleImageUploaded = (url: string) => {
    if (imageUploadTarget === 'edit') {
      setEditForm((prev) => ({ ...prev, imageUrl: url }))
    } else {
      setCreateForm((prev) => ({ ...prev, imageUrl: url }))
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateLoading(true)
    setCreateError(null)
    try {
      await createProduct({
        name: createForm.name,
        description: createForm.description,
        price: parseFloat(createForm.price),
        stock: parseInt(createForm.stock, 10),
        imageUrl: createForm.imageUrl.trim() || null,
      })
      setShowCreate(false)
      setCreateForm(emptyForm)
      setPage(1)
      invalidate()
    } catch (err: any) {
      setCreateError(err.response?.data?.detail ?? 'Failed to create product.')
    } finally {
      setCreateLoading(false)
    }
  }

  const openEdit = (product: Product) => {
    setEditing(product)
    setEditForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock.toString(),
      imageUrl: product.imageUrl ?? '',
    })
    setEditError(null)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    setEditLoading(true)
    setEditError(null)
    try {
      await updateProduct(editing.id, {
        name: editForm.name,
        description: editForm.description,
        price: parseFloat(editForm.price),
        stock: parseInt(editForm.stock, 10),
        imageUrl: editForm.imageUrl.trim() || null,
      })
      setEditing(null)
      invalidate()
    } catch (err: any) {
      setEditError(err.response?.data?.detail ?? 'Failed to update product.')
    } finally {
      setEditLoading(false)
    }
  }

  const handleToggleStatus = async (product: Product) => {
    const next = !product.isActive
    if (!confirm(`${next ? 'Activate' : 'Deactivate'} "${product.name}"?`)) return
    try {
      await setProductStatus(product.id, next)
      invalidate()
    } catch (err: any) {
      alert(err.response?.data?.detail ?? 'Failed to update product status.')
    }
  }

  const handleDelete = async (product: Product) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return
    try {
      await deleteProduct(product.id)
      invalidate()
    } catch (err: any) {
      alert(err.response?.data?.detail ?? 'Failed to delete product.')
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Products</h1>
          <p className="text-gray-400 mt-1 text-sm">
            {totalCount} product{totalCount !== 1 ? 's' : ''} in this tenant
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {error && (
        <div className="mb-4 text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-3">Failed to load products.</div>
      )}

      {showSpinner ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center py-20">
          <p className="text-gray-500 text-sm">Loading…</p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl flex flex-col items-center justify-center py-20 gap-3">
          <Package className="w-8 h-8 text-gray-700" />
          <p className="text-gray-500 text-sm">No products yet. Add your first product.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-800/40">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-white">
                      <div className="flex items-center gap-3">
                        <ProductThumb src={p.imageUrl} />
                        <span className="truncate">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400 max-w-xs truncate">{p.description}</td>
                    <td className="px-6 py-4 text-sm text-white font-mono whitespace-nowrap">{formatMoney(p.price, tenantCurrency)}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{p.stock}</td>
                    <td className="px-6 py-4"><Badge active={p.isActive} /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleToggleStatus(p)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              p.isActive
                                ? 'text-gray-400 hover:text-red-400 hover:bg-red-950/30'
                                : 'text-gray-400 hover:text-emerald-400 hover:bg-emerald-950/30'
                            }`}
                            title={p.isActive ? 'Deactivate' : 'Activate'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isAdmin && p.isActive && (
                          <button
                            onClick={() => handleDelete(p)}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {products.map((p) => (
              <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <ProductThumb src={p.imageUrl} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-white truncate">{p.name}</p>
                      <Badge active={p.isActive} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{p.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      <span className="text-white font-mono">{formatMoney(p.price, tenantCurrency)}</span>
                      <span className="text-gray-500">Stock: {p.stock}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-gray-800">
                  <button
                    onClick={() => openEdit(p)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleToggleStatus(p)}
                      className={`p-2 rounded-lg transition-colors ${
                        p.isActive
                          ? 'text-gray-400 hover:text-red-400 hover:bg-red-950/30'
                          : 'text-gray-400 hover:text-emerald-400 hover:bg-emerald-950/30'
                      }`}
                      title={p.isActive ? 'Deactivate' : 'Activate'}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                  )}
                  {isAdmin && p.isActive && (
                    <button
                      onClick={() => handleDelete(p)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-400">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {showCreate && (
        <Modal title="Add Product" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <ProductFormFields
              form={createForm}
              onChange={setCreateForm}
              symbol={symbol}
              onOpenImageUpload={() => setImageUploadTarget('create')}
            />
            {createError && (
              <p className="text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">{createError}</p>
            )}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowCreate(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={createLoading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
                {createLoading ? 'Creating…' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {editing && (
        <Modal title="Edit Product" onClose={() => setEditing(null)}>
          <form onSubmit={handleEdit} className="space-y-4">
            <ProductFormFields
              form={editForm}
              onChange={setEditForm}
              symbol={symbol}
              onOpenImageUpload={() => setImageUploadTarget('edit')}
            />
            {editError && (
              <p className="text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">{editError}</p>
            )}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditing(null)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={editLoading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
                {editLoading ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <ImageCropModal
        open={imageUploadTarget !== null}
        onClose={() => setImageUploadTarget(null)}
        onUpload={handleImageUploaded}
        title="Product image"
        route="productImageUploader"
        cropShape="rect"
        aspect={1}
        fileNamePrefix="product"
        maxSizeLabel="Max 4 MB"
      />
    </div>
  )
}
