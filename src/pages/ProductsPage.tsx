import { useEffect, useState } from 'react'
import { Plus, Package, Pencil, Trash2, Power, ChevronLeft, ChevronRight } from 'lucide-react'
import { getProducts, createProduct, updateProduct, deleteProduct, setProductStatus, type Product } from '../api/products'
import { useAuth } from '../hooks/useAuth'
import { Modal } from '../components/Modal'

const PAGE_SIZE = 10

interface ProductForm {
  name: string
  description: string
  price: string
  stock: string
}

const emptyForm: ProductForm = { name: '', description: '', price: '', stock: '' }

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
}: {
  form: ProductForm
  onChange: (f: ProductForm) => void
}) {
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
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-300">Price</label>
          <input
            type="number"
            required
            min="0"
            step="0.01"
            value={form.price}
            onChange={(e) => onChange({ ...form, price: e.target.value })}
            placeholder="9.99"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
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
  const { isAdmin } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showCreate, setShowCreate] = useState(initialCreate)
  const [createForm, setCreateForm] = useState<ProductForm>(emptyForm)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [editing, setEditing] = useState<Product | null>(null)
  const [editForm, setEditForm] = useState<ProductForm>(emptyForm)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const load = (p: number) => {
    setLoading(true)
    getProducts(p, PAGE_SIZE)
      .then((data) => {
        setProducts(data.items)
        setTotalCount(data.totalCount)
      })
      .catch(() => setError('Failed to load products.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(page) }, [page])

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
      })
      setShowCreate(false)
      setCreateForm(emptyForm)
      setPage(1)
      load(1)
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
      })
      setEditing(null)
      load(page)
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
      load(page)
    } catch (err: any) {
      alert(err.response?.data?.detail ?? 'Failed to update product status.')
    }
  }

  const handleDelete = async (product: Product) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return
    try {
      await deleteProduct(product.id)
      load(page)
    } catch (err: any) {
      alert(err.response?.data?.detail ?? 'Failed to delete product.')
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
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
        <div className="mb-4 text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-3">{error}</div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-gray-500 text-sm">Loading…</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Package className="w-8 h-8 text-gray-700" />
            <p className="text-gray-500 text-sm">No products yet. Add your first product.</p>
          </div>
        ) : (
          <table className="w-full">
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
                  <td className="px-6 py-4 text-sm font-medium text-white">{p.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-400 max-w-xs truncate">{p.description}</td>
                  <td className="px-6 py-4 text-sm text-white font-mono">${p.price.toFixed(2)}</td>
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
        )}
      </div>

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
            <ProductFormFields form={createForm} onChange={setCreateForm} />
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
            <ProductFormFields form={editForm} onChange={setEditForm} />
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
    </div>
  )
}
