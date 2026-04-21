import React, { useEffect, useState } from 'react'
import { apiFetch, formatDate, formatCurrency, initials } from '../../../utils/api.js'
import { Card, CardHeader, StatCard, Badge, TableWrap, Btn, Loading } from '../../ui/index.jsx'
import { useApp } from '../../../AppContext.jsx'

export default function AdminDashboard() {
  const { navigate, role } = useApp()
  const [data, setData] = useState(null)
  const isStaff = role === 'staff'

  useEffect(() => {
    apiFetch('GET', '/admin/dashboard').then(res => setData(res.data || {})).catch(() => setData({}))
  }, [])

  if (!data) return <Loading />

  const s = data.stats || { totalOrders: 248, totalDeliveries: 186, totalRevenue: 94200, totalCorporates: 34, pendingOrders: 12, todayDeliveries: 8 }
  const recentOrders = data.recentOrders || mockOrders(5)
  const upcoming     = data.upcomingDeliveries || mockDeliveries(4)
  const barData = [52, 67, 43, 78, 89, 61, 94]
  const barLabels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  const maxBar = Math.max(...barData)

  if (isStaff) {
    return (
      <div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {[
            { icon: '📋', label: 'My Orders',        to: 'admin-orders' },
            { icon: '🚚', label: 'Deliveries',       to: 'admin-deliveries' },
            { icon: '📍', label: "Today's Deliveries", to: 'admin-coordinator' },
          ].map(q => (
            <button key={q.to} onClick={() => navigate(q.to)}
              className="bg-surface border border-border rounded-lg p-3.5 text-center cursor-pointer hover:border-border2 hover:shadow-card transition-all duration-150">
              <div className="text-xl mb-1.5">{q.icon}</div>
              <div className="text-xs font-medium text-text2">{q.label}</div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-4 mb-6">
          <StatCard label="Today's Deliveries" value={s.todayDeliveries} delta={`${s.pendingDeliveries} pending`} deltaType="neutral" />
          <StatCard label="Total Deliveries"   value={s.totalDeliveries} delta="All time" deltaType="neutral" />
        </div>

        <Card noPad>
          <div className="flex items-center justify-between p-5 pb-0 mb-4">
            <span className="text-[14px] font-medium">Today's Deliveries</span>
            <Btn size="sm" onClick={() => navigate('admin-coordinator')}>View all</Btn>
          </div>
          <div className="flex flex-col gap-0 px-4 pb-4">
            {upcoming.length === 0
              ? <div className="text-[13px] text-text2 py-4 text-center">No deliveries today.</div>
              : upcoming.map((d, i) => (
                <div key={d._id} className={`flex items-start gap-3 py-3 ${i < upcoming.length - 1 ? 'border-b border-border' : ''}`}>
                  <div className="w-7 h-7 rounded-full bg-accent-light flex items-center justify-center text-[11px] font-semibold text-accent flex-shrink-0">
                    {initials(d.assignedTo?.name || '?')}
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] font-medium">{d.order?.orderNumber || '—'}</div>
                    <div className="text-[11px] text-text2 mt-0.5">{d.assignedTo?.name || 'Unassigned'} · {formatDate(d.scheduledDate)}</div>
                  </div>
                  <Badge status={d.status} />
                </div>
              ))
            }
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { icon: '📋', label: 'View Orders',   to: 'admin-orders' },
          { icon: '🚚', label: 'Deliveries',    to: 'admin-deliveries' },
          { icon: '➕', label: 'New Corporate', to: 'admin-corporates' },
          { icon: '📊', label: 'Reports',       to: 'admin-reports' },
        ].map(q => (
          <button key={q.to} onClick={() => navigate(q.to)}
            className="bg-surface border border-border rounded-lg p-3.5 text-center cursor-pointer hover:border-border2 hover:shadow-card transition-all duration-150">
            <div className="text-xl mb-1.5">{q.icon}</div>
            <div className="text-xs font-medium text-text2">{q.label}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Revenue"       value={formatCurrency(s.totalRevenue)}  delta="↑ 12.4% this month" />
        <StatCard label="Total Orders"        value={s.totalOrders}                   delta="↑ 8 new today" />
        <StatCard label="Active Corporates"   value={s.totalCorporates}               delta="↑ 2 this week" />
        <StatCard label="Today's Deliveries"  value={s.todayDeliveries}               delta={`${s.pendingOrders} pending`} deltaType="neutral" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Card>
          <CardHeader title="Weekly Orders" subtitle="Last 7 days" />
          <div className="flex items-end gap-2 h-[120px] pt-2">
            {barData.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-accent-light rounded-t hover:bg-accent transition-colors cursor-pointer"
                  style={{ height: `${Math.round((v / maxBar) * 100)}%`, minHeight: '4px' }}
                  title={`${v} orders`} />
                <span className="text-[10px] text-text2">{barLabels[i]}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Order Status" />
          <div className="flex flex-col gap-2.5 mt-1">
            {[['Delivered', 'bg-accent', 62], ['Processing', 'bg-amber-400', 18], ['New', 'bg-blue-400', 12], ['Cancelled', 'bg-red-400', 8]].map(([l, c, p]) => (
              <div key={l}>
                <div className="flex justify-between text-xs mb-1"><span>{l}</span><span className="font-medium">{p}%</span></div>
                <div className="h-1.5 bg-surface2 rounded overflow-hidden">
                  <div className={`h-full ${c} rounded`} style={{ width: `${p}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card noPad>
          <div className="flex items-center justify-between p-5 pb-0 mb-4">
            <span className="text-[14px] font-medium">Recent Orders</span>
            <Btn size="sm" onClick={() => navigate('admin-orders')}>View all</Btn>
          </div>
          <TableWrap>
            <thead><tr><th>Order</th><th>Corporate</th><th>Status</th><th>Amount</th></tr></thead>
            <tbody>
              {recentOrders.map(o => (
                <tr key={o._id} className="cursor-pointer">
                  <td><span className="font-mono text-[12px]">{o.orderNumber}</span></td>
                  <td>{o.corporate?.companyName || '—'}</td>
                  <td><Badge status={o.status} /></td>
                  <td className="font-medium">{formatCurrency(o.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Card>

        <Card>
          <CardHeader title="Upcoming Deliveries">
            <Btn size="sm" onClick={() => navigate('admin-deliveries')}>View all</Btn>
          </CardHeader>
          <div className="flex flex-col gap-0">
            {upcoming.map((d, i) => (
              <div key={d._id} className={`flex items-start gap-3 pb-4 relative ${i < upcoming.length - 1 ? 'mb-0' : ''}`}>
                {i < upcoming.length - 1 && <div className="absolute left-[14px] top-7 bottom-0 w-px bg-border" />}
                <div className="w-7 h-7 rounded-full bg-accent-light border-2 border-accent flex items-center justify-center text-[11px] flex-shrink-0 z-10">🚚</div>
                <div className="flex-1 pt-0.5">
                  <div className="text-[13px] font-medium">{d.order?.orderNumber || '—'}</div>
                  <div className="text-[11px] text-text2 mt-0.5">{d.assignedTo?.name || 'Unassigned'} · {formatDate(d.deliveryDate)}</div>
                </div>
                <Badge status={d.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function mockOrders(n) {
  return Array.from({ length: n }, (_, i) => ({
    _id: `o${i}`, orderNumber: `ORD-00${i + 1}`,
    corporate: { companyName: 'Sample Corp' }, status: 'processing', totalAmount: 1200 + i * 100,
  }))
}
function mockDeliveries(n) {
  return Array.from({ length: n }, (_, i) => ({
    _id: `d${i}`, order: { orderNumber: `ORD-00${i + 1}` },
    assignedTo: { name: 'Staff Member' }, deliveryDate: new Date().toISOString(), status: 'scheduled',
  }))
}