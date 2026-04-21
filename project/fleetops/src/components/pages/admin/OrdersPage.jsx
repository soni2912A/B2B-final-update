import React, { useEffect, useState, useRef, useCallback } from 'react'
import { apiFetch, apiDownload, formatDate, formatCurrency } from '../../../utils/api.js'
import { Badge, Card, PageHeader, FilterBar, TableWrap, TblAction, Pagination, Btn, Loading, Modal, FormGroup, Select, Textarea } from '../../ui/index.jsx'
import { showToast } from '../../ui/index.jsx'
import { InitiateRefundModal } from './RefundsPage.jsx'
import { useApp } from '../../../AppContext.jsx'

const DEBOUNCE_MS = 300

const STATUS_OPTIONS = [
  { v: 'new',               l: 'New' },
  { v: 'scheduled',         l: 'Scheduled' },
  { v: 'processing',        l: 'Processing' },
  { v: 'assigned',          l: 'Assigned' },
  { v: 'out_for_delivery',  l: 'Out for Delivery' },
  { v: 'delivered',         l: 'Delivered' },
  { v: 'cancelled',         l: 'Cancelled' },
]
const STATUS_LABEL = Object.fromEntries(STATUS_OPTIONS.map(o => [o.v, o.l]))

let _stateMachineCache = null

export default function OrdersPage() {
  const { role } = useApp()
  const isCorp = role === 'corporate_user'
  const prefix = isCorp ? '/corporate' : '/admin'

  const [orders, setOrders]       = useState([])
  const [pagination, setPag]      = useState({ total: 0, page: 1, limit: 20 })
  const [loading, setLoading]     = useState(true)
  const [stateMachine, setSM]     = useState(_stateMachineCache)
  const [modal, setModal]         = useState(null)  // { type, order }
  const [alertModal, setAlertModal] = useState(null) // { order } — confirmation before sending
  const [alertSending, setAlertSending] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [filters, setFilters]     = useState({ search: '', status: '', from: '', to: '' })
  const [upcomingOnly, setUpcomingOnly] = useState(false)   // "Delivering in next 2 days"
  const [sendingReminders, setSendingReminders] = useState(false)
  const [feedbackOrderIds, setFeedbackOrderIds] = useState(() => new Set())
  const isTypingRef               = useRef(false)

  function twoDayWindow() {
    const start = new Date(); start.setHours(0, 0, 0, 0)
    const end = new Date(start); end.setDate(end.getDate() + 2)
    const iso = d => d.toISOString().slice(0, 10)
    return { from: iso(start), to: iso(end) }
  }
  function toggleUpcoming() {
    if (upcomingOnly) {
      setUpcomingOnly(false)
      setFilters(f => ({ ...f, from: '', to: '' }))
    } else {
      setUpcomingOnly(true)
      const w = twoDayWindow()
      setFilters(f => ({ ...f, from: w.from, to: w.to }))
    }
  }

  async function sendRemindersBulk() {
    if (!confirm('Send pre-delivery reminder emails to all corporate clients with deliveries in the next 2 days?')) return
    setSendingReminders(true)
    try {
      const res = await apiFetch('POST', '/admin/orders/send-delivery-reminders?days=2', {})
      const sent = res.data?.sent ?? 0
      const eligible = res.data?.eligibleOrders ?? 0
      showToast(`Reminders sent to ${sent} client${sent === 1 ? '' : 's'}${eligible > sent ? ` (${eligible - sent} skipped — no email on file)` : ''}.`)
    } catch (err) {
      showToast(err.message || 'Could not send reminders.', 'error')
    } finally {
      setSendingReminders(false)
    }
  }

  useEffect(() => {
    if (isCorp || _stateMachineCache) return
    apiFetch('GET', '/admin/orders/state-machine').then(res => {
      _stateMachineCache = res.data?.machine || {}
      setSM(_stateMachineCache)
    }).catch(() => {  })
  }, [isCorp])

  const loadFeedback = useCallback(async () => {
    if (!isCorp) return
    try {
      const res = await apiFetch('GET', '/corporate/feedback?limit=500')
      const ids = new Set((res.data?.feedbacks || []).map(f => String(f.order?._id || f.order)))
      setFeedbackOrderIds(ids)
    } catch {  }
  }, [isCorp])
  useEffect(() => { loadFeedback() }, [loadFeedback])

  const buildQuery = useCallback((f, extra = {}) => {
    const p = new URLSearchParams()
    p.set('page', String(extra.page ?? pagination.page))
    p.set('limit', String(extra.limit ?? pagination.limit))
    if (f.search) p.set('search', f.search)
    if (f.status) p.set('status', f.status)
    if (f.from)   p.set('from', f.from)
    if (f.to)     p.set('to', f.to)
    return p.toString()
  }, [pagination.page, pagination.limit])

  const load = useCallback(async (f = filters, extra = {}) => {
    try {
      const qs = buildQuery(f, extra)
      const res = await apiFetch('GET', `${prefix}/orders?${qs}`)
      setOrders(res.data?.orders || [])
      setPag(res.pagination || { total: res.data?.orders?.length || 0, page: extra.page ?? 1, limit: extra.limit ?? 20 })
    } catch (err) {
      showToast(err.message || 'Failed to load orders.', 'error')
    } finally {
      setLoading(false)
    }
  }, [filters, prefix, buildQuery])

  useEffect(() => {
    isTypingRef.current = true
    setLoading(true)
    const handle = setTimeout(() => {
      isTypingRef.current = false
      load(filters)
    }, DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [filters])

  function onFilterChange(key, val) {
    setFilters(f => ({ ...f, [key]: val }))
  }
  function onClear() {
    setFilters({ search: '', status: '', from: '', to: '' })
  }

  async function doExport() {
    setExporting(true)
    try {
      await apiDownload(`/admin/orders/export?format=xlsx&${buildQuery(filters)}`, `orders-${Date.now()}.xlsx`)
    } catch (err) {
      showToast(err.message || 'Export failed.', 'error')
    } finally {
      setExporting(false)
    }
  }

  function legalNextStatuses(currentStatus) {
    if (!stateMachine) return []
    return stateMachine[currentStatus] || []
  }

  async function submitStatus(id, targetStatus, reason) {
    try {
      if (targetStatus === 'cancelled') {
        await apiFetch('PATCH', `${prefix}/orders/${id}/cancel`, { reason: reason || '' })
      } else {
        await apiFetch('PATCH', `${prefix}/orders/${id}/status`, { status: targetStatus })
      }
      showToast(`Order status updated to ${STATUS_LABEL[targetStatus] || targetStatus}.`)
      setModal(null)
      await load(filters)
    } catch (err) {
      showToast(err.message || 'Could not update status.', 'error')
    }
  }

  async function sendAlert(id) {
    setAlertSending(true)
    try {
      await apiFetch('POST', `${prefix}/orders/${id}/pre-delivery-alert`, {})
      showToast('Pre-delivery alert sent.')
      setAlertModal(null)
    } catch (err) {
      showToast(err.message || 'Could not send alert.', 'error')
    } finally {
      setAlertSending(false)
    }
  }

  return (
    <div>
      <PageHeader title="Orders" subtitle={`${pagination.total} total orders`}>
        {!isCorp && (
          <>
            <Btn size="sm" onClick={toggleUpcoming} variant={upcomingOnly ? 'primary' : 'secondary'}>
              {upcomingOnly ? '✓ Next 2 days' : 'Delivering in 2 days'}
            </Btn>
            <Btn size="sm" onClick={sendRemindersBulk} disabled={sendingReminders}>
              {sendingReminders ? 'Sending…' : '✉ Send Reminders'}
            </Btn>
            <Btn size="sm" onClick={doExport} disabled={exporting}>
              {exporting ? 'Exporting…' : '↓ Export'}
            </Btn>
          </>
        )}
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
          <>
            <TableWrap>
              <thead>
                <tr><th>Order No.</th><th>Corporate</th><th>Items</th><th>Delivery Date</th><th>Status</th><th>Amount</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-text2 text-sm">No records found.</td></tr>
                ) : orders.map(o => {
                  const next = isCorp ? [] : legalNextStatuses(o.status)
                  const canLeaveFeedback = isCorp
                    && o.status === 'delivered'
                    && !feedbackOrderIds.has(String(o._id))
                  return (
                    <tr key={o._id}>
                      <td data-label="Order No."><span className="font-mono text-[12px]">{o.orderNumber}</span></td>
                      <td data-label="Corporate">{o.corporate?.companyName || '—'}</td>
                      <td data-label="Items">{o.items?.length || 1} item(s)</td>
                      <td data-label="Delivery Date">{formatDate(o.deliveryDate)}</td>
                      <td data-label="Status"><Badge status={o.status} /></td>
                      <td data-label="Amount" className="font-semibold">{formatCurrency(o.totalAmount)}</td>
                      <td data-label="Actions">
                        <div className="flex gap-1.5 flex-wrap">
                          <TblAction onClick={() => setModal({ type: 'view', order: o })}>View</TblAction>
                          {!isCorp && role === 'admin' && (next.includes('assigned') || o.status === 'assigned') && (
                            <TblAction onClick={() => setModal({ type: 'assign', order: o })}>
                              {o.status === 'assigned' ? 'Reassign' : 'Assign'}
                            </TblAction>
                          )}
                          {!isCorp && next.length > 0 && (
                            <TblAction onClick={() => setModal({ type: 'status', order: o, next })}>Change Status</TblAction>
                          )}
                          {!isCorp && (
                            <TblAction onClick={() => setAlertModal({ order: o })}>Alert</TblAction>
                          )}
                          {!isCorp && o.status === 'cancelled' && (
                            <TblAction onClick={() => setModal({ type: 'refund', order: o })}>₹ Refund</TblAction>
                          )}
                          {canLeaveFeedback && (
                            <TblAction onClick={() => setModal({ type: 'feedback', order: o })}>Leave feedback</TblAction>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </TableWrap>
            <Pagination
              total={pagination.total}
              page={pagination.page}
              limit={pagination.limit}
              onPageChange={p => load(filters, { page: p })}
              onLimitChange={l => load(filters, { page: 1, limit: l })}
            />
          </>
        )}
      </Card>

      {modal?.type === 'view' && (
        <ViewOrderModal order={modal.order} onClose={() => setModal(null)} />
      )}

      {modal?.type === 'status' && (
        <ChangeStatusModal
          order={modal.order}
          next={modal.next}
          onClose={() => setModal(null)}
          onSubmit={submitStatus}
        />
      )}

      {modal?.type === 'assign' && (
        <AssignStaffModal
          order={modal.order}
          onClose={() => setModal(null)}
          onAssigned={async () => { setModal(null); await load(filters) }}
        />
      )}

      {modal?.type === 'refund' && (
        <InitiateRefundModal
          order={modal.order}
          onClose={() => setModal(null)}
          onDone={() => setModal(null)}
        />
      )}

      {modal?.type === 'feedback' && (
        <LeaveFeedbackModal
          order={modal.order}
          onClose={() => setModal(null)}
          onSubmitted={() => {
            setFeedbackOrderIds(prev => {
              const next = new Set(prev)
              next.add(String(modal.order._id))
              return next
            })
            setModal(null)
          }}
        />
      )}

      {alertModal && (
        <Modal
          title="Send Pre-Delivery Alert"
          onClose={() => setAlertModal(null)}
          actions={[
            {
              label: alertSending ? 'Sending…' : 'Send Alert',
              primary: true,
              disabled: alertSending,
              onClick: () => sendAlert(alertModal.order._id),
            },
            { label: 'Cancel', onClick: () => setAlertModal(null) },
          ]}
        >
          <div className="text-[13px] text-text2 mb-2">
            Send a pre-delivery alert email to the corporate client for order:
          </div>
          <div className="font-mono text-[13px] font-semibold mb-1">{alertModal.order.orderNumber}</div>
          <div className="text-[12px] text-text2">
            Corporate: <span className="text-text1">{alertModal.order.corporate?.companyName || '—'}</span>
            &nbsp;·&nbsp;Delivery: <span className="text-text1">{formatDate(alertModal.order.deliveryDate)}</span>
          </div>
        </Modal>
      )}
    </div>
  )
}

function ViewOrderModal({ order: o, onClose }) {
  return (
    <Modal title="Order Details" onClose={onClose} actions={[{ label: 'Close', onClick: onClose }]}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-xl font-bold">{o.orderNumber}</div>
          <div className="text-text2 text-[13px] mt-0.5">Created — see invoice for date</div>
        </div>
        <Badge status={o.status} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div><label className="block text-xs text-text2 mb-1">Corporate</label><div>{o.corporate?.companyName}</div></div>
        <div><label className="block text-xs text-text2 mb-1">Delivery Date</label><div>{formatDate(o.deliveryDate)}</div></div>
        <div><label className="block text-xs text-text2 mb-1">Total Amount</label><div className="text-lg font-semibold">{formatCurrency(o.totalAmount)}</div></div>
        <div><label className="block text-xs text-text2 mb-1">Assigned To</label><div>{o.assignedTo?.name || 'Not assigned'}</div></div>
      </div>
      <div className="bg-surface2 rounded p-3">
        <div className="text-xs font-medium text-text2 mb-2 uppercase tracking-wider">Order Items</div>
        {(o.items || []).map((it, i) => (
          <div key={i} className="flex justify-between py-1.5 border-b border-border last:border-0 text-[13px]">
            <span>{it.product?.name || 'Product'}</span>
            <span>Qty: {it.quantity || 1}</span>
          </div>
        ))}
      </div>
    </Modal>
  )
}

function ChangeStatusModal({ order, next, onClose, onSubmit }) {
  const [target, setTarget] = useState(next[0] || '')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const isCancel = target === 'cancelled'

  async function submit() {
    setSaving(true)
    try {
      await onSubmit(order._id, target, isCancel ? reason : undefined)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title="Change Order Status"
      onClose={onClose}
      actions={[
        { label: saving ? 'Saving…' : 'Update', primary: true, onClick: submit, disabled: saving || !target },
        { label: 'Cancel', onClick: onClose },
      ]}
    >
      <div className="text-[12px] text-text2 mb-3">
        Current status: <Badge status={order.status} />
      </div>
      <FormGroup label="New Status">
        <Select value={target} onChange={e => setTarget(e.target.value)}>
          {next.map(s => <option key={s} value={s}>{STATUS_LABEL[s] || s}</option>)}
        </Select>
      </FormGroup>
      {isCancel && (
        <FormGroup label="Cancellation Reason">
          <Textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Why is this order being cancelled? (optional — shown to the customer)"
          />
        </FormGroup>
      )}
    </Modal>
  )
}

function AssignStaffModal({ order, onClose, onAssigned }) {
  const [users, setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  useEffect(() => {
    apiFetch('GET', '/admin/users')
      .then(res => {
        const all = res.data?.users || []
        const staff = all.filter(u => u.isActive && u.role === 'staff')
        setUsers(staff)
        if (order.assignedTo?._id) setSelected(order.assignedTo._id)
      })
      .catch(err => setError(err.message || 'Could not load staff.'))
      .finally(() => setLoading(false))
  }, [order.assignedTo])

  async function submit() {
    if (!selected) { setError('Pick a staff member to assign.'); return }
    setSaving(true); setError('')
    try {
      await apiFetch('PATCH', `/admin/orders/${order._id}/assign`, { staffId: selected })
      showToast('Order assigned. Staff member has been notified.')
      onAssigned()
    } catch (err) {
      setError(err.message || 'Could not assign order.')
      setSaving(false)
    }
  }

  return (
    <Modal
      title={`Assign order ${order.orderNumber}`}
      onClose={onClose}
      actions={[
        { label: saving ? 'Assigning…' : 'Assign & Notify', primary: true, onClick: submit, disabled: saving || loading },
        { label: 'Cancel', onClick: onClose },
      ]}
    >
      {error && <div className="mb-3 p-2.5 rounded border border-red-200 bg-red-50 text-red-700 text-[12px]">{error}</div>}

      <div className="text-[12px] text-text2 mb-3">
        The selected staff member will receive an email notification, and an in-app alert will be sent to them and to the corporate client.
      </div>

      <FormGroup label="Delivery Staff">
        {loading ? (
          <div className="text-[12px] text-text2">Loading staff…</div>
        ) : users.length === 0 ? (
          <div className="text-[12px] text-text2">
            No active staff users found. Invite one from <span className="font-medium">Admin Users → Invite User</span>.
          </div>
        ) : (
          <Select value={selected} onChange={e => setSelected(e.target.value)}>
            <option value="">— Select a staff member —</option>
            {users.map(u => (
              <option key={u._id} value={u._id}>
                {u.name} · {u.email}
              </option>
            ))}
          </Select>
        )}
      </FormGroup>

      <div className="text-[11px] text-text2 mt-2">
        Current status: <Badge status={order.status} />
        {order.assignedTo?.name && (
          <> · Currently assigned to <span className="font-medium text-text1">{order.assignedTo.name}</span></>
        )}
      </div>
    </Modal>
  )
}

function LeaveFeedbackModal({ order, onClose, onSubmitted }) {
  const [rating, setRating]   = useState(0)
  const [hover, setHover]     = useState(0)
  const [comment, setComment] = useState('')
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  async function submit() {
    if (!rating) { setError('Please pick a rating.'); return }
    setSaving(true); setError('')
    try {
      await apiFetch('POST', '/corporate/feedback', {
        order: order._id,
        rating,
        comment: comment.trim() || undefined,
      })
      showToast('Thanks for your feedback.')
      onSubmitted()
    } catch (err) {
      setError(err.message || 'Could not submit feedback.')
      setSaving(false)
    }
  }

  return (
    <Modal
      title={`Leave feedback — ${order.orderNumber}`}
      onClose={onClose}
      actions={[
        { label: saving ? 'Submitting…' : 'Submit', primary: true, onClick: submit, disabled: saving },
        { label: 'Cancel', onClick: onClose },
      ]}
    >
      {error && <div className="mb-3 p-2.5 rounded border border-red-200 bg-red-50 text-red-700 text-[12px]">{error}</div>}
      <FormGroup label="Rating">
        <div className="flex gap-1 text-[24px] leading-none select-none">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              className="cursor-pointer bg-transparent border-none p-0 text-[24px] leading-none"
            >
              {(hover || rating) >= n ? '⭐' : '☆'}
            </button>
          ))}
          {rating > 0 && <span className="ml-2 text-[13px] text-text2 self-center">{rating}/5</span>}
        </div>
      </FormGroup>
      <FormGroup label="Comment (optional)">
        <Textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Tell us about your experience…"
        />
      </FormGroup>
    </Modal>
  )
}
