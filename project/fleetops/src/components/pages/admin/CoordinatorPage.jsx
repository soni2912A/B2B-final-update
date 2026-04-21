import React, { useCallback, useEffect, useState } from 'react'
import { apiFetch, formatDate, formatTime, initials, formatCurrency, BACKEND_BASE } from '../../../utils/api.js'
import { Card, PageHeader, Btn, Loading, Empty, Badge, showToast } from '../../ui/index.jsx'
import { MarkDeliveredModal } from './DeliveriesPage.jsx'

// ─── Proof Image Lightbox ────────────────────────────────────────────────────
function ProofLightbox({ url, onClose }) {
  // Close on Escape key
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="relative max-w-[90vw] max-h-[90vh] bg-surface rounded-xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white text-[16px] hover:bg-black/80 transition-colors"
          title="Close"
        >✕</button>
        <img
          src={url}
          alt="Proof of delivery"
          className="block max-w-[90vw] max-h-[90vh] object-contain"
        />
      </div>
    </div>
  )
}

export default function CoordinatorPage() {
  const [deliveries, setDeliveries] = useState([])
  const [todayOrders, setTodayOrders] = useState([])
  const [loading, setLoading]       = useState(true)
  const [marking, setMarking]       = useState(null)
  const [proofUrl, setProofUrl]     = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const today = new Date().toISOString().slice(0, 10)
      const [delRes, ordRes] = await Promise.allSettled([
        apiFetch('GET', '/admin/deliveries/today'),
        apiFetch('GET', `/admin/orders?from=${today}&to=${today}&limit=100`),
      ])
      setDeliveries(delRes.status === 'fulfilled' ? delRes.value.data?.deliveries || [] : [])
      setTodayOrders(ordRes.status === 'fulfilled' ? ordRes.value.data?.orders || [] : [])
    } catch (err) {
      showToast(err.message || 'Failed to load deliveries.', 'error')
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { load() }, [load])

  async function quickInTransit(id) {
    try {
      await apiFetch('PATCH', `/admin/deliveries/${id}/in-transit`, {})
      showToast('Marked in transit.')
      load()
    } catch (err) {
      showToast(err.message || 'Could not update status.', 'error')
    }
  }

  const pending = deliveries.filter(d => d.status !== 'delivered' && d.status !== 'failed' && d.status !== 'cancelled')
  const done    = deliveries.filter(d => d.status === 'delivered')
  const problem = deliveries.filter(d => d.status === 'failed' || d.status === 'cancelled')
  const totalCount = deliveries.length + todayOrders.length

  return (
    <div>
      <PageHeader
        title="Today's Deliveries"
        subtitle={`${totalCount} scheduled for today · ${done.length} delivered · ${pending.length} pending${problem.length ? ` · ${problem.length} failed` : ''}`}
      >
        <Btn size="sm" onClick={load}>↻ Refresh</Btn>
      </PageHeader>

      {loading ? (
        <Loading />
      ) : (deliveries.length === 0 && todayOrders.length === 0) ? (
        <Card>
          <Empty icon="🚚" text="No deliveries scheduled for today." />
        </Card>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="mb-5">
              <div className="text-[12px] font-semibold text-text1 uppercase tracking-wider mb-2">Pending Deliveries · {pending.length}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pending.map(d => (
                  <DeliveryCard
                    key={d._id}
                    delivery={d}
                    onMarkDelivered={() => setMarking(d)}
                    onMarkInTransit={() => quickInTransit(d._id)}
                    onViewProof={url => setProofUrl(url)}
                  />
                ))}
              </div>
            </div>
          )}

          {todayOrders.length > 0 && (
            <div className="mb-5">
              <div className="text-[12px] font-semibold text-text1 uppercase tracking-wider mb-2">Today's Orders · {todayOrders.length}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {todayOrders.map(o => (
                  <div key={o._id} className="bg-surface border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="font-mono text-[12px] text-text2">{o.orderNumber}</div>
                        <div className="font-medium text-[14px]">{o.corporate?.companyName || '—'}</div>
                      </div>
                      <Badge status={o.status} />
                    </div>
                    <div className="flex items-center justify-between text-[12px] text-text2 mt-2">
                      <span>{o.items?.length || 1} item(s)</span>
                      <span className="font-semibold text-text1">{formatCurrency(o.totalAmount)}</span>
                    </div>
                    {o.assignedTo?.name && (
                      <div className="flex items-center gap-2 mt-2 text-[12px] text-text2">
                        <div className="w-5 h-5 rounded-full bg-accent-light flex items-center justify-center text-[9px] font-semibold text-accent">{initials(o.assignedTo.name)}</div>
                        <span>{o.assignedTo.name}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {done.length > 0 && (
            <div className="mb-5">
              <div className="text-[12px] font-semibold text-text1 uppercase tracking-wider mb-2">Completed · {done.length}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {done.map(d => <DeliveryCard key={d._id} delivery={d} readOnly onViewProof={url => setProofUrl(url)} />)}
              </div>
            </div>
          )}

          {problem.length > 0 && (
            <div>
              <div className="text-[12px] font-semibold text-text1 uppercase tracking-wider mb-2">Failed · {problem.length}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {problem.map(d => <DeliveryCard key={d._id} delivery={d} readOnly onViewProof={url => setProofUrl(url)} />)}
              </div>
            </div>
          )}
        </>
      )}

      {marking && (
        <MarkDeliveredModal
          delivery={marking}
          onClose={() => setMarking(null)}
          onDone={() => { setMarking(null); load() }}
        />
      )}

      {proofUrl && (
        <ProofLightbox url={proofUrl} onClose={() => setProofUrl(null)} />
      )}
    </div>
  )
}

function DeliveryCard({ delivery: d, onMarkDelivered, onMarkInTransit, onViewProof, readOnly }) {
  const statusPill = {
    scheduled:   'bg-blue-50 text-blue-700',
    in_transit:  'bg-amber-50 text-amber-700',
    rescheduled: 'bg-amber-50 text-amber-700',
    delivered:   'bg-green-50 text-green-700',
    failed:      'bg-red-50 text-red-700',
    cancelled:   'bg-gray-100 text-gray-600',
  }[d.status] || 'bg-gray-100 text-gray-600'

  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="font-mono text-[12px] text-text2">{d.order?.orderNumber || '—'}</div>
          <div className="font-medium text-[14px]">{d.corporate?.companyName || '—'}</div>
        </div>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${statusPill}`}>
          {String(d.status || '').replace(/_/g, ' ')}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-2 text-[12px] text-text2">
        <div className="w-6 h-6 rounded-full bg-accent-light flex items-center justify-center text-[10px] font-semibold text-accent flex-shrink-0">
          {initials(d.assignedTo?.name || '?')}
        </div>
        <span>{d.assignedTo?.name || 'Unassigned'}</span>
        <span className="ml-auto">{formatTime(d.scheduledDate)} · {formatDate(d.scheduledDate)}</span>
      </div>

      {d.deliveryAddress?.street && (
        <div className="text-[12px] text-text2 mb-2 line-clamp-2">{d.deliveryAddress.street}</div>
      )}

      {d.failureReason && (
        <div className="text-[11px] text-red-700 bg-red-50 rounded px-2 py-1 mb-2">⨯ {d.failureReason}</div>
      )}

      {!readOnly && (
        <div className="flex gap-2 mt-2">
          {(d.status === 'scheduled' || d.status === 'rescheduled') && (
            <Btn size="sm" onClick={onMarkInTransit}>→ In Transit</Btn>
          )}
          <Btn size="sm" variant="primary" onClick={onMarkDelivered}>✓ Mark Delivered</Btn>
        </div>
      )}

      {d.proofOfDelivery && (
        <div className="mt-2 pt-2 border-t border-border text-[11px] text-text2">
          Proof:{' '}
          <button
            onClick={() => onViewProof && onViewProof(`${BACKEND_BASE}${d.proofOfDelivery}`)}
            className="text-accent hover:underline font-medium"
          >view</button>
        </div>
      )}
    </div>
  )
}