import React, { useEffect, useRef, useState } from 'react'
import { apiFetch, formatCurrency } from '../../../utils/api.js'
import { Badge, Card, PageHeader, FilterBar, TableWrap, TblAction, Pagination, Btn, Loading, Modal, FormGroup, Input, Select, Textarea, Tabs } from '../../ui/index.jsx'
import { showToast } from '../../ui/index.jsx'
import EditableCell from '../../ui/EditableCell.jsx'
import ImportModal from '../../ui/ImportModal.jsx'

const CAT_EMOJI = { gifts: '🎁', flowers: '🌸', cakes: '🎂', hampers: '🧺' }

const CATEGORY_OPTS = [
  { v: 'gifts',   l: 'Gifts' },
  { v: 'flowers', l: 'Flowers' },
  { v: 'cakes',   l: 'Cakes' },
  { v: 'hampers', l: 'Hampers' },
]
const STATUS_OPTS = [
  { v: 'active',   l: 'Active' },
  { v: 'inactive', l: 'Inactive' },
]

const productPrice = p => p.basePrice ?? p.price ?? 0
const productStock = p => p.stockQuantity ?? p.stock ?? 0

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [pagination, setPag]    = useState({ total: 0, page: 1, limit: 24 })
  const [loading, setLoading]   = useState(true)
  const [view, setView]         = useState('grid')
  const [showAdd, setShowAdd]   = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [showImport, setShowImport] = useState(false)
  const [showBulk, setShowBulk] = useState(false)
  const [selected, setSelected] = useState(() => new Set())
  const [filters, setFilters]   = useState({ search: '', category: '', status: '' })
  const debounceRef = useRef(null)

  async function load(override = {}) {
    const page    = override.page    ?? pagination.page
    const limit   = override.limit   ?? pagination.limit
    const search  = override.search   ?? filters.search
    const category = override.category ?? filters.category
    const status  = override.status   ?? filters.status

    setLoading(true)
    const qp = new URLSearchParams()
    qp.set('page', page)
    qp.set('limit', limit)
    if (search)   qp.set('search', search)
    if (category) qp.set('category', category)
    if (status)   qp.set('status', status)

    try {
      const res = await apiFetch('GET', '/admin/products?' + qp.toString())
      setProducts(res.data?.products || [])
      setPag(res.pagination || { total: res.data?.products?.length || 0, page, limit })
    } catch (err) {
      setProducts([])
      showToast(err.message || 'Failed to load products.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => load({ page: 1 }), 300)
    return () => clearTimeout(debounceRef.current)
  }, [filters.search, filters.category, filters.status])

  useEffect(() => {
    apiFetch('GET', '/admin/products/categories')
      .then(res => setCategories(res.data?.categories || []))
      .catch(() => {  })
  }, [])

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }
  function toggleSelectAll() {
    const all = products.every(p => selected.has(p._id)) && products.length > 0
    setSelected(all ? new Set() : new Set(products.map(p => p._id)))
  }
  function clearSelection() {
    setSelected(new Set())
  }

  async function deleteProduct(id) {
    if (!confirm('Delete this product?')) return
    try {
      await apiFetch('DELETE', `/admin/products/${id}`)
      showToast('Product deleted.')
      load()
    } catch (err) {
      showToast(err.message || 'Delete failed.', 'error')
    }
  }

  async function saveProductField(id, patch) {
    await apiFetch('PUT', `/admin/products/${id}`, patch)
    setProducts(ps => ps.map(p => p._id === id ? { ...p, ...patch } : p))
  }

  async function exportCSV() {
    try {
      const qp = new URLSearchParams()
      qp.set('page', 1)
      qp.set('limit', 5000)
      if (filters.search)   qp.set('search', filters.search)
      if (filters.category) qp.set('category', filters.category)
      if (filters.status)   qp.set('status', filters.status)
      const res = await apiFetch('GET', '/admin/products?' + qp.toString())
      const rows = res.data?.products || []
      if (rows.length === 0) {
        showToast('No records to export.', 'info')
        return
      }

      const headers = ['Product Name', 'SKU', 'Price', 'Stock Quantity', 'Category', 'Status', 'Description']
      const esc = v => {
        const s = v === null || v === undefined ? '' : String(v)
        return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
      }
      const lines = [headers.map(esc).join(',')]
      for (const p of rows) {
        lines.push([
          p.name,
          p.sku,
          productPrice(p),
          productStock(p),
          p.category,
          p.status,
          p.description,
        ].map(esc).join(','))
      }

      const csv = '\uFEFF' + lines.join('\r\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'products-export.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      showToast(`Exported ${rows.length} record${rows.length === 1 ? '' : 's'}.`)
    } catch (err) {
      showToast(err.message || 'Export failed.', 'error')
    }
  }

  function openImport() { setShowImport(true) }

  return (
    <div>
      <PageHeader title="Product Catalog" subtitle={`${pagination.total} products`}>
        <Tabs tabs={[{ id: 'grid', label: 'Grid' }, { id: 'list', label: 'List' }]} active={view} onChange={setView} />
        {selected.size > 0 && (
          <Btn size="sm" variant="primary" onClick={() => setShowBulk(true)}>
            ✎ Bulk edit ({selected.size})
          </Btn>
        )}
        <Btn size="sm" onClick={openImport} title="Import products from CSV or Excel">↑ Import</Btn>
        <Btn size="sm" onClick={exportCSV} title="Export catalog to CSV">↓ Export</Btn>
        <Btn variant="primary" onClick={() => setShowAdd(true)}>+ Add Product</Btn>
      </PageHeader>

      <FilterBar
        fields={[
          { key: 'search', placeholder: 'Search products…' },
          {
            key: 'category', type: 'select', placeholder: 'All Categories',
            options: Array.from(new Set([
              ...CATEGORY_OPTS.map(o => o.v),
              ...categories,
            ])).filter(Boolean).sort().map(v => ({ v, l: CATEGORY_OPTS.find(o => o.v === v)?.l || v })),
          },
          { key: 'status',   type: 'select', placeholder: 'All Statuses',   options: STATUS_OPTS },
        ]}
        values={filters}
        onChange={(k, v) => setFilters(f => ({ ...f, [k]: v }))}
        onClear={() => setFilters({ search: '', category: '', status: '' })}
      />

      {loading ? <Loading /> : products.length === 0 ? (
        <Card><div className="py-6 text-center text-text2 text-sm">No records found.</div></Card>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
          {products.map(p => (
            <div key={p._id} className="bg-surface border border-border rounded-lg overflow-hidden hover:shadow-card hover:border-border2 transition-all duration-150">
              <div className="h-[120px] bg-gradient-to-br from-accent-light to-surface2 flex items-center justify-center text-[32px] overflow-hidden">
                {p.images?.[0]
                  ? <img src={p.images?.[0]} alt={p.name} className="w-full h-full object-cover" />
                  : (CAT_EMOJI[p.category] || '📦')
                }
              </div>
              <div className="p-3">
                <div className="text-[13px] font-medium mb-1">{p.name}</div>
                <div className="font-mono text-[11px] text-text3">{p.sku}</div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[14px] font-semibold">{formatCurrency(productPrice(p))}</span>
                  <Badge status={p.status} />
                </div>
                <div className="text-[11px] text-text2 mt-1">Stock: {productStock(p)}</div>
                <div className="flex gap-1.5 mt-2">
                  <TblAction onClick={() => setEditProduct(p)} title="Edit product">Edit</TblAction>
                  <TblAction variant="danger" onClick={() => deleteProduct(p._id)} title="Delete product">Delete</TblAction>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card noPad>
          <TableWrap>
            <thead>
              <tr>
                <th style={{ width: 32 }}>
                  <input
                    type="checkbox"
                    checked={products.length > 0 && products.every(p => selected.has(p._id))}
                    onChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </th>
                <th>Name</th><th>SKU</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p._id} className={selected.has(p._id) ? 'bg-accent-light' : ''}>
                  <td data-label="Select">
                    <input
                      type="checkbox"
                      checked={selected.has(p._id)}
                      onChange={() => toggleSelect(p._id)}
                      aria-label={`Select ${p.name}`}
                    />
                  </td>
                  <td data-label="Name" className="font-medium">
                    <EditableCell
                      value={p.name}
                      onSave={async (v) => { await saveProductField(p._id, { name: v }) }}
                    />
                  </td>
                  <td data-label="SKU"><span className="font-mono text-[12px]">{p.sku}</span></td>
                  <td data-label="Category">
                    <EditableCell
                      value={p.category || ''}
                      mode="select"
                      options={[{ value: '', label: '—' }, ...CATEGORY_OPTS.map(o => ({ value: o.v, label: o.l }))]}
                      render={v => v ? (CATEGORY_OPTS.find(o => o.v === v)?.l || v) : '—'}
                      onSave={async (v) => { await saveProductField(p._id, { category: v || undefined }) }}
                    />
                  </td>
                  <td data-label="Price">
                    <EditableCell
                      value={productPrice(p)}
                      mode="number"
                      render={v => formatCurrency(v)}
                      onSave={async (v) => { await saveProductField(p._id, { basePrice: v }) }}
                    />
                  </td>
                  <td data-label="Stock">
                    <EditableCell
                      value={productStock(p)}
                      mode="number"
                      onSave={async (v) => { await saveProductField(p._id, { stockQuantity: v }) }}
                    />
                  </td>
                  <td data-label="Status">
                    <EditableCell
                      value={p.status || 'active'}
                      mode="select"
                      options={STATUS_OPTS.map(o => ({ value: o.v, label: o.l }))}
                      render={v => <Badge status={v} />}
                      onSave={async (v) => { await saveProductField(p._id, { status: v }) }}
                    />
                  </td>
                  <td data-label="Actions">
                    <div className="flex gap-1.5 flex-wrap">
                      <TblAction onClick={() => setEditProduct(p)} title="Edit product">Edit</TblAction>
                      <TblAction variant="danger" onClick={() => deleteProduct(p._id)} title="Delete product">Delete</TblAction>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Card>
      )}

      <Pagination
        total={pagination.total}
        page={pagination.page}
        limit={pagination.limit}
        onPageChange={p => load({ page: p })}
        onLimitChange={l => load({ page: 1, limit: l })}
      />

      {showAdd && (
        <AddProductModal
          existingCategories={categories}
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); load({ page: 1 }) }}
        />
      )}

      {editProduct && (
        <EditProductModal
          product={editProduct}
          existingCategories={categories}
          onClose={() => setEditProduct(null)}
          onSaved={() => { setEditProduct(null); load({ page: 1 }) }}
        />
      )}

      {showImport && (
        <ImportModal
          title="Import Products"
          previewPath="/admin/products/import/preview"
          importPath="/admin/products/import"
          templatePath="/admin/products/import/template"
          columns={[
            { key: 'sku', label: 'SKU' },
            { key: 'name', label: 'Name' },
            { key: 'category', label: 'Category' },
            { key: 'basePrice', label: 'Price' },
            { key: 'stockQuantity', label: 'Stock' },
          ]}
          onClose={() => setShowImport(false)}
          onDone={() => { setShowImport(false); load({ page: 1 }) }}
        />
      )}

      {showBulk && (
        <BulkEditProductsModal
          ids={Array.from(selected)}
          onClose={() => setShowBulk(false)}
          onDone={() => {
            setShowBulk(false)
            clearSelection()
            load({ page: 1 })
          }}
        />
      )}
    </div>
  )
}

function BulkEditProductsModal({ ids, onClose, onDone }) {
  const [patch, setPatch] = useState({ basePrice: '', stockQuantity: '', status: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  function buildPatch() {
    const out = {}
    if (patch.basePrice !== '') {
      const n = Number(patch.basePrice)
      if (!Number.isFinite(n) || n < 0) return { err: 'Price must be a non-negative number.' }
      out.basePrice = n
    }
    if (patch.stockQuantity !== '') {
      const n = Number(patch.stockQuantity)
      if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
        return { err: 'Stock must be a non-negative whole number.' }
      }
      out.stockQuantity = n
    }
    if (patch.status) out.status = patch.status
    return { out }
  }

  async function submit() {
    const { out, err } = buildPatch()
    if (err) { setError(err); return }
    if (!out || Object.keys(out).length === 0) {
      setError('Fill at least one field to apply.')
      return
    }

    setSaving(true); setError('')
    try {
      const res = await apiFetch('POST', '/admin/products/bulk-update', { ids, patch: out })
      const n = res.data?.modified ?? 0
      showToast(`Updated ${n} product${n === 1 ? '' : 's'}.`)
      onDone()
    } catch (err) {
      setError(err.message || 'Bulk update failed.')
      setSaving(false)
    }
  }

  return (
    <Modal
      title={`Bulk edit · ${ids.length} product${ids.length === 1 ? '' : 's'}`}
      onClose={saving ? () => {} : onClose}
      actions={[
        { label: saving ? 'Saving…' : 'Apply to all', primary: true, onClick: saving ? () => {} : submit },
        { label: 'Cancel', onClick: saving ? () => {} : onClose },
      ]}
    >
      {error && <div className="mb-3 p-2.5 rounded border border-red-200 bg-red-50 text-red-700 text-[12px]">{error}</div>}
      <div className="text-[12px] text-text2 mb-3">
        Leave any field blank to keep its current value. Only the fields you set will be changed on all selected products.
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormGroup label="Set Base Price">
          <Input type="number" min="0" step="0.01" value={patch.basePrice}
            onChange={e => setPatch(p => ({ ...p, basePrice: e.target.value }))}
            placeholder="Leave blank to skip" />
        </FormGroup>
        <FormGroup label="Set Stock Quantity">
          <Input type="number" min="0" step="1" value={patch.stockQuantity}
            onChange={e => setPatch(p => ({ ...p, stockQuantity: e.target.value }))}
            placeholder="Leave blank to skip" />
        </FormGroup>
      </div>
      <FormGroup label="Set Status">
        <Select value={patch.status} onChange={e => setPatch(p => ({ ...p, status: e.target.value }))}>
          <option value="">— Don't change —</option>
          {STATUS_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </Select>
      </FormGroup>
    </Modal>
  )
}

function AddProductModal({ onClose, onSaved, existingCategories = [] }) {
  const [form, setForm] = useState({
    name: '', sku: '', price: '', stock: '',
    category: '', categoryCustom: '',
    status: 'active', description: '',
    lowStockThreshold: 10,
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [tiers, setTiers] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB.'); return }
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = ev => setImagePreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const catOptions = Array.from(new Set([
    ...CATEGORY_OPTS.map(o => o.v),
    ...existingCategories,
  ])).filter(Boolean).sort()

  function addTier() {
    setTiers(ts => [...ts, { label: `Tier ${ts.length + 1}`, minQty: '', price: '' }])
  }
  function updateTier(i, patch) {
    setTiers(ts => ts.map((t, idx) => idx === i ? { ...t, ...patch } : t))
  }
  function removeTier(i) {
    setTiers(ts => ts.filter((_, idx) => idx !== i))
  }

  async function save() {
    setError('')

    const name        = form.name.trim()
    const sku         = form.sku.trim()
    const description = form.description.trim()

    if (!name || !sku || form.price === '' || form.stock === '') {
      setError('Please fill all required fields.')
      return
    }
    const price = Number(form.price)
    if (Number.isNaN(price) || price < 0) {
      setError('Price must be 0 or greater.')
      return
    }
    const stock = Number(form.stock)
    if (Number.isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
      setError('Stock Quantity must be a whole number 0 or greater.')
      return
    }

    const tierPayload = []
    for (let i = 0; i < tiers.length; i++) {
      const t = tiers[i]
      const mq = Number(t.minQty), tp = Number(t.price)
      const hasAny = t.minQty !== '' || t.price !== '' || (t.label && t.label.trim())
      const isEmpty = !hasAny
      if (isEmpty) continue
      if (!Number.isFinite(mq) || mq < 1 || !Number.isInteger(mq)) {
        setError(`Tier ${i + 1}: minimum quantity must be a whole number ≥ 1.`); return
      }
      if (!Number.isFinite(tp) || tp < 0) {
        setError(`Tier ${i + 1}: price must be a non-negative number.`); return
      }
      tierPayload.push({ label: t.label?.trim() || undefined, minQty: mq, price: tp })
    }
    tierPayload.sort((a, b) => b.minQty - a.minQty)

    const finalCategory = form.category === '__new__'
      ? form.categoryCustom.trim() || undefined
      : (form.category || undefined)

    const payload = {
      name, sku,
      basePrice: price,
      stockQuantity: stock,
      category: finalCategory,
      status: form.status,
      description,
      lowStockThreshold: Number(form.lowStockThreshold) || 10,
      pricingTiers: tierPayload,
    }

    try {
      setSaving(true)
      if (imageFile) {
        const fd = new FormData()
        fd.append('image', imageFile)
        Object.entries(payload).forEach(([k, v]) =>
          fd.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v ?? ''))
        )
        await apiFetch('POST', '/admin/products', fd, true)
      } else {
        await apiFetch('POST', '/admin/products', payload)
      }
      showToast('Product added successfully.')
      onSaved()
    } catch (err) {
      const msg = err?.message || 'Failed to save product.'
      setError(msg)
      showToast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title="Add Product"
      size="lg"
      onClose={saving ? () => {} : onClose}
      actions={[
        { label: saving ? 'Adding…' : 'Add Product', primary: true, onClick: saving ? () => {} : save },
        { label: 'Cancel', onClick: saving ? () => {} : onClose },
      ]}
    >
      {error && <div className="mb-3 text-[12px] text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}

      <FormGroup label="Product Image (optional)">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-lg border border-border bg-surface2 flex items-center justify-center overflow-hidden flex-shrink-0">
            {imagePreview
              ? <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
              : <span className="text-2xl">{CAT_EMOJI[form.category] || '📦'}</span>
            }
          </div>
          <div>
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-border text-[12px] text-text2 hover:bg-surface2 transition-colors">
              📷 Choose image
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
            {imageFile && (
              <button type="button" onClick={() => { setImageFile(null); setImagePreview(null) }}
                className="ml-2 text-[11px] text-red-500 hover:text-red-700">✕ Remove</button>
            )}
            <div className="text-[11px] text-text3 mt-1">JPG, PNG, WebP · max 5MB</div>
          </div>
        </div>
      </FormGroup>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
        <FormGroup label="Product Name *">
          <Input value={form.name} onChange={set('name')} placeholder="e.g. Chocolate Cake 1kg" />
        </FormGroup>
        <FormGroup label="SKU *">
          <Input value={form.sku} onChange={set('sku')} placeholder="e.g. CK-001" />
        </FormGroup>
        <FormGroup label="Base Price (₹) *">
          <Input type="number" min="0" step="0.01" value={form.price} onChange={set('price')} placeholder="0.00" />
        </FormGroup>
        <FormGroup label="Stock Quantity *">
          <Input type="number" min="0" step="1" value={form.stock} onChange={set('stock')} placeholder="0" />
        </FormGroup>
        <FormGroup label="Category">
          <Select value={form.category} onChange={set('category')}>
            <option value="">— None —</option>
            {catOptions.map(c => <option key={c} value={c}>{CATEGORY_OPTS.find(o => o.v === c)?.l || c}</option>)}
            <option value="__new__">+ Add new category…</option>
          </Select>
        </FormGroup>
        <FormGroup label="Status">
          <Select value={form.status} onChange={set('status')}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </FormGroup>
      </div>

      {form.category === '__new__' && (
        <FormGroup label="New Category Name">
          <Input value={form.categoryCustom} onChange={set('categoryCustom')} placeholder="e.g. Hampers" />
        </FormGroup>
      )}

      <FormGroup label="Description">
        <Textarea value={form.description} onChange={set('description')} rows={2} placeholder="Optional product description" />
      </FormGroup>

      <div className="mt-4 border border-border rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-[13px] font-semibold">Pricing Tiers (optional)</div>
            <div className="text-[11px] text-text2">Volume-based pricing. The highest matching tier wins at checkout.</div>
          </div>
          <Btn size="sm" onClick={addTier}>+ Add tier</Btn>
        </div>

        {tiers.length === 0 ? (
          <div className="text-[12px] text-text3 text-center py-3">No tiers — base price applies to every quantity.</div>
        ) : (
          <div className="space-y-2">
            {tiers.map((t, i) => (
              <div key={i} className="grid grid-cols-[1.5fr_1fr_1fr_auto] gap-2 items-center">
                <Input
                  value={t.label}
                  onChange={e => updateTier(i, { label: e.target.value })}
                  placeholder={`e.g. Bronze / Silver / Gold`}
                />
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={t.minQty}
                  onChange={e => updateTier(i, { minQty: e.target.value })}
                  placeholder="Min qty"
                />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={t.price}
                  onChange={e => updateTier(i, { price: e.target.value })}
                  placeholder="Unit price"
                />
                <button
                  type="button"
                  onClick={() => removeTier(i)}
                  className="text-red-600 hover:bg-red-50 px-2 py-1 rounded text-[12px]"
                  title="Remove tier"
                >
                  ✗
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}

function EditProductModal({ product, onClose, onSaved, existingCategories = [] }) {
  const [form, setForm] = useState({
    name: product.name || '',
    sku: product.sku || '',
    price: String(product.basePrice ?? product.price ?? ''),
    stock: String(product.stockQuantity ?? product.stock ?? ''),
    category: product.category || '',
    categoryCustom: '',
    status: product.status || 'active',
    description: product.description || '',
    lowStockThreshold: product.lowStockThreshold ?? 10,
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(product.images?.[0] || null)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB.'); return }
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = ev => setImagePreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  async function save() {
    setError('')
    const name = form.name.trim()
    const sku  = form.sku.trim()
    if (!name || !sku) { setError('Name and SKU are required.'); return }
    const price = Number(form.price)
    if (Number.isNaN(price) || price < 0) { setError('Price must be 0 or greater.'); return }
    const stock = Number(form.stock)
    if (Number.isNaN(stock) || stock < 0) { setError('Stock must be 0 or greater.'); return }

    const finalCategory = form.category === '__new__'
      ? (form.categoryCustom.trim() || undefined)
      : (form.category || undefined)

    const payload = {
      name, sku,
      basePrice: price,
      stockQuantity: stock,
      category: finalCategory,
      status: form.status,
      description: form.description,
      lowStockThreshold: Number(form.lowStockThreshold) || 10,
    }

    try {
      setSaving(true)
      if (imageFile) {
        const fd = new FormData()
        fd.append('image', imageFile)
        Object.entries(payload).forEach(([k, v]) => fd.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v ?? '')))
        await apiFetch('PUT', `/admin/products/${product._id}`, fd, true)
      } else {
        await apiFetch('PUT', `/admin/products/${product._id}`, payload)
      }
      showToast('Product updated successfully.')
      onSaved()
    } catch (err) {
      setError(err?.message || 'Failed to update product.')
    } finally {
      setSaving(false)
    }
  }

  const cats = [...new Set([...existingCategories.filter(c => c !== '__new__'), form.category].filter(Boolean))]

  return (
    <Modal
      title={`Edit Product — ${product.name}`}
      onClose={onClose}
      size="lg"
      actions={[
        { label: saving ? 'Saving…' : 'Save Changes', primary: true, onClick: saving ? () => {} : save },
        { label: 'Cancel', onClick: onClose },
      ]}
    >
      {error && <div className="mb-3 text-[12px] text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}

      <FormGroup label="Product Image">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-lg border border-border bg-surface2 flex items-center justify-center overflow-hidden flex-shrink-0">
            {imagePreview
              ? <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
              : <span className="text-2xl">{CAT_EMOJI[form.category] || '📦'}</span>
            }
          </div>
          <div>
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-border text-[12px] text-text2 hover:bg-surface2 transition-colors">
              📷 Change image
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
            {imageFile && (
              <button type="button" onClick={() => { setImageFile(null); setImagePreview(product.images?.[0] || null) }}
                className="ml-2 text-[11px] text-red-500 hover:text-red-700">✕ Revert</button>
            )}
            <div className="text-[11px] text-text3 mt-1">JPG, PNG, WebP · max 5MB</div>
          </div>
        </div>
      </FormGroup>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormGroup label="Product Name *">
          <Input value={form.name} onChange={set('name')} placeholder="e.g. Chocolate Cake 1kg" />
        </FormGroup>
        <FormGroup label="SKU *">
          <Input value={form.sku} onChange={set('sku')} placeholder="e.g. CK-001" />
        </FormGroup>
        <FormGroup label="Base Price (₹) *">
          <Input type="number" min="0" step="0.01" value={form.price} onChange={set('price')} placeholder="0.00" />
        </FormGroup>
        <FormGroup label="Stock Quantity *">
          <Input type="number" min="0" step="1" value={form.stock} onChange={set('stock')} placeholder="0" />
        </FormGroup>
        <FormGroup label="Category">
          <Select value={form.category} onChange={set('category')}>
            <option value="">— None —</option>
            {cats.map(c => <option key={c} value={c}>{c}</option>)}
            <option value="__new__">+ Add new category…</option>
          </Select>
        </FormGroup>
        <FormGroup label="Status">
          <Select value={form.status} onChange={set('status')}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </Select>
        </FormGroup>
      </div>

      {form.category === '__new__' && (
        <FormGroup label="New Category Name">
          <Input value={form.categoryCustom} onChange={set('categoryCustom')} placeholder="e.g. Hampers" />
        </FormGroup>
      )}

      <FormGroup label="Description">
        <Textarea value={form.description} onChange={set('description')} rows={3} placeholder="Optional product description" />
      </FormGroup>

      <FormGroup label="Low Stock Threshold">
        <Input type="number" min="0" step="1" value={form.lowStockThreshold} onChange={set('lowStockThreshold')} placeholder="10" />
      </FormGroup>
    </Modal>
  )
}
