import React, { useCallback, useEffect, useState } from 'react'
import { apiFetch, formatCurrency, formatDate } from '../../../utils/api.js'
import {
  Card, PageHeader, TableWrap, TblAction, Btn, Loading, Modal, FormGroup,
  Input, Textarea, FilterBar, Pagination, showToast,
} from '../../ui/index.jsx'

const STATUS_OPTS = [
  { v: 'pending',   l: 'Pending' },
  { v: 'processed', l: 'Processed' },
  { v: 'rejected',  l: 'Rejected' },
]

function RefundStatusPill({ status }) {
  const cls = {
    pending:   'bg-amber-50 text-amber-700',
    processed: 'bg-green-50 text-green-700',
    rejected:  'bg-red-50 text-red-700',
  }[status] || 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${cls}`}>
      {status}
    </span>
  )
}

export default function RefundsPage() {
  const [refunds, setRefunds]     = useState([])
  const [pagination, setPag]      = useState({ total: 0, page: 1, limit: 20 })
  const [loading, setLoading]     = useState(true)
  const [filters, setFilters]     = useState({ status: '' })
  const [processing, setProcessing] = useState(null)
  const [rejecting, setRejecting]   = useState(null)

  const load = useCallback(async (opts = {}) => {
    setLoading(true)
    const p = new URLSearchParams()
    p.set('page',  String(opts.page  || pagination.page))
    p.set('limit', String(opts.limit || pagination.limit))
    if (filters.status) p.set('status', filters.status)
    try {
      const res = await apiFetch('GET', `/admin/refunds?${p.toString()}`)
      setRefunds(res.data?.refunds || [])
      setPag(res.pagination || { total: res.data?.refunds?.length || 0, page: 1, limit: 20 })
    } catch (err) {
      showToast(err.message || 'Failed to load refunds.', 'error')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status])

  useEffect(() => { load({ page: 1 }) }, [load])

  return (
    <div>
      <PageHeader title="Refunds" subtitle={`${pagination.total} refunds`} />

      <FilterBar
        values={filters}
        onChange={(k, v) => setFilters(f => ({ ...f, [k]: v }))}
        onClear={() => setFilters({ status: '' })}
        fields={[
          { key: 'status', type: 'select', placeholder: 'All Statuses', options: STATUS_OPTS },
        ]}
      />

      <Card noPad>
        {loading ? <Loading /> : (
          <>
            <TableWrap>
              <thead>
                <tr>
                  <th>SR.NO</th><th>Corporate</th><th>Order</th><th>Amount</th><th>Reason</th>
                  <th>Reference</th><th>Status</th><th>Initiated</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {refunds.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-10 text-text2 text-sm">No refunds yet.</td></tr>
                ) : refunds.map((r, idx) => (
                  <tr key={r._id}>
                    <td data-label="SR.NO" className="text-text3 text-[12px]">{(pagination.page - 1) * pagination.limit + idx + 1}</td>
                    <td data-label="Corporate" className="font-medium">{r.corporate?.companyName || '—'}</td>
                    <td data-label="Order"><span className="font-mono text-[12px]">{r.invoice?.order?.orderNumber || '—'}</span></td>
                    <td data-label="Amount" className="font-semibold">{formatCurrency(r.amount)}</td>
                    <td data-label="Reason" className="text-text2 md:max-w-[200px] md:truncate">{r.reason}</td>
                    <td data-label="Reference" className="font-mono text-[12px]">{r.referenceNumber || '—'}</td>
                    <td data-label="Status"><RefundStatusPill status={r.status} /></td>
                    <td data-label="Initiated" className="text-text2">{formatDate(r.createdAt)}</td>
                    <td data-label="Actions">
                      <div className="flex gap-1.5 flex-wrap">
                        {r.status === 'pending' && (
                          <>
                            <TblAction onClick={() => setProcessing(r)}>✓ Process</TblAction>
                            <TblAction variant="danger" onClick={() => setRejecting(r)}>✗ Reject</TblAction>
                          </>
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

      {processing && (
        <ProcessRefundModal
          refund={processing}
          onClose={() => setProcessing(null)}
          onDone={() => { setProcessing(null); load() }}
        />
      )}
      {rejecting && (
        <RejectRefundModal
          refund={rejecting}
          onClose={() => setRejecting(null)}
          onDone={() => { setRejecting(null); load() }}
        />
      )}
    </div>
  )
}

export function ProcessRefundModal({ refund, onClose, onDone }) {
  const [ref, setRef]     = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  async function submit() {
    if (!ref.trim()) { setError('Enter the payment processor reference number.'); return }
    setSaving(true); setError('')
    try {
      await apiFetch('PATCH', `/admin/refunds/${refund._id}/process`, {
        referenceNumber: ref.trim(),
        notes: notes.trim() || undefined,
      })
      showToast('Refund processed. Corporate has been notified.')
      onDone()
    } catch (err) {
      setError(err.message || 'Could not process refund.')
      setSaving(false)
    }
  }

  return (
    <Modal
      title={`Process refund · ${formatCurrency(refund.amount)}`}
      onClose={onClose}
      actions={[
        { label: saving ? 'Saving…' : 'Mark Processed', primary: true, onClick: submit, disabled: saving },
        { label: 'Cancel', onClick: onClose },
      ]}
    >
      {error && <div className="mb-3 p-2.5 rounded border border-red-200 bg-red-50 text-red-700 text-[12px]">{error}</div>}
      <div className="text-[12px] text-text2 mb-3">
        Enter the reference number from your payment processor (e.g. Stripe refund id, bank transfer ref). Corporate will receive an email confirming the refund was processed.
      </div>
      <FormGroup label="Reference Number" required>
        <Input value={ref} onChange={e => setRef(e.target.value)} placeholder="re_1Abc… / UTR-123456" disabled={saving} />
      </FormGroup>
      <FormGroup label="Internal Notes (optional)">
        <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anything finance should know…" disabled={saving} />
      </FormGroup>
    </Modal>
  )
}

export function RejectRefundModal({ refund, onClose, onDone }) {
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  async function submit() {
    if (!reason.trim()) { setError('Please explain why the refund is being rejected.'); return }
    setSaving(true); setError('')
    try {
      await apiFetch('PATCH', `/admin/refunds/${refund._id}/reject`, { reason: reason.trim() })
      showToast('Refund rejected. Corporate has been notified.')
      onDone()
    } catch (err) {
      setError(err.message || 'Could not reject refund.')
      setSaving(false)
    }
  }

  return (
    <Modal
      title={`Reject refund · ${formatCurrency(refund.amount)}`}
      onClose={onClose}
      actions={[
        { label: saving ? 'Saving…' : 'Reject Refund', primary: true, onClick: submit, disabled: saving },
        { label: 'Cancel', onClick: onClose },
      ]}
    >
      {error && <div className="mb-3 p-2.5 rounded border border-red-200 bg-red-50 text-red-700 text-[12px]">{error}</div>}
      <FormGroup label="Reason" required>
        <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Why is this refund being rejected?" disabled={saving} />
      </FormGroup>
    </Modal>
  )
}

export function InitiateRefundModal({ order, onClose, onDone }) {
  const [amount, setAmount] = useState(order.totalAmount || 0)
  const [reason, setReason] = useState(order.cancelReason || '')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  async function submit() {
    const n = Number(amount)
    if (!Number.isFinite(n) || n <= 0) { setError('Refund amount must be greater than zero.'); return }
    if (!reason.trim()) { setError('Enter a refund reason (shown to the corporate in the email).'); return }
    setSaving(true); setError('')
    try {
      await apiFetch('POST', `/admin/orders/${order._id}/initiate-refund`, {
        amount: n,
        reason: reason.trim(),
      })
      showToast('Refund initiated. Corporate has been notified.')
      onDone()
    } catch (err) {
      setError(err.message || 'Could not initiate refund.')
      setSaving(false)
    }
  }

  return (
    <Modal
      title={`Initiate refund · ${order.orderNumber}`}
      onClose={onClose}
      actions={[
        { label: saving ? 'Saving…' : 'Initiate Refund', primary: true, onClick: submit, disabled: saving },
        { label: 'Cancel', onClick: onClose },
      ]}
    >
      {error && <div className="mb-3 p-2.5 rounded border border-red-200 bg-red-50 text-red-700 text-[12px]">{error}</div>}
      <div className="text-[12px] text-text2 mb-3">
        This creates a pending refund. Mark it as processed from the Refunds page once the money has been returned via your payment processor.
      </div>
      <FormGroup label="Refund Amount" required hint={`Original order total: ${formatCurrency(order.totalAmount || 0)}`}>
        <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} disabled={saving} />
      </FormGroup>
      <FormGroup label="Reason" required>
        <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Order cancelled, duplicate charge, customer request…" disabled={saving} />
      </FormGroup>
    </Modal>
  )
}