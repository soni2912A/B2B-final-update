import React, { useEffect, useRef, useState } from 'react'
import { apiFetch, formatCurrency, initials } from '../../../utils/api.js'
import { Badge, Card, PageHeader, FilterBar, TableWrap, TblAction, Pagination, Btn, Loading, Modal, FormGroup, Input, Textarea, PhoneInput } from '../../ui/index.jsx'
import { showToast } from '../../ui/index.jsx'
import EditableCell from '../../ui/EditableCell.jsx'
import { useApp } from '../../../AppContext.jsx'

export default function CorporatesPage() {
  const { role } = useApp()
  const canAddCorporate = role !== 'staff'
  const [corps, setCorps]       = useState([])
  const [pagination, setPag]    = useState({ total: 0, page: 1, limit: 12 })
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [viewing, setViewing]   = useState(null)
  const [filters, setFilters]   = useState({ search: '', status: '' })
  const debounceRef = useRef(null)

  async function load(override = {}) {
    const page  = override.page  ?? pagination.page
    const limit = override.limit ?? pagination.limit
    const search = override.search ?? filters.search
    const status = override.status ?? filters.status

    setLoading(true)
    const qp = new URLSearchParams()
    qp.set('page', page)
    qp.set('limit', limit)
    if (search) qp.set('search', search)
    if (status) qp.set('status', status)

    try {
      const res = await apiFetch('GET', '/admin/corporates?' + qp.toString())
      setCorps(res.data?.corporates || [])
      setPag(res.pagination || { total: res.data?.corporates?.length || 0, page, limit })
    } catch (err) {
      setCorps([])
      showToast(err.message || 'Failed to load corporates.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => load({ page: 1 }), 300)
    return () => clearTimeout(debounceRef.current)
  }, [filters.search, filters.status])

  async function toggleStatus(id, status) {
    const next = status === 'active' ? 'inactive' : 'active'
    try {
      await apiFetch('PATCH', `/admin/corporates/${id}/status`, { status: next })
      showToast('Status updated.')
      load()
    } catch (err) {
      showToast(err.message || 'Status update failed.', 'error')
    }
  }

  async function saveCorporateField(id, patch) {
    await apiFetch('PUT', `/admin/corporates/${id}`, patch)
    setCorps(cs => cs.map(c => c._id === id ? { ...c, ...patch } : c))
  }
  async function saveCorporateStatus(id, status) {
    await apiFetch('PATCH', `/admin/corporates/${id}/status`, { status })
    setCorps(cs => cs.map(c => c._id === id ? { ...c, status } : c))
  }

  async function deleteCorporate(id, name) {
    if (!window.confirm(`Permanently delete "${name}"? This cannot be undone.`)) return
    try {
      await apiFetch('DELETE', `/admin/corporates/${id}`)
      showToast('Corporate client deleted.')
      load({ page: 1 })
    } catch (err) {
      showToast(err.message || 'Could not delete corporate.', 'error')
    }
  }

  async function exportCSV() {
    try {
      const qp = new URLSearchParams()
      qp.set('page', 1)
      qp.set('limit', 5000)
      if (filters.search) qp.set('search', filters.search)
      if (filters.status) qp.set('status', filters.status)
      const res = await apiFetch('GET', '/admin/corporates?' + qp.toString())
      const rows = res.data?.corporates || []
      if (rows.length === 0) {
        showToast('No records to export.', 'info')
        return
      }

      const headers = [
        'Company Name', 'Contact Person', 'Email ID', 'Contact Number',
        'Status', 'Credit Limit', 'Payment Terms (days)',
        'Billing Street', 'Billing City', 'Billing State', 'Billing Postal Code', 'Billing Country',
        'Onboarded On',
      ]
      const esc = v => {
        const s = v === null || v === undefined ? '' : String(v)
        return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
      }
      const lines = [headers.map(esc).join(',')]
      for (const c of rows) {
        const b = c.address?.billing || {}
        lines.push([
          c.companyName, c.contactPerson, c.email, c.phone,
          c.status, c.creditLimit, c.paymentTerms,
          b.street, b.city, b.state, b.pincode, b.country,
          c.onboardedAt ? new Date(c.onboardedAt).toISOString().slice(0, 10) : '',
        ].map(esc).join(','))
      }

      const csv = '\uFEFF' + lines.join('\r\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'corporate-clients-export.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      showToast(`Exported ${rows.length} record${rows.length === 1 ? '' : 's'}.`)
    } catch (err) {
      showToast(err.message || 'Export failed.', 'error')
    }
  }

  return (
    <div>
      <PageHeader title="Corporate Clients" subtitle={`${pagination.total} registered clients`}>
        <Btn size="sm" onClick={exportCSV} title="Export to CSV">↓ Export</Btn>
      </PageHeader>

      <FilterBar
        fields={[
          { key: 'search', placeholder: 'Search companies…' },
          { key: 'status', type: 'select', placeholder: 'All Statuses', options: [{ v: 'active', l: 'Active' }, { v: 'inactive', l: 'Inactive' }] },
        ]}
        values={filters}
        onChange={(k, v) => setFilters(f => ({ ...f, [k]: v }))}
        onClear={() => setFilters({ search: '', status: '' })}
      />

      <Card noPad>
        {loading ? <Loading /> : corps.length === 0 ? (
          <div className="py-12 text-center text-text2 text-sm">No records found.</div>
        ) : (
          <>
            <TableWrap>
              <thead>
                <tr><th>SR.NO</th><th>Company</th><th>Email</th><th>Phone</th><th>Orders</th><th>Credit Limit</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {corps.map((c, idx) => (
                  <tr key={c._id}>
                    <td data-label="SR.NO" className="text-text3 text-[12px]">{(pagination.page - 1) * pagination.limit + idx + 1}</td>
                    <td data-label="Company">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-accent-light flex items-center justify-center text-[10px] font-semibold text-accent flex-shrink-0">{initials(c.companyName)}</div>
                        <span className="font-medium">{c.companyName}</span>
                      </div>
                    </td>
                    <td data-label="Email" className="text-text2 break-all">{c.email}</td>
                    <td data-label="Phone" className="text-text2">
                      <EditableCell
                        value={c.phone || ''}
                        onSave={async (v) => { await saveCorporateField(c._id, { phone: v || undefined }) }}
                      />
                    </td>
                    <td data-label="Orders"><span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full text-[11px] font-medium">{c.totalOrders || 0}</span></td>
                    <td data-label="Credit Limit" className="font-medium">
                      <EditableCell
                        value={c.creditLimit || 0}
                        mode="number"
                        render={v => formatCurrency(v || 0)}
                        onSave={async (v) => { await saveCorporateField(c._id, { creditLimit: v }) }}
                      />
                    </td>
                    <td data-label="Status">
                      <EditableCell
                        value={c.status || 'active'}
                        mode="select"
                        options={[
                          { value: 'pending',  label: 'Pending' },
                          { value: 'active',   label: 'Active' },
                          { value: 'inactive', label: 'Inactive' },
                          { value: 'rejected', label: 'Rejected' },
                        ]}
                        render={v => <Badge status={v} />}
                        onSave={async (v) => { await saveCorporateStatus(c._id, v) }}
                      />
                    </td>
                    <td data-label="Actions">
                      <div className="flex gap-1.5 flex-wrap">
                        <TblAction onClick={() => setViewing(c)} title="View details">View</TblAction>
                        {role === 'admin' && (
                          <TblAction variant="danger" onClick={() => deleteCorporate(c._id, c.companyName)}>Delete</TblAction>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
            <Pagination
              total={pagination.total}
              page={pagination.page}
              limit={pagination.limit}
              onPageChange={p => load({ page: p })}
              onLimitChange={l => load({ page: 1, limit: l })}
            />
          </>
        )}
      </Card>

      {showAdd && <AddCorporateModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load({ page: 1 }) }} />}
      {viewing && <ViewCorporateModal corp={viewing} onClose={() => setViewing(null)} />}
    </div>
  )
}

function AddCorporateModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    companyName: '', contactPerson: '', email: '', phone: '',
    countryCode: '+91',
    creditLimit: '', industry: '', address: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function save() {
    setError('')
    const companyName   = form.companyName.trim()
    const contactPerson = form.contactPerson.trim()
    const email         = form.email.trim().toLowerCase()
    const phone         = form.countryCode + form.phone.trim()
    const industry      = form.industry.trim()
    const address       = form.address.trim()

    if (!companyName || !contactPerson || !email || !phone || industry === '' || address === '' || form.creditLimit === '') {
      setError('Please fill all required fields.')
      return
    }
    if (!/^[A-Za-z\s]+$/.test(contactPerson)) {
      setError('Contact person name must contain only letters.')
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid Email ID.')
      return
    }
    const phoneDigits = form.phone.replace(/\D/g, '')
    if (phoneDigits.length !== 10) {
      setError('Phone number must be exactly 10 digits.')
      return
    }
    const credit = Number(form.creditLimit)
    if (Number.isNaN(credit) || credit < 0) {
      setError('Credit Limit must be 0 or greater.')
      return
    }

    const payload = {
      companyName, contactPerson, email, phone,
      creditLimit: credit,
      notes: industry ? `Industry: ${industry}` : undefined,
      address: { billing: { street: address } },
    }

    try {
      setSaving(true)
      const res = await apiFetch('POST', '/admin/corporates', payload)
      if (res?.success === false) throw new Error(res.message || 'Failed to save corporate.')
      showToast('Corporate added successfully.')
      onSaved()
    } catch (err) {
      const msg = err?.message || 'Failed to save corporate.'
      setError(msg)
      showToast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title="Add Corporate Client"
      onClose={saving ? () => {} : onClose}
      actions={[
        { label: saving ? 'Adding…' : 'Add Corporate', primary: true, onClick: saving ? () => {} : save },
        { label: 'Cancel', onClick: saving ? () => {} : onClose },
      ]}
    >
      {error && <div className="mb-3 text-[12px] text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}
      <FormGroup label="Company Name"><Input value={form.companyName} onChange={set('companyName')} placeholder="Acme Corp" /></FormGroup>
      <FormGroup label="Contact Person"><Input value={form.contactPerson} onChange={set('contactPerson')} placeholder="Jane Doe" /></FormGroup>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormGroup label="Email"><Input type="email" value={form.email} onChange={set('email')} placeholder="contact@company.com" /></FormGroup>
        <FormGroup label="Phone">
          <PhoneInput value={form.countryCode && form.phone ? `${form.countryCode} ${form.phone}` : form.phone || ''} onChange={e => {
            const val = e.target.value || ''
            const codes = ['+971','+91','+65','+61','+44','+1']
            const cc = codes.find(c => val.startsWith(c)) || '+91'
            setForm(f => ({ ...f, countryCode: cc, phone: val.replace(cc,'').trim() }))
          }} />
        </FormGroup>
        <FormGroup label="Credit Limit"><Input type="number" min="0" value={form.creditLimit} onChange={set('creditLimit')} placeholder="10000" /></FormGroup>
        <FormGroup label="Industry"><Input value={form.industry} onChange={set('industry')} placeholder="Technology" /></FormGroup>
      </div>
      <FormGroup label="Billing Address"><Textarea value={form.address} onChange={set('address')} placeholder="Full billing address…" /></FormGroup>
    </Modal>
  )
}

function ViewCorporateModal({ corp: c, onClose }) {
  return (
    <Modal title="Corporate Details" onClose={onClose} actions={[{ label: 'Close', onClick: onClose }]}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-full bg-accent-light flex items-center justify-center text-base font-semibold text-accent">{initials(c.companyName)}</div>
        <div>
          <div className="text-base font-semibold">{c.companyName}</div>
          <div className="text-text2 text-xs">{c.email}</div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div><label className="block text-xs text-text2 mb-1">Contact Person</label><div>{c.contactPerson || '—'}</div></div>
        <div><label className="block text-xs text-text2 mb-1">Phone</label><div>{c.phone || '—'}</div></div>
        <div><label className="block text-xs text-text2 mb-1">Status</label><div className="mt-1"><Badge status={c.status} /></div></div>
        <div><label className="block text-xs text-text2 mb-1">Total Orders</label><div className="text-lg font-semibold">{c.totalOrders || 0}</div></div>
        <div><label className="block text-xs text-text2 mb-1">Credit Limit</label><div className="text-lg font-semibold">{formatCurrency(c.creditLimit || 0)}</div></div>
        <div><label className="block text-xs text-text2 mb-1">Payment Terms</label><div>{c.paymentTerms ? `${c.paymentTerms} days` : '—'}</div></div>
      </div>
    </Modal>
  )
}