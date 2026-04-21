// import React, { useEffect, useRef, useState } from 'react'
// import { apiFetch, apiDownload, formatCurrency, formatDate } from '../../../utils/api.js'
// import { Badge, Card, CardHeader, StatCard, PageHeader, TableWrap, Btn, Loading, Tabs, FormGroup, Input, Select, Empty } from '../../ui/index.jsx'
// import { showToast } from '../../ui/index.jsx'

// const TAB_CONFIG = {
//   sales:      { label: 'Sales',      endpoint: '/admin/reports/sales' },
//   deliveries: { label: 'Deliveries', endpoint: '/admin/reports/delivery' },
//   clients:    { label: 'Clients',    endpoint: '/admin/reports/clients' },
//   products:   { label: 'Products',   endpoint: '/admin/reports/products' },
// }
// const TABS = Object.entries(TAB_CONFIG).map(([id, v]) => ({ id, label: v.label }))

// // ─── Date helpers ────────────────────────────────────────────────────────────
// // Backend speaks ISO (YYYY-MM-DD). UI displays and accepts DD/MM/YYYY.
// function isoToDisplay(iso) {
//   if (!iso) return ''
//   const [y, m, d] = iso.split('-')
//   if (!y || !m || !d) return ''
//   return `${d}/${m}/${y}`
// }
// function displayToIso(display) {
//   if (!display) return ''
//   const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(display.trim())
//   if (!m) return null
//   const [, d, mo, y] = m
//   const dt = new Date(`${y}-${mo}-${d}T00:00:00`)
//   if (Number.isNaN(dt.getTime())) return null
//   return `${y}-${mo}-${d}`
// }

// // Typeable DD/MM/YYYY input. Parent holds ISO; this owns the display draft and
// // only fires onChange when the user completes a valid DD/MM/YYYY or clears it.
// function DateInput({ value, onChange, placeholder = 'DD/MM/YYYY' }) {
//   const [draft, setDraft] = useState(isoToDisplay(value))
//   useEffect(() => { setDraft(isoToDisplay(value)) }, [value])

//   function handleChange(e) {
//     const v = e.target.value
//     setDraft(v)
//     if (v === '') { onChange(''); return }
//     const iso = displayToIso(v)
//     if (iso) onChange(iso)
//   }

//   function handleBlur() {
//     if (draft && !displayToIso(draft)) {
//       setDraft(isoToDisplay(value))
//     }
//   }

//   return (
//     <Input
//       value={draft}
//       onChange={handleChange}
//       onBlur={handleBlur}
//       placeholder={placeholder}
//       inputMode="numeric"
//       maxLength={10}
//     />
//   )
// }

// // ─── Period helpers ──────────────────────────────────────────────────────────
// function isoOf(d) {
//   const y  = d.getFullYear()
//   const mo = String(d.getMonth() + 1).padStart(2, '0')
//   const da = String(d.getDate()).padStart(2, '0')
//   return `${y}-${mo}-${da}`
// }
// function rangeForPeriod(p) {
//   if (!p || p === 'custom') return { from: '', to: '' }
//   const today = new Date()
//   const to = isoOf(today)
//   if (p === 'today')  return { from: to, to }
//   if (p === 'week') {
//     const s = new Date(today)
//     const dow = s.getDay() // 0=Sun … 6=Sat
//     const diff = (dow + 6) % 7 // days back to Monday
//     s.setDate(s.getDate() - diff)
//     return { from: isoOf(s), to }
//   }
//   if (p === 'month') {
//     const s = new Date(today.getFullYear(), today.getMonth(), 1)
//     return { from: isoOf(s), to }
//   }
//   if (p === 'last30') {
//     const s = new Date(today); s.setDate(s.getDate() - 30)
//     return { from: isoOf(s), to }
//   }
//   return { from: '', to: '' }
// }

// const EMPTY_FILTERS = { period: '', from: '', to: '', corporate: '' }

// function cleanParams(f) {
//   const out = {}
//   if (f.from)      out.from = f.from
//   if (f.to)        out.to = f.to
//   if (f.corporate) out.corporate = f.corporate
//   return out
// }

// // ─── Main page ──────────────────────────────────────────────────────────────
// export default function ReportsPage() {
//   const [tab, setTab]           = useState('sales')
//   const [filters, setFilters]   = useState(EMPTY_FILTERS)
//   const [corporates, setCorps]  = useState([])
//   const [data, setData]         = useState(null)
//   const [loading, setLoading]   = useState(false)
//   const [downloading, setDL]    = useState(null) // 'xlsx' | 'pdf' | null

//   // Populate corporate dropdown once
//   useEffect(() => {
//     (async () => {
//       try {
//         const r = await apiFetch('GET', '/admin/corporates?limit=100')
//         setCorps(r.data?.corporates || [])
//       } catch {
//         // Dropdown stays empty on failure — not fatal for the report view
//         setCorps([])
//       }
//     })()
//   }, [])

//   // Fetch report whenever tab or filters change
//   useEffect(() => {
//     let cancelled = false
//     async function run() {
//       setLoading(true)
//       const qs = new URLSearchParams(cleanParams(filters))
//       try {
//         const res = await apiFetch('GET', `${TAB_CONFIG[tab].endpoint}?${qs.toString()}`)
//         if (!cancelled) setData(res.data || {})
//       } catch (err) {
//         if (!cancelled) {
//           setData({})
//           showToast(err.message || 'Failed to load report.', 'error')
//         }
//       } finally {
//         if (!cancelled) setLoading(false)
//       }
//     }
//     run()
//     return () => { cancelled = true }
//   }, [tab, filters.from, filters.to, filters.corporate])

//   function setFilter(k, v) {
//     setFilters(f => ({ ...f, [k]: v }))
//   }
//   function setPeriod(p) {
//     const r = rangeForPeriod(p)
//     setFilters(f => ({ ...f, period: p, from: r.from, to: r.to }))
//   }
//   function clearFilters() {
//     setFilters(EMPTY_FILTERS)
//   }

//   async function download(format) {
//     try {
//       setDL(format)
//       const qs = new URLSearchParams({ type: tab, format, ...cleanParams(filters) })
//       const date = new Date().toISOString().slice(0, 10)
//       await apiDownload(`/admin/reports/export?${qs.toString()}`, `${tab}-report-${date}.${format}`)
//       showToast('Report downloaded.')
//     } catch (err) {
//       showToast(err.message || 'Export failed.', 'error')
//     } finally {
//       setDL(null)
//     }
//   }

//   const summary = data?.summary || {}

//   return (
//     <div>
//       <PageHeader title="Reports & Analytics">
//         <Btn size="sm" onClick={() => download('xlsx')} disabled={downloading !== null} title="Download as Excel">
//           {downloading === 'xlsx' ? 'Preparing…' : '↓ Excel'}
//         </Btn>
//         <Btn size="sm" onClick={() => download('pdf')} disabled={downloading !== null} title="Download as PDF">
//           {downloading === 'pdf' ? 'Preparing…' : '↓ PDF'}
//         </Btn>
//       </PageHeader>

//       <Tabs tabs={TABS} active={tab} onChange={setTab} />

//       {/* Filters */}
//       <Card className="mb-5">
//         <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
//           <FormGroup label="Period">
//             <Select value={filters.period} onChange={e => setPeriod(e.target.value)}>
//               <option value="">Select Period</option>
//               <option value="today">Today</option>
//               <option value="week">This Week</option>
//               <option value="month">This Month</option>
//               <option value="last30">Last 30 Days</option>
//               <option value="custom">Custom</option>
//             </Select>
//           </FormGroup>
//           <FormGroup label="From" hint="DD/MM/YYYY">
//             <DateInput value={filters.from} onChange={v => setFilter('from', v)} />
//           </FormGroup>
//           <FormGroup label="To" hint="DD/MM/YYYY">
//             <DateInput value={filters.to} onChange={v => setFilter('to', v)} />
//           </FormGroup>
//           <FormGroup label="Corporate">
//             <Select value={filters.corporate} onChange={e => setFilter('corporate', e.target.value)}>
//               <option value="">All Clients</option>
//               {corporates.map(c => <option key={c._id} value={c._id}>{c.companyName}</option>)}
//             </Select>
//           </FormGroup>
//           <div className="flex items-end">
//             <Btn onClick={clearFilters} title="Reset all filters">Clear</Btn>
//           </div>
//         </div>
//       </Card>

//       {/* Stat cards — same shape on every tab, fed from data.summary */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
//         <StatCard label="Total Revenue"     value={formatCurrency(summary.totalRevenue || 0)} />
//         <StatCard label="Total Orders"      value={summary.totalOrders || 0} />
//         <StatCard label="Avg. Order Value"  value={formatCurrency(summary.avgOrderValue || 0)} />
//         <StatCard label="Delivery Rate"     value={`${Number(summary.deliveryRate || 0).toFixed(1)}%`} />
//       </div>

//       {loading ? <Loading /> : (
//         tab === 'sales'      ? <SalesView data={data} /> :
//         tab === 'deliveries' ? <DeliveriesView data={data} /> :
//         tab === 'clients'    ? <ClientsView data={data} /> :
//                                <ProductsView data={data} />
//       )}
//     </div>
//   )
// }

// // ─── Per-tab views ───────────────────────────────────────────────────────────
// function SalesView({ data }) {
//   const rows       = data?.rows || []
//   const topClients = data?.topClients || []

//   if (rows.length === 0 && topClients.length === 0) {
//     return <Card><Empty text="No records found." /></Card>
//   }

//   const maxVal = Math.max(1, ...rows.map(r => r.totalRevenue || 0))
//   const maxClient = Math.max(1, ...topClients.map(c => c.totalRevenue || 0))

//   return (
//     <>
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
//         <Card>
//           <CardHeader title="Revenue by Day" />
//           {rows.length === 0 ? <Empty text="No records found." /> : (
//             <div className="flex items-end gap-2 h-[160px] pt-2">
//               {rows.map((r, i) => (
//                 <div key={i} className="flex-1 flex flex-col items-center gap-1">
//                   <div
//                     className="w-full bg-accent-light rounded-t hover:bg-accent transition-colors cursor-pointer"
//                     style={{ height: `${Math.round(((r.totalRevenue || 0) / maxVal) * 100)}%`, minHeight: '4px' }}
//                     title={`${formatDate(r.day)} — ${formatCurrency(r.totalRevenue || 0)}`}
//                   />
//                   <span className="text-[10px] text-text2">{formatDate(r.day).slice(0, 5)}</span>
//                 </div>
//               ))}
//             </div>
//           )}
//         </Card>

//         <Card>
//           <CardHeader title="Top Corporate Clients" />
//           {topClients.length === 0 ? <Empty text="No records found." /> : (
//             <div className="flex flex-col gap-2.5 mt-1">
//               {topClients.map(c => (
//                 <div key={c.companyName || '—'}>
//                   <div className="flex justify-between text-xs mb-1">
//                     <span>{c.companyName || '—'}</span>
//                     <span className="font-medium">{formatCurrency(c.totalRevenue || 0)}</span>
//                   </div>
//                   <div className="h-1.5 bg-surface2 rounded overflow-hidden">
//                     <div
//                       className="h-full bg-accent rounded"
//                       style={{ width: `${Math.round(((c.totalRevenue || 0) / maxClient) * 100)}%` }}
//                     />
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </Card>
//       </div>

//       <Card noPad>
//         <div className="p-5 pb-0"><span className="text-[14px] font-medium">Order Summary Table</span></div>
//         {rows.length === 0 ? <Empty text="No records found." /> : (
//           <TableWrap>
//             <thead>
//               <tr>
//                 <th>SR. No.</th><th>Date</th><th>Orders</th><th>Revenue</th><th>Avg. Value</th><th>Delivered</th><th>Cancelled</th>
//               </tr>
//             </thead>
//             <tbody>
//               {rows.map((r, i) => (
//                 <tr key={r.day}>
//                   <td>{i + 1}</td>
//                   <td>{formatDate(r.day)}</td>
//                   <td>{r.totalOrders}</td>
//                   <td className="font-medium">{formatCurrency(r.totalRevenue || 0)}</td>
//                   <td>{formatCurrency(r.avgOrderValue || 0)}</td>
//                   <td>{r.delivered}</td>
//                   <td>{r.cancelled}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </TableWrap>
//         )}
//       </Card>
//     </>
//   )
// }

// function DeliveriesView({ data }) {
//   const rows = data?.rows || []
//   const sc   = data?.statusCounts || {}

//   return (
//     <>
//       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
//         <StatCard label="Scheduled"  value={sc.scheduled   || 0} />
//         <StatCard label="In Transit" value={sc.in_transit || 0} />
//         <StatCard label="Delivered"  value={sc.delivered   || 0} />
//         <StatCard label="Failed"     value={sc.failed      || 0} />
//       </div>

//       <Card noPad>
//         <div className="p-5 pb-0"><span className="text-[14px] font-medium">Deliveries</span></div>
//         {rows.length === 0 ? <Empty text="No records found." /> : (
//           <TableWrap>
//             <thead>
//               <tr><th>SR. No.</th><th>Order No.</th><th>Corporate</th><th>Assigned To</th><th>Status</th><th>Scheduled Date</th><th>Delivered On</th></tr>
//             </thead>
//             <tbody>
//               {rows.map((r, i) => (
//                 <tr key={i}>
//                   <td>{i + 1}</td>
//                   <td className="font-medium">{r.orderNumber}</td>
//                   <td className="text-text2">{r.corporate}</td>
//                   <td className="text-text2">{r.assignedTo}</td>
//                   <td><Badge status={r.status} /></td>
//                   <td>{formatDate(r.scheduledDate)}</td>
//                   <td>{r.deliveredAt ? formatDate(r.deliveredAt) : '—'}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </TableWrap>
//         )}
//       </Card>
//     </>
//   )
// }

// function ClientsView({ data }) {
//   const rows = data?.rows || []
//   return (
//     <Card noPad>
//       <div className="p-5 pb-0"><span className="text-[14px] font-medium">Corporate Clients Ranking</span></div>
//       {rows.length === 0 ? <Empty text="No records found." /> : (
//         <TableWrap>
//           <thead>
//             <tr><th>SR. No.</th><th>Corporate</th><th>Total Orders</th><th>Total Revenue</th><th>Avg. Order Value</th><th>Last Order Date</th></tr>
//           </thead>
//           <tbody>
//             {rows.map((r, i) => (
//               <tr key={i}>
//                 <td>{i + 1}</td>
//                 <td className="font-medium">{r.companyName || '—'}</td>
//                 <td>{r.totalOrders}</td>
//                 <td className="font-medium">{formatCurrency(r.totalRevenue || 0)}</td>
//                 <td>{formatCurrency(r.avgOrderValue || 0)}</td>
//                 <td>{r.lastOrderDate ? formatDate(r.lastOrderDate) : '—'}</td>
//               </tr>
//             ))}
//           </tbody>
//         </TableWrap>
//       )}
//     </Card>
//   )
// }

// function ProductsView({ data }) {
//   const rows = data?.rows || []
//   return (
//     <Card noPad>
//       <div className="p-5 pb-0"><span className="text-[14px] font-medium">Best-Selling Products</span></div>
//       {rows.length === 0 ? <Empty text="No records found." /> : (
//         <TableWrap>
//           <thead>
//             <tr><th>SR. No.</th><th>Product Name</th><th>SKU</th><th>Units Sold</th><th>Revenue</th></tr>
//           </thead>
//           <tbody>
//             {rows.map((r, i) => (
//               <tr key={i}>
//                 <td>{i + 1}</td>
//                 <td className="font-medium">{r.productName || '—'}</td>
//                 <td><span className="font-mono text-[12px]">{r.sku || '—'}</span></td>
//                 <td>{r.unitsSold || 0}</td>
//                 <td className="font-medium">{formatCurrency(r.revenue || 0)}</td>
//               </tr>
//             ))}
//           </tbody>
//         </TableWrap>
//       )}
//     </Card>
//   )
// }


import React, { useEffect, useRef, useState } from 'react'
import { apiFetch, apiDownload, formatCurrency, formatDate } from '../../../utils/api.js'
import { Badge, Card, CardHeader, StatCard, PageHeader, TableWrap, Btn, Loading, Tabs, FormGroup, Input, Select, Empty } from '../../ui/index.jsx'
import { showToast } from '../../ui/index.jsx'

const TAB_CONFIG = {
  sales:      { label: 'Sales',      endpoint: '/admin/reports/sales' },
  deliveries: { label: 'Deliveries', endpoint: '/admin/reports/delivery' },
  clients:    { label: 'Clients',    endpoint: '/admin/reports/clients' },
  products:   { label: 'Products',   endpoint: '/admin/reports/products' },
}
const TABS = Object.entries(TAB_CONFIG).map(([id, v]) => ({ id, label: v.label }))

// ─── Date input ─────────────────────────────────────────────────────────────
function DateInput({ value, onChange }) {
  return (
    <input
      type="date"
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      max={new Date().toISOString().slice(0, 10)}
      className="w-full px-3 py-2 border border-border2 rounded bg-surface text-text1 text-[13px] outline-none focus:border-accent cursor-pointer"
    />
  )
}

// ─── Period helpers ──────────────────────────────────────────────────────────
function isoOf(d) {
  const y  = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const da = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${da}`
}
function rangeForPeriod(p) {
  if (!p || p === 'custom') return { from: '', to: '' }
  const today = new Date()
  const to = isoOf(today)
  if (p === 'today')  return { from: to, to }
  if (p === 'week') {
    const s = new Date(today)
    const dow = s.getDay() // 0=Sun … 6=Sat
    const diff = (dow + 6) % 7 // days back to Monday
    s.setDate(s.getDate() - diff)
    return { from: isoOf(s), to }
  }
  if (p === 'month') {
    const s = new Date(today.getFullYear(), today.getMonth(), 1)
    return { from: isoOf(s), to }
  }
  if (p === 'last30') {
    const s = new Date(today); s.setDate(s.getDate() - 30)
    return { from: isoOf(s), to }
  }
  return { from: '', to: '' }
}

const EMPTY_FILTERS = { period: '', from: '', to: '', corporate: '' }

function cleanParams(f) {
  const out = {}
  if (f.from)      out.from = f.from
  if (f.to)        out.to = f.to
  if (f.corporate) out.corporate = f.corporate
  return out
}

// ─── Main page ──────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [tab, setTab]           = useState('sales')
  const [filters, setFilters]   = useState(EMPTY_FILTERS)
  const [corporates, setCorps]  = useState([])
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(false)
  const [downloading, setDL]    = useState(null) // 'xlsx' | 'pdf' | null

  // Populate corporate dropdown once
  useEffect(() => {
    (async () => {
      try {
        const r = await apiFetch('GET', '/admin/corporates?limit=100')
        setCorps(r.data?.corporates || [])
      } catch {
        // Dropdown stays empty on failure — not fatal for the report view
        setCorps([])
      }
    })()
  }, [])

  // Fetch report whenever tab or filters change
  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      const qs = new URLSearchParams(cleanParams(filters))
      try {
        const res = await apiFetch('GET', `${TAB_CONFIG[tab].endpoint}?${qs.toString()}`)
        if (!cancelled) setData(res.data || {})
      } catch (err) {
        if (!cancelled) {
          setData({})
          showToast(err.message || 'Failed to load report.', 'error')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [tab, filters.from, filters.to, filters.corporate])

  function setFilter(k, v) {
    setFilters(f => ({ ...f, [k]: v }))
  }
  function setPeriod(p) {
    const r = rangeForPeriod(p)
    setFilters(f => ({ ...f, period: p, from: r.from, to: r.to }))
  }
  function clearFilters() {
    setFilters(EMPTY_FILTERS)
  }

  async function download(format) {
    try {
      setDL(format)
      const qs = new URLSearchParams({ type: tab, format, ...cleanParams(filters) })
      const date = new Date().toISOString().slice(0, 10)
      await apiDownload(`/admin/reports/export?${qs.toString()}`, `${tab}-report-${date}.${format}`)
      showToast('Report downloaded.')
    } catch (err) {
      showToast(err.message || 'Export failed.', 'error')
    } finally {
      setDL(null)
    }
  }

  const summary = data?.summary || {}

  return (
    <div>
      <PageHeader title="Reports & Analytics">
        <Btn size="sm" onClick={() => download('xlsx')} disabled={downloading !== null} title="Download as Excel">
          {downloading === 'xlsx' ? 'Preparing…' : '↓ Excel'}
        </Btn>
        <Btn size="sm" onClick={() => download('pdf')} disabled={downloading !== null} title="Download as PDF">
          {downloading === 'pdf' ? 'Preparing…' : '↓ PDF'}
        </Btn>
      </PageHeader>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {/* Filters */}
      <Card className="mb-5">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <FormGroup label="Period">
            <Select value={filters.period} onChange={e => setPeriod(e.target.value)}>
              <option value="">Select Period</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="last30">Last 30 Days</option>
              <option value="custom">Custom</option>
            </Select>
          </FormGroup>
          <FormGroup label="From">
            <DateInput value={filters.from} onChange={v => setFilter('from', v)} />
          </FormGroup>
          <FormGroup label="To">
            <DateInput value={filters.to} onChange={v => setFilter('to', v)} />
          </FormGroup>
          <FormGroup label="Corporate">
            <Select value={filters.corporate} onChange={e => setFilter('corporate', e.target.value)}>
              <option value="">All Clients</option>
              {corporates.map(c => <option key={c._id} value={c._id}>{c.companyName}</option>)}
            </Select>
          </FormGroup>
          <div className="flex items-end">
            <Btn onClick={clearFilters} title="Reset all filters">Clear</Btn>
          </div>
        </div>
      </Card>

      {/* Stat cards — same shape on every tab, fed from data.summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Revenue"     value={formatCurrency(summary.totalRevenue || 0)} />
        <StatCard label="Total Orders"      value={summary.totalOrders || 0} />
        <StatCard label="Avg. Order Value"  value={formatCurrency(summary.avgOrderValue || 0)} />
        <StatCard label="Delivery Rate"     value={`${Number(summary.deliveryRate || 0).toFixed(1)}%`} />
      </div>

      {loading ? <Loading /> : (
        tab === 'sales'      ? <SalesView data={data} /> :
        tab === 'deliveries' ? <DeliveriesView data={data} /> :
        tab === 'clients'    ? <ClientsView data={data} /> :
                               <ProductsView data={data} />
      )}
    </div>
  )
}

// ─── Per-tab views ───────────────────────────────────────────────────────────
function SalesView({ data }) {
  const rows       = data?.rows || []
  const topClients = data?.topClients || []

  if (rows.length === 0 && topClients.length === 0) {
    return <Card><Empty text="No records found." /></Card>
  }

  const maxVal = Math.max(1, ...rows.map(r => r.totalRevenue || 0))
  const maxClient = Math.max(1, ...topClients.map(c => c.totalRevenue || 0))

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Card>
          <CardHeader title="Revenue by Day" />
          {rows.length === 0 ? <Empty text="No records found." /> : (
            <div className="flex items-end gap-2 h-[160px] pt-2">
              {rows.map((r, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-accent-light rounded-t hover:bg-accent transition-colors cursor-pointer"
                    style={{ height: `${Math.round(((r.totalRevenue || 0) / maxVal) * 100)}%`, minHeight: '4px' }}
                    title={`${formatDate(r.day)} — ${formatCurrency(r.totalRevenue || 0)}`}
                  />
                  <span className="text-[10px] text-text2">{formatDate(r.day).slice(0, 5)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Top Corporate Clients" />
          {topClients.length === 0 ? <Empty text="No records found." /> : (
            <div className="flex flex-col gap-2.5 mt-1">
              {topClients.map(c => (
                <div key={c.companyName || '—'}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{c.companyName || '—'}</span>
                    <span className="font-medium">{formatCurrency(c.totalRevenue || 0)}</span>
                  </div>
                  <div className="h-1.5 bg-surface2 rounded overflow-hidden">
                    <div
                      className="h-full bg-accent rounded"
                      style={{ width: `${Math.round(((c.totalRevenue || 0) / maxClient) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card noPad>
        <div className="p-5 pb-0"><span className="text-[14px] font-medium">Order Summary Table</span></div>
        {rows.length === 0 ? <Empty text="No records found." /> : (
          <TableWrap>
            <thead>
              <tr>
                <th>SR. No.</th><th>Date</th><th>Orders</th><th>Revenue</th><th>Avg. Value</th><th>Delivered</th><th>Cancelled</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.day}>
                  <td>{i + 1}</td>
                  <td>{formatDate(r.day)}</td>
                  <td>{r.totalOrders}</td>
                  <td className="font-medium">{formatCurrency(r.totalRevenue || 0)}</td>
                  <td>{formatCurrency(r.avgOrderValue || 0)}</td>
                  <td>{r.delivered}</td>
                  <td>{r.cancelled}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>
    </>
  )
}

function DeliveriesView({ data }) {
  const rows = data?.rows || []
  const sc   = data?.statusCounts || {}

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <StatCard label="Scheduled"  value={sc.scheduled   || 0} />
        <StatCard label="In Transit" value={sc.in_transit || 0} />
        <StatCard label="Delivered"  value={sc.delivered   || 0} />
        <StatCard label="Failed"     value={sc.failed      || 0} />
      </div>

      <Card noPad>
        <div className="p-5 pb-0"><span className="text-[14px] font-medium">Deliveries</span></div>
        {rows.length === 0 ? <Empty text="No records found." /> : (
          <TableWrap>
            <thead>
              <tr><th>SR. No.</th><th>Order No.</th><th>Corporate</th><th>Assigned To</th><th>Status</th><th>Scheduled Date</th><th>Delivered On</th></tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td className="font-medium">{r.orderNumber}</td>
                  <td className="text-text2">{r.corporate}</td>
                  <td className="text-text2">{r.assignedTo}</td>
                  <td><Badge status={r.status} /></td>
                  <td>{formatDate(r.scheduledDate)}</td>
                  <td>{r.deliveredAt ? formatDate(r.deliveredAt) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>
    </>
  )
}

function ClientsView({ data }) {
  const rows = data?.rows || []
  return (
    <Card noPad>
      <div className="p-5 pb-0"><span className="text-[14px] font-medium">Corporate Clients Ranking</span></div>
      {rows.length === 0 ? <Empty text="No records found." /> : (
        <TableWrap>
          <thead>
            <tr><th>SR. No.</th><th>Corporate</th><th>Total Orders</th><th>Total Revenue</th><th>Avg. Order Value</th><th>Last Order Date</th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td className="font-medium">{r.companyName || '—'}</td>
                <td>{r.totalOrders}</td>
                <td className="font-medium">{formatCurrency(r.totalRevenue || 0)}</td>
                <td>{formatCurrency(r.avgOrderValue || 0)}</td>
                <td>{r.lastOrderDate ? formatDate(r.lastOrderDate) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </Card>
  )
}

function ProductsView({ data }) {
  const rows = data?.rows || []
  return (
    <Card noPad>
      <div className="p-5 pb-0"><span className="text-[14px] font-medium">Best-Selling Products</span></div>
      {rows.length === 0 ? <Empty text="No records found." /> : (
        <TableWrap>
          <thead>
            <tr><th>SR. No.</th><th>Product Name</th><th>SKU</th><th>Units Sold</th><th>Revenue</th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td className="font-medium">{r.productName || '—'}</td>
                <td><span className="font-mono text-[12px]">{r.sku || '—'}</span></td>
                <td>{r.unitsSold || 0}</td>
                <td className="font-medium">{formatCurrency(r.revenue || 0)}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </Card>
  )
}