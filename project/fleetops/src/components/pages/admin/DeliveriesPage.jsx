import React, { useEffect, useState, useRef, useCallback } from 'react'
import { apiFetch, formatDate, initials, BACKEND_BASE } from '../../../utils/api.js'
import { Badge, Card, PageHeader, FilterBar, TableWrap, TblAction, Btn, Loading, Modal, FormGroup, Input, Select, Textarea } from '../../ui/index.jsx'
import { showToast } from '../../ui/index.jsx'
import EditableCell from '../../ui/EditableCell.jsx'

const DEBOUNCE_MS = 300

const STATUS_OPTIONS = [
  { v: 'scheduled',  l: 'Scheduled' },
  { v: 'in_transit', l: 'In Transit' },
  { v: 'delivered',  l: 'Delivered' },
  { v: 'failed',     l: 'Failed' },
  { v: 'rescheduled', l: 'Rescheduled' },
]

// Non-terminal order states — i.e. orders that haven't been fully delivered
// or cancelled and can still have deliveries scheduled against them.
const SCHEDULABLE_ORDER_STATUSES = new Set([
  'new', 'scheduled', 'processing', 'assigned', 'out_for_delivery',
])

function addressSubdoc(text) {
  // Flatten a single-line address into the schema's subdoc shape. Everything
  // goes into `street` unless the admin takes the time to split it; the
  // subdoc's other fields remain empty strings.
  const t = String(text || '').trim()
  if (!t) return undefined
  return { street: t, city: '', state: '', pincode: '' }
}

// Visual step indicator for a delivery. Shows the canonical happy-path flow:
// scheduled → in_transit → delivered. Failed and rescheduled get their own
// compact badges since they don't fit a linear progression.
function DeliveryProgress({ status }) {
  if (status === 'failed') {
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-700">⨯ Failed</span>
  }
  if (status === 'rescheduled') {
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700">↻ Rescheduled</span>
  }
  const steps = [
    { key: 'scheduled',  label: 'Scheduled' },
    { key: 'in_transit', label: 'In Transit' },
    { key: 'delivered',  label: 'Delivered' },
  ]
  const rank = { scheduled: 0, in_transit: 1, delivered: 2 }
  const current = rank[status] ?? 0
  return (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => {
        const done = i < current
        const active = i === current
        return (
          <React.Fragment key={s.key}>
            <span
              title={s.label}
              className={`w-2 h-2 rounded-full ${done ? 'bg-green-500' : active ? 'bg-accent' : 'bg-border'}`}
            />
            {i < steps.length - 1 && (
              <span className={`w-3 h-[1px] ${done ? 'bg-green-500' : 'bg-border'}`} />
            )}
          </React.Fragment>
        )
      })}
      <span className="ml-1 text-[10px] text-text2">{steps[current].label}</span>
    </div>
  )
}

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading]       = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [filters, setFilters]       = useState({ search: '', status: '', from: '', to: '' })
  const [modal, setModal]           = useState(null)   // { type, delivery }
  const [proofUrl, setProofUrl]     = useState(null)   // proof image modal
  const isTypingRef = useRef(false)

  const buildQuery = useCallback((f) => {
    const p = new URLSearchParams()
    if (f.search) p.set('search', f.search)
    if (f.status) p.set('status', f.status)
    if (f.from)   p.set('from', f.from)
    if (f.to)     p.set('to', f.to)
    const qs = p.toString()
    return qs ? `?${qs}` : ''
  }, [])

  const load = useCallback(async (f = filters) => {
    try {
      const res = await apiFetch('GET', `/admin/deliveries${buildQuery(f)}`)
      setDeliveries(res.data?.deliveries || [])
    } catch (err) {
      showToast(err.message || 'Failed to load deliveries.', 'error')
    } finally {
      setLoading(false)
    }
  }, [filters, buildQuery])

  useEffect(() => {
    isTypingRef.current = true
    setLoading(true)
    const handle = setTimeout(() => {
      isTypingRef.current = false
      load(filters)
    }, DEBOUNCE_MS)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  function onFilterChange(key, val) { setFilters(f => ({ ...f, [key]: val })) }
  function onClear() { setFilters({ search: '', status: '', from: '', to: '' }) }

  async function markInTransit(id) {
    try {
      await apiFetch('PATCH', `/admin/deliveries/${id}/in-transit`, {})
      showToast('Delivery marked as in transit.')
      load(filters)
    } catch (err) { showToast(err.message || 'Could not update status.', 'error') }
  }

  // Inline-edit the scheduled date. Non-terminal statuses only; the cell below
  // gates editability so admins can't silently reschedule a completed delivery.
  async function saveScheduledDate(id, dateStr) {
    await apiFetch('PUT', `/admin/deliveries/${id}`, { scheduledDate: dateStr })
    setDeliveries(ds => ds.map(d => d._id === id ? { ...d, scheduledDate: dateStr } : d))
  }

  return (
    <div>
      <PageHeader title="Deliveries" subtitle={`${deliveries.length} deliveries`}>
        <Btn variant="primary" onClick={() => setShowCreate(true)}>+ Schedule Delivery</Btn>
      </PageHeader>

      <FilterBar
        values={filters}
        onChange={onFilterChange}
        onClear={onClear}
        fields={[
          { key: 'search', placeholder: 'Search by order number…' },
          { key: 'status', type: 'select', placeholder: 'All Statuses', options: STATUS_OPTIONS },
          { key: 'from',   type: 'date' },
          { key: 'to',     type: 'date' },
        ]}
      />

      <Card noPad>
        {loading ? <Loading /> : (
          <TableWrap>
            <thead>
              <tr><th>Order</th><th>Assigned To</th><th>Delivery Date</th><th>Progress</th><th>Attempts</th><th>Proof</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {deliveries.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-text2 text-sm">No records found.</td></tr>
              ) : deliveries.map(d => {
                const canInTransit = d.status === 'scheduled' || d.status === 'rescheduled'
                const canDeliver   = d.status !== 'delivered' && d.status !== 'failed' && d.status !== 'cancelled'
                const canFail      = d.status !== 'delivered' && d.status !== 'failed' && d.status !== 'cancelled'
                const canRetry     = d.status === 'failed'
                return (
                  <tr key={d._id}>
                    <td data-label="Order"><span className="font-mono text-[12px]">{d.order?.orderNumber || '—'}</span></td>
                    <td data-label="Assigned To">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-accent-light flex items-center justify-center text-[10px] font-semibold text-accent flex-shrink-0">
                          {initials(d.assignedTo?.name || '?')}
                        </div>
                        {d.assignedTo?.name || 'Unassigned'}
                      </div>
                    </td>
                    <td data-label="Delivery Date">
                      <EditableCell
                        value={d.scheduledDate ? new Date(d.scheduledDate).toISOString().slice(0, 10) : ''}
                        mode="date"
                        render={() => formatDate(d.scheduledDate)}
                        disabled={d.status === 'delivered' || d.status === 'failed' || d.status === 'cancelled'}
                        onSave={async (v) => { await saveScheduledDate(d._id, v) }}
                      />
                    </td>
                    <td data-label="Progress"><DeliveryProgress status={d.status} /></td>
                    <td data-label="Attempts" className="text-text2">{d.attemptCount || 0}</td>
                    <td data-label="Proof">
                      {d.proofOfDelivery ? (
                        <button
                          onClick={() => setProofUrl(`${BACKEND_BASE}${d.proofOfDelivery}`)}
                          className="text-accent hover:underline text-[12px]"
                        >View</button>
                      ) : (
                        <span className="text-text3 text-[12px]">—</span>
                      )}
                    </td>
                    <td data-label="Actions">
                      <div className="flex gap-1.5 flex-wrap">
                        {canInTransit && <TblAction onClick={() => markInTransit(d._id)}>→ In Transit</TblAction>}
                        {canDeliver   && <TblAction onClick={() => setModal({ type: 'deliver', delivery: d })}>✓ Done</TblAction>}
                        {canFail      && <TblAction variant="danger" onClick={() => setModal({ type: 'fail', delivery: d })}>✗ Failed</TblAction>}
                        {canRetry     && <TblAction onClick={() => setModal({ type: 'retry', delivery: d })}>↻ Retry</TblAction>}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </TableWrap>
        )}
      </Card>

      {showCreate && (
        <CreateDeliveryModal
          onClose={() => setShowCreate(false)}
          onSave={() => { setShowCreate(false); load(filters); }}
        />
      )}

      {modal?.type === 'deliver' && (
        <MarkDeliveredModal
          delivery={modal.delivery}
          onClose={() => setModal(null)}
          onDone={() => { setModal(null); load(filters) }}
        />
      )}

      {modal?.type === 'fail' && (
        <MarkFailedModal
          delivery={modal.delivery}
          onClose={() => setModal(null)}
          onDone={() => { setModal(null); load(filters) }}
        />
      )}

      {modal?.type === 'retry' && (
        <RetryDeliveryModal
          delivery={modal.delivery}
          onClose={() => setModal(null)}
          onDone={() => { setModal(null); load(filters) }}
        />
      )}

      {proofUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setProofUrl(null)}
        >
          <div
            className="relative bg-surface rounded-lg shadow-xl max-w-[90vw] max-h-[90vh] overflow-auto p-2"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setProofUrl(null)}
              className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-surface2 hover:bg-border text-text1 text-lg font-bold"
            >×</button>
            <img
              src={proofUrl}
              alt="Proof of delivery"
              className="max-w-full max-h-[80vh] rounded"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Mark Delivered — captures notes + optional proof-of-delivery photo/sig ─
export function MarkDeliveredModal({ delivery, onClose, onDone }) {
  const [notes, setNotes] = useState('')
  const [file, setFile]   = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  async function submit() {
    setSaving(true); setError('')
    try {
      // If a file is provided, upload it first so we can include the URL in the
      // markDelivered call (ensures proof appears in the same state update).
      if (file) {
        const fd = new FormData()
        fd.append('proof', file)
        await apiFetch('POST', `/admin/deliveries/${delivery._id}/proof`, fd, true)
      }
      await apiFetch('PATCH', `/admin/deliveries/${delivery._id}/delivered`, {
        notes: notes.trim() || undefined,
      })
      showToast('Delivery marked as completed.')
      onDone()
    } catch (err) {
      setError(err.message || 'Could not mark delivery as complete.')
      setSaving(false)
    }
  }

  return (
    <Modal
      title={`Mark ${delivery.order?.orderNumber || 'delivery'} as delivered`}
      onClose={onClose}
      actions={[
        { label: saving ? 'Saving…' : 'Mark Delivered', primary: true, onClick: submit, disabled: saving },
        { label: 'Cancel', onClick: onClose },
      ]}
    >
      {error && <div className="mb-3 p-2.5 rounded border border-red-200 bg-red-50 text-red-700 text-[12px]">{error}</div>}

      <div className="text-[12px] text-text2 mb-3">
        The corporate will receive a delivery confirmation email and the invoice. A feedback request email is sent the next day.
      </div>

      <FormGroup label="Proof of Delivery (photo or signature)" hint="JPEG, PNG, or WEBP. Max 5MB.">
        <Input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={e => setFile(e.target.files?.[0] || null)}
          disabled={saving}
        />
        {delivery.proofOfDelivery && !file && (
          <div className="text-[11px] text-text2 mt-1">
            Existing proof: <a href={`${BACKEND_BASE}${delivery.proofOfDelivery}`} target="_blank" rel="noreferrer" className="text-accent hover:underline">view</a>
          </div>
        )}
      </FormGroup>

      <FormGroup label="Delivery Notes (optional)">
        <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Left with receptionist, signed by John, etc." disabled={saving} />
      </FormGroup>
    </Modal>
  )
}

// ─── Mark Failed — captures a reason; increments attemptCount on backend ────
function MarkFailedModal({ delivery, onClose, onDone }) {
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  async function submit() {
    if (!reason.trim()) { setError('Please describe why the delivery failed.'); return }
    setSaving(true); setError('')
    try {
      await apiFetch('PATCH', `/admin/deliveries/${delivery._id}/failed`, { failureReason: reason.trim() })
      showToast('Delivery marked as failed.', 'error')
      onDone()
    } catch (err) {
      setError(err.message || 'Could not mark delivery as failed.')
      setSaving(false)
    }
  }

  return (
    <Modal
      title={`Report failed delivery — ${delivery.order?.orderNumber || ''}`}
      onClose={onClose}
      actions={[
        { label: saving ? 'Saving…' : 'Mark Failed', primary: true, onClick: submit, disabled: saving },
        { label: 'Cancel', onClick: onClose },
      ]}
    >
      {error && <div className="mb-3 p-2.5 rounded border border-red-200 bg-red-50 text-red-700 text-[12px]">{error}</div>}
      <div className="text-[12px] text-text2 mb-2">
        Attempt #{(delivery.attemptCount || 0) + 1}. You can retry later from the Failed row.
      </div>
      <FormGroup label="Reason" required>
        <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Recipient not available, wrong address, access denied…" disabled={saving} />
      </FormGroup>
    </Modal>
  )
}

// ─── Retry — reschedules a failed delivery with a new date ─────────────────
function RetryDeliveryModal({ delivery, onClose, onDone }) {
  const [date, setDate]     = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  async function submit() {
    setSaving(true); setError('')
    try {
      await apiFetch('POST', `/admin/deliveries/${delivery._id}/retry`,
        date ? { scheduledDate: date } : {})
      showToast('Delivery rescheduled.')
      onDone()
    } catch (err) {
      setError(err.message || 'Could not retry delivery.')
      setSaving(false)
    }
  }

  return (
    <Modal
      title={`Retry delivery — ${delivery.order?.orderNumber || ''}`}
      onClose={onClose}
      actions={[
        { label: saving ? 'Saving…' : 'Retry', primary: true, onClick: submit, disabled: saving },
        { label: 'Cancel', onClick: onClose },
      ]}
    >
      {error && <div className="mb-3 p-2.5 rounded border border-red-200 bg-red-50 text-red-700 text-[12px]">{error}</div>}
      <div className="text-[12px] text-text2 mb-3">
        Previous attempt{delivery.attemptCount > 1 ? 's' : ''}: <b>{delivery.attemptCount || 1}</b>
        {delivery.failureReason && <> · Reason: <span className="italic">{delivery.failureReason}</span></>}
      </div>
      <FormGroup label="New Delivery Date" hint="Leave blank to keep the original date.">
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} disabled={saving} />
      </FormGroup>
    </Modal>
  )
}

function CreateDeliveryModal({ onClose, onSave }) {
  const EMPTY = { order: '', assignedTo: '', scheduledDate: '', address: '', notes: '' }
  const [form, setForm]     = useState(EMPTY)
  const [orders, setOrders] = useState([])
  const [staff, setStaff]   = useState([])
  const [loadingRefs, setLoadingRefs] = useState(true)
  // Classified error state:
  // - submitError: user-facing, shown in banner. Only set by save() failures.
  // - background fetch errors: never show a banner; dropdowns' empty-state
  //   messages render instead. Logged to console for dev visibility.
  const [submitError, setSubmitError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function loadRefs() {
      // Load each independently so a failure on one doesn't blank the other.
      const ordersPromise = apiFetch('GET', '/admin/orders?limit=500')
        .then(r => {
          if (cancelled) return
          const all = r.data?.orders || []
          setOrders(all.filter(o => SCHEDULABLE_ORDER_STATUSES.has(o.status)))
        })
        .catch(err => {
          if (!cancelled) console.error('[CreateDeliveryModal] orders fetch failed:', err.message)
        })

      // /admin/team is the directory endpoint — adminAccess (admin + staff),
      // purpose-built for dropdown population. /admin/users is admin-only
      // because it hosts mutation handlers, so we can't reuse it here.
      const teamPromise = apiFetch('GET', '/admin/team?active=true&limit=500')
        .then(r => {
          if (cancelled) return
          const all = r.data?.users || []
          setStaff(all.filter(u => u.isActive !== false))
        })
        .catch(err => {
          if (!cancelled) console.error('[CreateDeliveryModal] team fetch failed:', err.message)
        })

      await Promise.all([ordersPromise, teamPromise])
      if (!cancelled) setLoadingRefs(false)
    }
    loadRefs()
    return () => { cancelled = true }
  }, [])

  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }

  async function save() {
    if (!form.order)         { setSubmitError('Order is required.'); return }
    if (!form.scheduledDate) { setSubmitError('Scheduled date is required.'); return }
    if (!form.assignedTo)    { setSubmitError('Assigned staff is required.'); return }
    setSaving(true); setSubmitError('')
    try {
      await apiFetch('POST', '/admin/deliveries', {
        order: form.order,
        assignedTo: form.assignedTo,
        scheduledDate: form.scheduledDate,
        deliveryAddress: addressSubdoc(form.address),
        notes: form.notes || undefined,
      })
      showToast('Delivery scheduled.')
      onSave()
    } catch (err) {
      setSubmitError(err.message || 'Could not schedule delivery.')
      setSaving(false)
    }
  }

  return (
    <Modal
      title="Schedule Delivery"
      onClose={onClose}
      actions={[
        { label: saving ? 'Scheduling…' : 'Schedule', primary: true, onClick: save, disabled: saving || loadingRefs },
        { label: 'Cancel', onClick: onClose },
      ]}
    >
      {submitError && (
        <div className="mb-3 p-2.5 rounded border border-red-200 bg-red-50 text-red-700 text-[12px]">{submitError}</div>
      )}
      {loadingRefs ? (
        <div className="text-[12px] text-text2 py-4 text-center">Loading orders and staff…</div>
      ) : (
        <>
          <FormGroup label="Order">
            <Select value={form.order} onChange={set('order')}>
              <option value="">Select an order…</option>
              {orders.map(o => (
                <option key={o._id} value={o._id}>
                  {o.orderNumber} — {o.corporate?.companyName || 'Unknown corporate'}
                </option>
              ))}
            </Select>
            {orders.length === 0 && (
              <div className="text-[11px] text-text2 mt-1">No schedulable orders available.</div>
            )}
          </FormGroup>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormGroup label="Assigned Staff">
              <Select value={form.assignedTo} onChange={set('assignedTo')}>
                <option value="">Select staff…</option>
                {staff.map(u => (
                  <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                ))}
              </Select>
              {staff.length === 0 && (
                <div className="text-[11px] text-text2 mt-1">No active operational staff available.</div>
              )}
            </FormGroup>
            <FormGroup label="Delivery Date">
              <Input type="date" value={form.scheduledDate} onChange={set('scheduledDate')} />
            </FormGroup>
          </div>
          <FormGroup label="Delivery Address">
            <Textarea value={form.address} onChange={set('address')} placeholder="Full address…" />
          </FormGroup>
          <FormGroup label="Notes">
            <Textarea value={form.notes} onChange={set('notes')} placeholder="Special instructions…" />
          </FormGroup>
        </>
      )}
    </Modal>
  )
}