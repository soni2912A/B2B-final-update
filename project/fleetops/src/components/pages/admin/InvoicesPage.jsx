import React, { useEffect, useState, useRef, useCallback } from 'react'
import { apiFetch, apiDownload, formatCurrency } from '../../../utils/api.js'
import { Badge, Card, PageHeader, FilterBar, TableWrap, TblAction, Pagination, Btn, Loading, Modal, FormGroup, Input, Select } from '../../ui/index.jsx'
import { showToast } from '../../ui/index.jsx'
import { useApp } from '../../../AppContext.jsx'

const DEBOUNCE_MS = 300

const STATUS_OPTIONS = [
  { v: 'draft',     l: 'Draft' },
  { v: 'sent',      l: 'Sent' },
  { v: 'partial',   l: 'Partially Paid' },
  { v: 'paid',      l: 'Paid' },
  { v: 'overdue',   l: 'Overdue' },
  { v: 'cancelled', l: 'Cancelled' },
]

// Format date as dd/mm/yyyy
function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d)) return '—'
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

export default function InvoicesPage() {
  const { role } = useApp()
  const isCorp   = role === 'corporate_user'
  const prefix   = isCorp ? '/corporate' : '/admin'

  const [invoices, setInvoices] = useState([])
  const [pagination, setPag]    = useState({ total: 0, page: 1, limit: 20 })
  const [loading, setLoading]   = useState(true)
  const [viewInv, setViewInv]   = useState(null)
  const [payModal, setPayModal] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [filters, setFilters]   = useState({ search: '', status: '', from: '', to: '' })
  const isTypingRef             = useRef(false)

  const buildQuery = useCallback((f) => {
    const p = new URLSearchParams()
    if (f.search) p.set('search', f.search)
    if (f.status) p.set('status', f.status)
    if (f.from)   p.set('from', f.from)
    if (f.to)     p.set('to', f.to)
    const qs = p.toString()
    return qs ? `?${qs}` : ''
  }, [])

  const load = useCallback(async (f = filters, pg = pagination) => {
    try {
      const p = new URLSearchParams()
      if (f.search) p.set('search', f.search)
      if (f.status) p.set('status', f.status)
      if (f.from)   p.set('from', f.from)
      if (f.to)     p.set('to', f.to)
      p.set('page',  String(pg.page  || 1))
      p.set('limit', String(pg.limit || 20))
      const qs = p.toString()
      const res = await apiFetch('GET', `${prefix}/invoices${qs ? `?${qs}` : ''}`)
      setInvoices(res.data?.invoices || [])
      setPag(prev => ({ ...prev, ...pg, total: res.pagination?.total ?? res.data?.invoices?.length ?? 0 }))
    } catch (err) {
      showToast(err.message || 'Failed to load invoices.', 'error')
    } finally {
      setLoading(false)
    }
  }, [filters, prefix])

  useEffect(() => {
    isTypingRef.current = true
    setLoading(true)
    const handle = setTimeout(() => {
      isTypingRef.current = false
      const resetPg = { page: 1, limit: pagination.limit }
      setPag(prev => ({ ...prev, page: 1 }))
      load(filters, resetPg)
    }, DEBOUNCE_MS)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  function onFilterChange(key, val) { setFilters(f => ({ ...f, [key]: val })) }
  function onClear() { setFilters({ search: '', status: '', from: '', to: '' }) }

  async function doExport() {
    if (isCorp) return
    setExporting(true)
    try {
      await apiDownload(`/admin/invoices/export?format=xlsx&${buildQuery(filters).slice(1)}`, `invoices-${Date.now()}.xlsx`)
    } catch (err) {
      showToast(err.message || 'Export failed.', 'error')
    } finally {
      setExporting(false)
    }
  }

  async function downloadPdf(inv) {
    try {
      await apiDownload(`${prefix}/invoices/${inv._id}/download`, `invoice-${inv.invoiceNumber || inv._id}.pdf`)
    } catch (err) {
      showToast(err.message || 'PDF download failed.', 'error')
    }
  }

  return (
    <div>
      <PageHeader title="Invoices" subtitle={`${pagination.total} invoices`}>
        {!isCorp && (
          <Btn size="sm" onClick={doExport} disabled={exporting}>
            {exporting ? 'Exporting…' : '↓ Export'}
          </Btn>
        )}
      </PageHeader>

      <FilterBar
        values={filters}
        onChange={onFilterChange}
        onClear={onClear}
        fields={[
          { key: 'search', placeholder: 'Search by invoice or order number…' },
          { key: 'status', type: 'select', placeholder: 'All Statuses', options: STATUS_OPTIONS },
          { key: 'from',   type: 'date' },
          { key: 'to',     type: 'date' },
        ]}
      />

      <Card noPad>
        {loading ? <Loading /> : (
          <>
            <TableWrap>
              <thead>
                <tr><th>SR.NO</th><th>Invoice No.</th><th>Corporate</th><th>Order</th><th>Amount</th><th>Due Date</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-10 text-text2 text-sm">No records found.</td></tr>
                ) : invoices.map((inv, idx) => (
                  <tr key={inv._id}>
                    <td data-label="SR.NO" className="text-text3 text-[12px]">{(pagination.page - 1) * pagination.limit + idx + 1}</td>
                    <td data-label="Invoice No."><span className="font-mono text-[12px]">{inv.invoiceNumber || '—'}</span></td>
                    <td data-label="Corporate">{inv.corporate?.companyName || '—'}</td>
                    <td data-label="Order"><span className="font-mono text-[12px]">{inv.order?.orderNumber || '—'}</span></td>
                    <td data-label="Amount" className="font-semibold">{formatCurrency(inv.totalAmount)}</td>
                    <td data-label="Due Date">{formatDate(inv.dueDate)}</td>
                    <td data-label="Status"><Badge status={inv.status} /></td>
                    <td data-label="Actions">
                      <div className="flex gap-1.5 flex-wrap">
                        <TblAction onClick={() => setViewInv(inv)}>View</TblAction>
                        <TblAction onClick={() => downloadPdf(inv)}>↓ PDF</TblAction>
                        {!isCorp && inv.status !== 'paid' && inv.status !== 'cancelled' && (
                          <TblAction onClick={() => setPayModal(inv)}>Pay</TblAction>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
            <Pagination total={pagination.total} page={pagination.page} limit={pagination.limit}
              onPageChange={p => { const pg = { page: p, limit: pagination.limit }; setPag(prev => ({ ...prev, page: p })); load(filters, pg) }}
              onLimitChange={l => { const pg = { page: 1, limit: l }; setPag(prev => ({ ...prev, page: 1, limit: l })); load(filters, pg) }}
            />
          </>
        )}
      </Card>

      {viewInv && (
        <InvoiceModal
          invoice={viewInv}
          onClose={() => setViewInv(null)}
          onDownload={() => downloadPdf(viewInv)}
        />
      )}
      {payModal && (
        <RecordPaymentModal
          invoice={payModal}
          onClose={() => setPayModal(null)}
          onSave={() => { setPayModal(null); load(filters) }}
        />
      )}
    </div>
  )
}

function InvoiceModal({ invoice: inv, onClose, onDownload }) {
  return (
    <Modal
      title="Invoice"
      onClose={onClose}
      size="lg"
      actions={[
        { label: 'Download PDF', primary: true, onClick: onDownload },
        { label: 'Close', onClick: onClose },
      ]}
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 gap-3">
        <div>
          <div className="text-sm font-bold text-accent">{inv.corporate?.companyName || 'Corporate'}</div>
          <div className="text-xs text-text2 break-all">{inv.corporate?.email || ''}</div>
        </div>
        <div className="sm:text-right">
          <div className="text-xl font-bold">{inv.invoiceNumber || '—'}</div>
          <div className="text-xs text-text2">Issued: {formatDate(inv.invoiceDate || inv.createdAt)}</div>
          <div className="text-xs text-text2">Due: {formatDate(inv.dueDate)}</div>
          <div className="mt-1"><Badge status={inv.status} /></div>
        </div>
      </div>

      <div className="mb-5 hidden sm:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left pb-2 text-[11px] text-text2 uppercase tracking-wider">Item</th>
              <th className="text-right pb-2 text-[11px] text-text2 uppercase tracking-wider">Qty</th>
              <th className="text-right pb-2 text-[11px] text-text2 uppercase tracking-wider">Unit</th>
              <th className="text-right pb-2 text-[11px] text-text2 uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody>
            {(inv.lineItems || []).map((it, i) => (
              <tr key={i} className="border-b border-border">
                <td className="py-2.5 text-[13px]">{it.description}</td>
                <td className="py-2.5 text-[13px] text-right">{it.quantity}</td>
                <td className="py-2.5 text-[13px] text-right">{formatCurrency(it.unitPrice)}</td>
                <td className="py-2.5 text-[13px] text-right font-medium">{formatCurrency(it.total)}</td>
              </tr>
            ))}
            {(!inv.lineItems || inv.lineItems.length === 0) && (
              <tr><td colSpan={4} className="py-4 text-center text-text2 text-[12px]">No line items</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mb-5 space-y-2 sm:hidden">
        {(inv.lineItems || []).length === 0 ? (
          <div className="py-4 text-center text-text2 text-[12px]">No line items</div>
        ) : (inv.lineItems || []).map((it, i) => (
          <div key={i} className="border border-border rounded-lg p-3 text-[13px]">
            <div className="font-medium mb-1">{it.description}</div>
            <div className="flex justify-between text-[12px] text-text2">
              <span>{it.quantity} × {formatCurrency(it.unitPrice)}</span>
              <span className="font-semibold text-text1">{formatCurrency(it.total)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-1">
        <div className="flex justify-between sm:justify-end sm:gap-10 text-[13px]"><span>Subtotal</span><span>{formatCurrency(inv.subtotal)}</span></div>
        {inv.discountAmount > 0 && <div className="flex justify-between sm:justify-end sm:gap-10 text-[13px]"><span>Discount</span><span>-{formatCurrency(inv.discountAmount)}</span></div>}
        {inv.taxAmount > 0 && <div className="flex justify-between sm:justify-end sm:gap-10 text-[13px]"><span>Tax</span><span>{formatCurrency(inv.taxAmount)}</span></div>}
        <div className="flex justify-between sm:justify-end sm:gap-10 text-[15px] font-bold border-t-2 border-text1 pt-2 mt-1">
          <span>Total</span><span>{formatCurrency(inv.totalAmount)}</span>
        </div>
        {inv.paidAmount > 0 && (
          <div className="flex justify-between sm:justify-end sm:gap-10 text-[13px] text-text2">
            <span>Paid</span><span>{formatCurrency(inv.paidAmount)}</span>
          </div>
        )}
        {(inv.balanceAmount ?? (inv.totalAmount - (inv.paidAmount || 0))) > 0 && (
          <div className="flex justify-between sm:justify-end sm:gap-10 text-[13px] font-semibold">
            <span>Balance</span><span>{formatCurrency(inv.balanceAmount ?? (inv.totalAmount - (inv.paidAmount || 0)))}</span>
          </div>
        )}
      </div>
    </Modal>
  )
}

function RecordPaymentModal({ invoice, onClose, onSave }) {
  const [form, setForm] = useState({
    amount: invoice.balanceAmount ?? invoice.totalAmount,
    method: 'bank_transfer',
    transactionId: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function save() {
    setSaving(true); setError('')
    try {
      await apiFetch('POST', `/admin/invoices/${invoice._id}/payment`, {
        ...form,
        amount: Number(form.amount),
      })
      showToast('Payment recorded')
      onSave()
    } catch (err) {
      setError(err.message || 'Failed to record payment')
      setSaving(false)
    }
  }

  return (
    <Modal
      title="Record Payment"
      onClose={onClose}
      actions={[
        { label: saving ? 'Recording…' : 'Record Payment', primary: true, onClick: save, disabled: saving },
        { label: 'Cancel', onClick: onClose },
      ]}
    >
      {error && <div className="mb-3 p-2.5 rounded border border-red-200 bg-red-50 text-red-700 text-[12px]">{error}</div>}
      <FormGroup label="Amount Paid"><Input type="number" value={form.amount} onChange={set('amount')} /></FormGroup>
      <FormGroup label="Payment Method">
        <Select value={form.method} onChange={set('method')}>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="cash">Cash</option>
          <option value="cheque">Cheque</option>
          <option value="online">Online</option>
        </Select>
      </FormGroup>
      <FormGroup label="Transaction ID"><Input value={form.transactionId} onChange={set('transactionId')} placeholder="TXN-…" /></FormGroup>
      <FormGroup label="Notes"><Input value={form.notes} onChange={set('notes')} placeholder="Optional" /></FormGroup>
    </Modal>
  )
}