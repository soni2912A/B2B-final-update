import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
  apiFetch,
  apiDownload,
  formatCurrency,
} from '../../../utils/api.js'
import {
  Badge,
  Card,
  CardHeader,
  StatCard,
  PageHeader,
  TableWrap,
  Btn,
  Loading,
  Tabs,
  FormGroup,
  Input,
  Select,
  Empty,
  showToast,
} from '../../ui/index.jsx'

// ─── Report tabs (existing analytics) ────────────────────────────────────────

const TAB_CONFIG = {
  summary:    { label: '📈 Summary',    endpoint: null },          // NEW
  sales:      { label: 'Sales',         endpoint: '/admin/reports/sales' },
  deliveries: { label: 'Deliveries',    endpoint: '/admin/reports/delivery' },
  clients:    { label: 'Clients',       endpoint: '/admin/reports/clients' },
  products:   { label: 'Products',      endpoint: '/admin/reports/products' },
}
const TABS = Object.entries(TAB_CONFIG).map(([id, v]) => ({ id, label: v.label }))

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d)) return '—'
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtShortDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d)) return '—'
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

function isoOf(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function rangeForPeriod(p) {
  if (!p || p === 'custom') return { from: '', to: '' }
  const today = new Date()
  const to = isoOf(today)
  if (p === 'today') return { from: to, to }
  if (p === 'week') {
    const s = new Date(today)
    s.setDate(s.getDate() - ((s.getDay() + 6) % 7))
    return { from: isoOf(s), to }
  }
  if (p === 'month') return { from: isoOf(new Date(today.getFullYear(), today.getMonth(), 1)), to }
  if (p === 'last30') {
    const s = new Date(today); s.setDate(s.getDate() - 30)
    return { from: isoOf(s), to }
  }
  return { from: '', to: '' }
}

const EMPTY_FILTERS = { period: '', from: '', to: '', corporate: '' }

function cleanParams(f) {
  const out = {}
  if (f.from) out.from = f.from
  if (f.to) out.to = f.to
  if (f.corporate) out.corporate = f.corporate
  return out
}

// ─── Date picker ─────────────────────────────────────────────────────────────

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

// ─── Email Schedule Section ───────────────────────────────────────────────────

function EmailScheduleSection() {
  const [schedule, setSchedule] = useState(null)
  const [emails, setEmails] = useState([])
  const [emailInput, setEmailInput] = useState('')
  const [sendTime, setSendTime] = useState('18:00')
  const [enabled, setEnabled] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    apiFetch('GET', '/report-data/email-schedule')
      .then(res => {
        const s = res.data?.schedule
        if (s) {
          setSchedule(s)
          setEmails(s.emails || [])
          setSendTime(s.sendTime || '18:00')
          setEnabled(s.enabled !== false)
        }
      })
      .catch(() => {})
  }, [])

  const addEmail = () => {
    const e = emailInput.trim().toLowerCase()
    if (!e) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { setErr('Invalid email address'); return }
    if (emails.includes(e)) { setErr('Already added'); return }
    setEmails(prev => [...prev, e])
    setEmailInput('')
    setErr('')
  }

  const removeEmail = e => setEmails(prev => prev.filter(x => x !== e))

  const handleSave = async () => {
    setSaving(true); setErr('')
    try {
      await apiFetch('POST', '/report-data/email-schedule', { emails, sendTime, enabled })
      showToast(`✅ Schedule saved! Reports will be sent daily at ${sendTime} IST`)
    } catch (e) {
      showToast('Failed to save schedule', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    if (!emails.length) { setErr('Add at least one email first'); return }
    setTesting(true); setErr('')
    try {
      await apiFetch('POST', '/report-data/email-schedule/test')
      showToast('📧 Test report sent! Check your inbox.')
    } catch (e) {
      showToast('Failed to send test email', 'error')
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card className="mt-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div>
          <div className="font-bold text-text1 text-[15px]">📧 Email Schedule</div>
          <div className="text-text2 text-[13px] mt-0.5">
            Receive this report automatically every day
            {schedule?.lastSentAt && <span> · Last sent: {fmtDate(schedule.lastSentAt)}</span>}
          </div>
        </div>
        {/* Toggle */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setEnabled(v => !v)}>
          <div
            style={{ width: 42, height: 24, borderRadius: 99, background: enabled ? '#0ea5e9' : '#D1D5DB', position: 'relative', transition: 'background .2s' }}
          >
            <div style={{
              position: 'absolute', top: 3, left: enabled ? 21 : 3,
              width: 18, height: 18, borderRadius: '50%', background: '#fff',
              transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
            }} />
          </div>
          <span className="text-[13px] font-semibold text-text1">{enabled ? 'Enabled' : 'Disabled'}</span>
        </div>
      </div>

      {/* Send Time */}
      <div className="mb-4">
        <FormGroup label="Daily Send Time (IST)">
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="time"
              value={sendTime}
              onChange={e => setSendTime(e.target.value)}
              className="px-3 py-2 border border-border2 rounded bg-surface text-text1 text-[13px] outline-none focus:border-accent"
              style={{ width: 160 }}
            />
            <span className="text-text2 text-[12px]">Reports delivered at this time every day</span>
          </div>
        </FormGroup>
      </div>

      {/* Email input */}
      <div className="mb-4">
        <FormGroup label="Recipient Emails" error={err}>
          <div className="flex gap-2">
            <input
              type="email"
              value={emailInput}
              onChange={e => { setEmailInput(e.target.value); setErr('') }}
              onKeyDown={e => e.key === 'Enter' && addEmail()}
              placeholder="admin@yourcompany.com"
              className="flex-1 px-3 py-2 border border-border2 rounded bg-surface text-text1 text-[13px] outline-none focus:border-accent"
            />
            <Btn onClick={addEmail} variant="primary" size="sm">+ Add</Btn>
          </div>
        </FormGroup>
      </div>

      {/* Email chips */}
      {emails.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {emails.map(e => (
            <div key={e} className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 text-[12px] text-blue-700 max-w-full overflow-hidden">
              <span className="truncate">📧 {e}</span>
              <button onClick={() => removeEmail(e)} className="text-blue-500 text-[14px] leading-none hover:text-blue-700">×</button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <Btn onClick={handleSave} disabled={saving} variant="primary">
          {saving ? 'Saving…' : '💾 Save Schedule'}
        </Btn>
        <Btn onClick={handleTest} disabled={testing}>
          {testing ? 'Sending…' : '🧪 Send Test Now'}
        </Btn>
      </div>
    </Card>
  )
}

// ─── Summary Dashboard Tab ────────────────────────────────────────────────────

function SummaryDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch('GET', '/report-data/admin-summary')
      setData(res.data || null)
    } catch (e) {
      showToast(e.message || 'Failed to load summary', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <Loading />
  if (!data) return <Card><Empty text="Failed to load summary data." /></Card>

  const inv    = data.invoices    || {}
  const today  = data.todayOrders || {}
  const growth = inv.revenueGrowth
  const growthLabel = growth != null
    ? (growth >= 0 ? `↑ ${growth}% vs last month` : `↓ ${Math.abs(growth)}% vs last month`)
    : null
  const growthColor = growth != null && growth < 0 ? '#DC2626' : '#16A34A'

  return (
    <>
      {/* Today's Orders strip */}
      <div className="mb-2">
        <div className="text-[11px] font-bold text-text2 uppercase tracking-widest mb-2">Today's Orders</div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <StatCard label="Total Corporates"  value={data.corporates?.total ?? '—'} />
          <StatCard label="Orders Placed"     value={today.totalPlaced ?? 0} />
          <StatCard label="✅ Delivered"       value={today.delivered   ?? 0} />
          <StatCard label="⏳ In Process"      value={today.processing  ?? 0} />
          <StatCard label="❌ Cancelled"       value={today.cancelled   ?? 0} />
          <StatCard label="💰 Today Revenue"  value={formatCurrency(today.totalRevenue || 0)} />
        </div>
      </div>

      {/* Billing KPIs */}
      <div className="text-[11px] font-bold text-text2 uppercase tracking-widest mb-2">Billing Overview</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Clients"     value={data.corporates?.active ?? '—'} />
        <StatCard label="Staff Members"      value={data.staff?.total ?? '—'} />
        <StatCard label="Total Revenue"      value={formatCurrency(inv.totalRevenue || 0)} />
        <StatCard label="This Month"         value={formatCurrency(inv.thisMonthRevenue || 0)} />
        <StatCard label="Total Invoices"     value={inv.total ?? '—'} />
        <StatCard label="Overdue Amount"     value={formatCurrency(inv.overdueRevenue || 0)} />
        <StatCard label="Admin Users"        value={data.adminUsers?.total ?? '—'} />
      </div>

      {/* Growth / growth banner */}
      {growthLabel && (
        <div className="mb-4 px-4 py-3 rounded-lg border text-[13px] font-semibold"
          style={{ background: growth >= 0 ? '#F0FDF4' : '#FEF2F2', borderColor: growth >= 0 ? '#BBF7D0' : '#FECACA', color: growthColor }}>
          {growth >= 0 ? '📈' : '📉'} Revenue {growthLabel}
        </div>
      )}

      {/* Overdue alert */}
      {inv.overdue > 0 && (
        <div className="mb-4 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-[13px] text-red-800">
          🔴 <strong>{inv.overdue} overdue invoice{inv.overdue !== 1 ? 's' : ''}</strong> totalling{' '}
          {formatCurrency(inv.overdueRevenue)} — please follow up
        </div>
      )}

      {/* Detail cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Billing breakdown */}
        <Card>
          <CardHeader title="Billing Breakdown" />
          <div className="divide-y divide-border2">
            {[
              ['Paid',    inv.paid,    '#16A34A'],
              ['Pending', inv.pending, '#D97706'],
              ['Overdue', inv.overdue, '#DC2626'],
              ['Draft',   inv.draft,   '#6B7280'],
            ].map(([lbl, val, color]) => (
              <div key={lbl} className="flex justify-between items-center py-2">
                <span className="text-[13px] text-text2">{lbl}</span>
                <span className="text-[13px] font-bold" style={{ color }}>{val ?? '—'}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Revenue breakdown */}
        <Card>
          <CardHeader title="Revenue Breakdown" />
          <div className="divide-y divide-border2">
            {[
              ['Total (Paid)',   formatCurrency(inv.totalRevenue),   '#6366F1'],
              ['This Month',     formatCurrency(inv.thisMonthRevenue), null],
              ['Last Month',     formatCurrency(inv.prevMonthRevenue), null],
              ['Overdue Amount', formatCurrency(inv.overdueRevenue),  '#DC2626'],
              ['Pending Amount', formatCurrency(inv.pendingRevenue),  '#D97706'],
            ].map(([lbl, val, color]) => (
              <div key={lbl} className="flex justify-between items-center py-2">
                <span className="text-[13px] text-text2">{lbl}</span>
                <span className="text-[13px] font-bold" style={{ color: color || undefined }}>{val}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent corporates */}
        {data.recentCorporates?.length > 0 && (
          <Card>
            <CardHeader title="Recently Added Clients" />
            <div className="divide-y divide-border2">
              {data.recentCorporates.map(c => (
                <div key={c._id} className="flex justify-between items-center py-2 gap-2">
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-text1 truncate">{c.companyName}</div>
                    <div className="text-[11px] text-text2 truncate">{c.email}</div>
                  </div>
                  <Badge status={c.status} />
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Top corporates by revenue */}
      {data.topCorporates?.length > 0 && (
        <Card className="mb-6">
          <CardHeader title="Top Clients by Revenue" />
          <div className="divide-y divide-border2">
            {data.topCorporates.map((c, i) => {
              const maxRev = data.topCorporates[0]?.totalRevenue || 1
              return (
                <div key={i} className="py-2.5">
                  <div className="flex justify-between text-[13px] mb-1">
                    <span className="font-medium text-text1">{c.companyName || '—'}</span>
                    <span className="font-bold text-accent">{formatCurrency(c.totalRevenue || 0)}</span>
                  </div>
                  <div className="h-1.5 bg-surface2 rounded overflow-hidden">
                    <div
                      className="h-full bg-accent rounded"
                      style={{ width: `${Math.round((c.totalRevenue / maxRev) * 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <EmailScheduleSection />
    </>
  )
}

// ─── Main ReportsPage ─────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [tab, setTab]           = useState('summary')
  const [filters, setFilters]   = useState(EMPTY_FILTERS)
  const [corporates, setCorps]  = useState([])
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(false)
  const [downloading, setDL]    = useState(null)

  // Load corporates list for filter dropdown
  useEffect(() => {
    apiFetch('GET', '/admin/corporates?limit=100')
      .then(r => setCorps(r.data?.corporates || []))
      .catch(() => setCorps([]))
  }, [])

  // Fetch report data when analytics tab changes
  useEffect(() => {
    if (tab === 'summary') return   // summary fetches its own data
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

  function setFilter(k, v) { setFilters(f => ({ ...f, [k]: v })) }
  function setPeriod(p) {
    const r = rangeForPeriod(p)
    setFilters(f => ({ ...f, period: p, from: r.from, to: r.to }))
  }
  function clearFilters() { setFilters(EMPTY_FILTERS) }

  async function download(format) {
    try {
      setDL(format)
      const qs = new URLSearchParams({ type: tab === 'summary' ? 'sales' : tab, format, ...cleanParams(filters) })
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
        {tab !== 'summary' && (
          <>
            <Btn size="sm" onClick={() => download('xlsx')} disabled={downloading !== null}>
              {downloading === 'xlsx' ? 'Preparing…' : '↓ Excel'}
            </Btn>
            <Btn size="sm" onClick={() => download('pdf')} disabled={downloading !== null}>
              {downloading === 'pdf' ? 'Preparing…' : '↓ PDF'}
            </Btn>
          </>
        )}
      </PageHeader>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {/* Summary tab — its own self-contained component */}
      {tab === 'summary' && <SummaryDashboard />}

      {/* Analytics tabs */}
      {tab !== 'summary' && (
        <>
          {/* Filters bar */}
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
                <Btn onClick={clearFilters}>Clear</Btn>
              </div>
            </div>
          </Card>

          {/* KPI strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Revenue"    value={formatCurrency(summary.totalRevenue || 0)} />
            <StatCard label="Total Orders"     value={summary.totalOrders || 0} />
            <StatCard label="Avg. Order Value" value={formatCurrency(summary.avgOrderValue || 0)} />
            <StatCard label="Delivery Rate"    value={`${Number(summary.deliveryRate || 0).toFixed(1)}%`} />
          </div>

          {loading ? <Loading /> : (
            tab === 'sales'      ? <SalesView data={data} /> :
            tab === 'deliveries' ? <DeliveriesView data={data} /> :
            tab === 'clients'    ? <ClientsView data={data} /> :
                                   <ProductsView data={data} />
          )}
        </>
      )}
    </div>
  )
}

// ─── Analytics sub-views (unchanged from original) ───────────────────────────

function SalesView({ data }) {
  const rows       = data?.rows || []
  const topClients = data?.topClients || []

  if (rows.length === 0 && topClients.length === 0) return <Card><Empty /></Card>

  const maxVal    = Math.max(1, ...rows.map(r => r.totalRevenue || 0))
  const maxClient = Math.max(1, ...topClients.map(c => c.totalRevenue || 0))

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Card>
          <CardHeader title="Revenue by Day" />
          {rows.length === 0 ? <Empty /> : (
            <div className="flex items-end gap-2 h-[160px] pt-2">
              {rows.map((r, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-accent-light rounded-t hover:bg-accent transition-colors cursor-pointer"
                    style={{ height: `${Math.round(((r.totalRevenue || 0) / maxVal) * 100)}%`, minHeight: 4 }}
                    title={`${fmtShortDate(r.day)} — ${formatCurrency(r.totalRevenue || 0)}`}
                  />
                  <span className="text-[10px] text-text2">{fmtShortDate(r.day).slice(0, 5)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <CardHeader title="Top Corporate Clients" />
          {topClients.length === 0 ? <Empty /> : (
            <div className="flex flex-col gap-2.5 mt-1">
              {topClients.map(c => (
                <div key={c.companyName || '—'}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{c.companyName || '—'}</span>
                    <span className="font-medium">{formatCurrency(c.totalRevenue || 0)}</span>
                  </div>
                  <div className="h-1.5 bg-surface2 rounded overflow-hidden">
                    <div className="h-full bg-accent rounded" style={{ width: `${Math.round(((c.totalRevenue || 0) / maxClient) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
      <Card noPad>
        <div className="p-5 pb-0"><span className="text-[14px] font-medium">Order Summary Table</span></div>
        {rows.length === 0 ? <Empty /> : (
          <TableWrap>
            <thead>
              <tr><th>SR.</th><th>Date</th><th>Orders</th><th>Revenue</th><th>Avg. Value</th><th>Delivered</th><th>Cancelled</th></tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.day}>
                  <td>{i + 1}</td>
                  <td>{fmtShortDate(r.day)}</td>
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
        <StatCard label="Scheduled"  value={sc.scheduled  || 0} />
        <StatCard label="In Transit" value={sc.in_transit || 0} />
        <StatCard label="Delivered"  value={sc.delivered  || 0} />
        <StatCard label="Failed"     value={sc.failed     || 0} />
      </div>
      <Card noPad>
        <div className="p-5 pb-0"><span className="text-[14px] font-medium">Deliveries</span></div>
        {rows.length === 0 ? <Empty /> : (
          <TableWrap>
            <thead>
              <tr><th>SR.</th><th>Order No.</th><th>Corporate</th><th>Assigned To</th><th>Status</th><th>Scheduled</th><th>Delivered</th></tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td className="font-medium">{r.orderNumber}</td>
                  <td className="text-text2">{r.corporate}</td>
                  <td className="text-text2">{r.assignedTo}</td>
                  <td><Badge status={r.status} /></td>
                  <td>{fmtShortDate(r.scheduledDate)}</td>
                  <td>{r.deliveredAt ? fmtShortDate(r.deliveredAt) : '—'}</td>
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
      {rows.length === 0 ? <Empty /> : (
        <TableWrap>
          <thead>
            <tr><th>SR.</th><th>Corporate</th><th>Orders</th><th>Revenue</th><th>Avg. Value</th><th>Last Order</th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td className="font-medium">{r.companyName || '—'}</td>
                <td>{r.totalOrders}</td>
                <td className="font-medium">{formatCurrency(r.totalRevenue || 0)}</td>
                <td>{formatCurrency(r.avgOrderValue || 0)}</td>
                <td>{r.lastOrderDate ? fmtShortDate(r.lastOrderDate) : '—'}</td>
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
      {rows.length === 0 ? <Empty /> : (
        <TableWrap>
          <thead>
            <tr><th>SR.</th><th>Product Name</th><th>SKU</th><th>Units Sold</th><th>Revenue</th></tr>
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