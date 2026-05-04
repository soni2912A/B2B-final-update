import React, { useEffect, useState } from 'react'
import { apiFetch, formatDate, formatCurrency, initials } from '../../../utils/api.js'
import { Badge, Card, CardHeader, PageHeader, FilterBar, TableWrap, TblAction, Btn, Loading, Modal, FormGroup, Input, Select, Textarea, Tabs, PhoneInput } from '../../ui/index.jsx'
import { showToast } from '../../ui/index.jsx'
import EditableCell from '../../ui/EditableCell.jsx'
import ImportModal from '../../ui/ImportModal.jsx'
import GoogleSyncRowAction from '../../ui/GoogleSyncRowAction.jsx'
import { useApp } from '../../../AppContext.jsx'

// ============================================================
// PHONE COUNTRY CODE CONFIG
// ============================================================
const PHONE_CC_CONFIG = {
  '+91':  { max: 10, placeholder: '98765 43210',   flag: '🇮🇳', label: 'India' },
  '+1':   { max: 10, placeholder: '555 000 1234',  flag: '🇺🇸', label: 'USA/Canada' },
  '+44':  { max: 10, placeholder: '7911 123456',   flag: '🇬🇧', label: 'UK' },
  '+61':  { max: 9,  placeholder: '412 345 678',   flag: '🇦🇺', label: 'Australia' },
  '+971': { max: 9,  placeholder: '50 123 4567',   flag: '🇦🇪', label: 'UAE' },
  '+65':  { max: 8,  placeholder: '8123 4567',     flag: '🇸🇬', label: 'Singapore' },
  '+49':  { max: 10, placeholder: '1511 2345678',  flag: '🇩🇪', label: 'Germany' },
  '+33':  { max: 9,  placeholder: '6 12 34 56 78', flag: '🇫🇷', label: 'France' },
  '+81':  { max: 10, placeholder: '90 1234 5678',  flag: '🇯🇵', label: 'Japan' },
  '+86':  { max: 11, placeholder: '131 2345 6789', flag: '🇨🇳', label: 'China' },
  '+82':  { max: 10, placeholder: '10 1234 5678',  flag: '🇰🇷', label: 'S. Korea' },
  '+92':  { max: 10, placeholder: '300 1234567',   flag: '🇵🇰', label: 'Pakistan' },
  '+880': { max: 10, placeholder: '1711 123456',   flag: '🇧🇩', label: 'Bangladesh' },
  '+94':  { max: 9,  placeholder: '71 234 5678',   flag: '🇱🇰', label: 'Sri Lanka' },
  '+977': { max: 10, placeholder: '98 1234 5678',  flag: '🇳🇵', label: 'Nepal' },
  '+966': { max: 9,  placeholder: '50 123 4567',   flag: '🇸🇦', label: 'Saudi Arabia' },
  '+974': { max: 8,  placeholder: '3312 3456',     flag: '🇶🇦', label: 'Qatar' },
  '+968': { max: 8,  placeholder: '9123 4567',     flag: '🇴🇲', label: 'Oman' },
  '+973': { max: 8,  placeholder: '3600 1234',     flag: '🇧🇭', label: 'Bahrain' },
  '+60':  { max: 10, placeholder: '12 345 6789',   flag: '🇲🇾', label: 'Malaysia' },
  '+62':  { max: 12, placeholder: '812 3456 7890', flag: '🇮🇩', label: 'Indonesia' },
  '+63':  { max: 10, placeholder: '917 123 4567',  flag: '🇵🇭', label: 'Philippines' },
  '+66':  { max: 9,  placeholder: '81 234 5678',   flag: '🇹🇭', label: 'Thailand' },
  '+27':  { max: 9,  placeholder: '71 234 5678',   flag: '🇿🇦', label: 'South Africa' },
  '+55':  { max: 11, placeholder: '11 91234 5678', flag: '🇧🇷', label: 'Brazil' },
  '+52':  { max: 10, placeholder: '1 234 567 890', flag: '🇲🇽', label: 'Mexico' },
}

export function CorpDashboard() {
  const { navigate } = useApp()
  const [data, setData] = useState(null)

  useEffect(() => {
    apiFetch('GET', '/corporate/dashboard').then(res => setData(res.data || {}))
  }, [])

  if (!data) return <Loading />

  const s         = data.stats || { totalStaff: 128, activeOrders: 6, upcomingEvents: 3 }
  const birthdays = data.upcomingBirthdays || mockBirthdays()
  const orders    = data.recentOrders || mockOrders(4)

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { icon:'➕', label:'Place Order',    to:'corp-place-order' },
          { icon:'👥', label:'Manage Staff',   to:'corp-staff' },
          { icon:'📋', label:'My Orders',      to:'corp-orders' },
          { icon:'💳', label:'Invoices',       to:'corp-invoices' },
        ].map(q => (
          <button key={q.to} onClick={() => navigate(q.to)}
            className="bg-surface border border-border rounded-lg p-3.5 text-center cursor-pointer hover:border-border2 hover:shadow-card transition-all duration-150">
            <div className="text-xl mb-1.5">{q.icon}</div>
            <div className="text-xs font-medium text-text2">{q.label}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
        <div className="bg-surface border border-border rounded-lg p-4"><div className="text-xs text-text2 mb-1.5">Total Staff</div><div className="text-[22px] font-semibold">{s.totalStaff}</div></div>
        <div className="bg-surface border border-border rounded-lg p-4"><div className="text-xs text-text2 mb-1.5">Active Orders</div><div className="text-[22px] font-semibold">{s.activeOrders}</div></div>
        <div className="bg-surface border border-border rounded-lg p-4"><div className="text-xs text-text2 mb-1.5">Upcoming Events</div><div className="text-[22px] font-semibold">{s.upcomingEvents}</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card noPad>
          <div className="flex items-center justify-between p-5 pb-0 mb-4">
            <span className="text-[14px] font-medium">Recent Orders</span>
            <Btn size="sm" onClick={() => navigate('corp-orders')}>View all</Btn>
          </div>
          <TableWrap>
            <thead><tr><th>Order</th><th>Date</th><th>Status</th><th>Amount</th></tr></thead>
            <tbody>
              {orders.map(o => (
                <tr key={o._id}>
                  <td><span className="font-mono text-[12px]">{o.orderNumber}</span></td>
                  <td>{formatDate(o.deliveryDate)}</td>
                  <td><Badge status={o.status} /></td>
                  <td className="font-medium">{formatCurrency(o.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Card>

        <Card>
          <CardHeader title="Upcoming Birthdays 🎂" />
          <div className="flex flex-col gap-2.5">
            {birthdays.map((b, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 bg-surface2 rounded">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-accent-light flex items-center justify-center text-[10px] font-semibold text-accent">{initials(b.name)}</div>
                  <div>
                    <div className="text-[13px] font-medium">{b.name}</div>
                    <div className="text-[11px] text-text2">{b.date}</div>
                  </div>
                </div>
                <span className="bg-purple-50 text-purple-800 px-2 py-0.5 rounded-full text-[11px] font-medium">In {b.days} days</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

export function CorpStaffPage() {
  const [staff, setStaff]     = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView]       = useState('grid')
  const [showAdd, setShowAdd] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [deptFilter, setDeptFilter] = useState('')

  const departments = Array.from(new Set(staff.map(s => s.department).filter(Boolean))).sort()
  const filteredStaff = deptFilter ? staff.filter(s => s.department === deptFilter) : staff

  async function load() {
    setLoading(true)
    const res = await apiFetch('GET', '/corporate/staff')
    setStaff(res.data?.staff || [])
    setLoading(false)
  }

  async function saveStaffField(id, patch) {
    await apiFetch('PUT', `/corporate/staff/${id}`, patch)
    setStaff(xs => xs.map(x => x._id === id ? { ...x, ...patch } : x))
  }
  async function saveStaffStatus(id, status) {
    await apiFetch('PATCH', `/corporate/staff/${id}/status`, { status })
    setStaff(xs => xs.map(x => x._id === id ? { ...x, status } : x))
  }

  async function deleteStaffMember(id, name) {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return
    try {
      await apiFetch('DELETE', `/corporate/staff/${id}`)
      setStaff(xs => xs.filter(x => x._id !== id))
      showToast('Staff member deleted.')
    } catch (err) {
      showToast(err.message || 'Could not delete staff member.', 'error')
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div>
      <PageHeader title="Staff" subtitle={`${staff.length} staff members${deptFilter ? ` · ${filteredStaff.length} in ${deptFilter}` : ''}`}>
        <Tabs tabs={[{ id:'grid',label:'Grid' },{ id:'list',label:'List' }]} active={view} onChange={setView} />
        {/* <Btn size="sm" onClick={() => setShowImport(true)}>↑ Bulk Upload</Btn> */}
        <Btn variant="primary" onClick={() => setShowAdd(true)}>+ Add Staff</Btn>
      </PageHeader>

      <FilterBar
        values={{ department: deptFilter }}
        onChange={(k, v) => { if (k === 'department') setDeptFilter(v) }}
        onClear={() => setDeptFilter('')}
        fields={[
          { key: 'search', placeholder: 'Search staff…' },
          {
            key: 'department', type: 'select', placeholder: 'All Departments',
            options: departments.map(d => ({ v: d, l: d })),
          },
          { key: 'status', type: 'select', placeholder: 'All Statuses', options: [
            { v: 'active',   l: 'Active' },
            { v: 'inactive', l: 'Inactive' },
            { v: 'on_hold',  l: 'On Hold' },
          ]},
        ]}
      />

      {loading ? <Loading /> : view === 'grid' ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
          {filteredStaff.map(s => (
            <div key={s._id} className="bg-surface border border-border rounded-lg p-4 text-center cursor-pointer hover:shadow-card hover:border-border2 transition-all duration-150">
              <div className="w-[52px] h-[52px] rounded-full bg-accent-light flex items-center justify-center text-lg font-semibold text-accent mx-auto mb-2.5">{initials(s.firstName + ' ' + s.lastName)}</div>
              <div className="text-[13px] font-medium">{s.firstName} {s.lastName}</div>
              <div className="text-[11px] text-text2 mt-0.5">{s.department}</div>
              <div className="mt-1.5"><Badge status={s.status} /></div>
              <div className="flex gap-1.5 mt-2.5 justify-center">
                <TblAction onClick={() => setShowAdd(true)}>Edit</TblAction>
                <TblAction variant="danger" onClick={() => deleteStaffMember(s._id, `${s.firstName} ${s.lastName}`)}>Delete</TblAction>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card noPad>
          <TableWrap>
            <thead><tr><th>Name</th><th>Email</th><th>Department</th><th>Designation</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filteredStaff.map(s => (
                <tr key={s._id}>
                  <td data-label="Name">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-accent-light flex items-center justify-center text-[10px] font-semibold text-accent">{initials(s.firstName + ' ' + s.lastName)}</div>
                      {s.firstName} {s.lastName}
                    </div>
                  </td>
                  <td data-label="Email" className="text-text2 break-all">{s.email}</td>
                  <td data-label="Department">
                    <EditableCell
                      value={s.department || ''}
                      onSave={async (v) => { await saveStaffField(s._id, { department: v || undefined }) }}
                    />
                  </td>
                  <td data-label="Designation">
                    <EditableCell
                      value={s.designation || ''}
                      onSave={async (v) => { await saveStaffField(s._id, { designation: v || undefined }) }}
                    />
                  </td>
                  <td data-label="Status">
                    <EditableCell
                      value={s.status || 'active'}
                      mode="select"
                      options={[
                        { value: 'active',   label: 'Active' },
                        { value: 'inactive', label: 'Inactive' },
                        { value: 'on_hold',  label: 'On Hold' },
                        { value: 'archived', label: 'Archived' },
                      ]}
                      render={v => <Badge status={v} />}
                      onSave={async (v) => { await saveStaffStatus(s._id, v) }}
                    />
                  </td>
                  <td data-label="Actions">
                    <div className="flex gap-1.5 flex-wrap">
                      <TblAction onClick={() => setShowAdd(true)}>Edit</TblAction>
                      <TblAction variant="danger" onClick={() => deleteStaffMember(s._id, `${s.firstName} ${s.lastName}`)}>Delete</TblAction>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Card>
      )}

      {showAdd && (
        <AddStaffModal
          existingEmails={staff.map(s => s.email).filter(Boolean).map(e => e.toLowerCase())}
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); load(); }}
        />
      )}

      {showImport && (
        <ImportModal
          title="Bulk Upload Staff"
          previewPath="/corporate/staff/import/preview"
          importPath="/corporate/staff/import"
          columns={[
            { key: 'firstName',   label: 'First Name' },
            { key: 'lastName',    label: 'Last Name' },
            { key: 'email',       label: 'Email' },
            { key: 'department',  label: 'Department' },
            { key: 'designation', label: 'Designation' },
          ]}
          onClose={() => setShowImport(false)}
          onDone={() => { setShowImport(false); load() }}
        />
      )}
    </div>
  )
}

function AddStaffModal({ onClose, onSaved, existingEmails = [] }) {
  const EMPTY = {
    firstName: '', lastName: '', email: '',
    phoneDigits: '', countryCode: '+91',
    department: '', designation: '', dateOfBirth: '',
  }
  const [form, setForm]     = useState(EMPTY)
  const [error, setError]   = useState('')
  const [saving, setSaving] = useState(false)

  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }

  const ccConf = PHONE_CC_CONFIG[form.countryCode] || PHONE_CC_CONFIG['+91']
  const canSubmit = form.firstName.trim() && form.lastName.trim() && !saving

  async function save() {
    if (!form.firstName.trim()) { setError('First name is required.'); return }
    if (/[0-9]/.test(form.firstName.trim())) { setError('First name must contain only letters.'); return }
    if (!form.lastName.trim())  { setError('Last name is required.'); return }
    if (/[0-9]/.test(form.lastName.trim())) { setError('Last name must contain only letters.'); return }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError('Email format is invalid.'); return
    }
    if (form.email.trim() && existingEmails.includes(form.email.trim().toLowerCase())) {
      setError('A staff member with this email already exists.'); return
    }
    if (form.phoneDigits.trim()) {
      const digits = form.phoneDigits.replace(/\D/g, '')
      if (digits.length !== ccConf.max) {
        setError(`Phone must be exactly ${ccConf.max} digits for ${ccConf.label} (${form.countryCode}).`)
        return
      }
    }
    setSaving(true); setError('')
    try {
      await apiFetch('POST', '/corporate/staff', {
        firstName:   form.firstName.trim(),
        lastName:    form.lastName.trim(),
        email:       form.email.trim() || undefined,
        phone:       form.phoneDigits.trim() ? `${form.countryCode} ${form.phoneDigits.trim()}` : undefined,
        department:  form.department.trim() || undefined,
        designation: form.designation.trim() || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
      })
      showToast('Staff member added.')
      onSaved()
    } catch (err) {
      setError(err.message || 'Could not add staff.')
      setSaving(false)
    }
  }

  return (
    <Modal
      title="Add Staff Member"
      onClose={onClose}
      actions={[
        { label: saving ? 'Adding…' : 'Add Staff', primary: true, onClick: save, disabled: !canSubmit },
        { label: 'Cancel', onClick: onClose },
      ]}
    >
      {error && (
        <div className="mb-3 p-2.5 rounded border border-red-200 bg-red-50 text-red-700 text-[12px]">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FormGroup label="First Name">
          <Input
            value={form.firstName}
            onChange={e => { if (/^[^0-9]*$/.test(e.target.value)) set('firstName')(e) }}
            placeholder="First name"
          />
        </FormGroup>
        <FormGroup label="Last Name">
          <Input
            value={form.lastName}
            onChange={e => { if (/^[^0-9]*$/.test(e.target.value)) set('lastName')(e) }}
            placeholder="Last name"
          />
        </FormGroup>
        <FormGroup label="Email">
          <Input type="email" value={form.email} onChange={set('email')} placeholder="staff@company.com" />
        </FormGroup>

        {/* Phone Input with Country Code Dropdown */}
        <FormGroup label="Phone">
          <div className="flex gap-1.5">
            <select
              value={form.countryCode}
              onChange={e => setForm(f => ({ ...f, countryCode: e.target.value, phoneDigits: '' }))}
              className="h-9 rounded border border-border bg-surface text-text1 text-[12px] px-1.5 flex-shrink-0 cursor-pointer focus:outline-none focus:border-accent"
              style={{ width: '90px' }}
            >
              {Object.entries(PHONE_CC_CONFIG).map(([code, cfg]) => (
                <option key={code} value={code}>
                  {cfg.flag} {code}
                </option>
              ))}
            </select>
            <Input
              type="tel"
              value={form.phoneDigits}
              onChange={e => {
                const raw = e.target.value.replace(/[^0-9]/g, '').slice(0, ccConf.max)
                setForm(f => ({ ...f, phoneDigits: raw }))
              }}
              placeholder={ccConf.placeholder}
              maxLength={ccConf.max}
              style={{ flex: 1, minWidth: 0 }}
            />
          </div>
          <div className="text-[10px] text-text3 mt-0.5">
            {ccConf.label}: {ccConf.max} digits required
          </div>
        </FormGroup>

        <FormGroup label="Department">
          <Input value={form.department} onChange={set('department')} placeholder="HR, Sales, IT…" />
        </FormGroup>
        <FormGroup label="Designation">
          <Input value={form.designation} onChange={set('designation')} placeholder="Manager, Executive…" />
        </FormGroup>
      </div>
      <FormGroup label="Birthday">
        <Input
          type="date"
          value={form.dateOfBirth}
          onChange={set('dateOfBirth')}
          max={new Date().toISOString().slice(0, 10)}
        />
        {form.dateOfBirth && (
          <div className="text-[11px] text-text2 mt-1">
            Selected: {(() => {
              const d = new Date(form.dateOfBirth + 'T00:00:00')
              return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
            })()}
          </div>
        )}
      </FormGroup>
    </Modal>
  )
}

export function PlaceOrderPage() {
  const { navigate } = useApp()
  const [step, setStep]         = useState(1)
  const [selectedStaff, setSelectedStaff] = useState([])
  const [items, setItems]       = useState([])
  const [delivery, setDelivery] = useState({ date: '', addrType: 'Office Address', address: '', instructions: '' })
  const [assignedTo, setAssignedTo] = useState('')
  const [remarks, setRemarks]   = useState('')
  const [loading, setLoading]   = useState(false)

  const [couponInput, setCouponInput] = useState('')
  const [applied, setApplied]         = useState(null)
  const [couponError, setCouponError] = useState('')
  const [checking, setChecking]       = useState(false)

  const [browseOpen, setBrowseOpen]       = useState(false)
  const [browseList, setBrowseList]       = useState([])
  const [browseLoading, setBrowseLoading] = useState(false)
  const [browseError, setBrowseError]     = useState('')
  const [browseLoaded, setBrowseLoaded]   = useState(false)

  const [staffList, setStaffList]     = useState([])
  const [productList, setProductList] = useState([])
  const [deliveryStaffList, setDeliveryStaffList] = useState([])

  useEffect(() => {
    apiFetch('GET', '/corporate/staff').then(res => setStaffList(res.data?.staff || []))
    apiFetch('GET', '/corporate/products').then(res => setProductList(res.data?.products || []))
    apiFetch('GET', '/corporate/orders/delivery-staff')
      .then(res => setDeliveryStaffList(res.data?.staff || []))
      .catch(() => setDeliveryStaffList([]))
  }, [])

  const STEPS = ['Choose Items','Select Staff','Delivery Details','Assign Delivery Staff','Review & Confirm']
  const FINAL_STEP = STEPS.length

  function toggleStaff(id) {
    setSelectedStaff(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function changeQty(id, qty) {
    if (qty < 0) return
    setItems(prev => {
      const existing = prev.find(i => i.id === id)
      if (qty === 0) return prev.filter(i => i.id !== id)
      if (existing)  return prev.map(i => i.id === id ? { ...i, qty } : i)
      return [...prev, { id, qty }]
    })
  }

  async function submitOrder() {
    setLoading(true)
    try {
      const payload = {
        items: items.map(it => ({
          product: it.id,
          quantity: it.qty,
          staffMembers: selectedStaff,
        })),
        deliveryDate: delivery.date,
        deliveryAddress: {
          type: 'delivery',
          label: delivery.addrType,
          address: delivery.address,
          instructions: delivery.instructions,
        },
        remarks,
        ...(applied ? { couponCode: applied.code } : {}),
        ...(assignedTo ? { assignedTo } : {}),
      }
      await apiFetch('POST', '/corporate/orders', payload)
      const msg = assignedTo
        ? 'Order placed and assigned. Delivery staff has been notified.'
        : 'Order placed successfully!'
      showToast(msg)
      navigate('corp-orders')
    } catch (err) {
      showToast(err.message || 'Could not place order', 'error')
    } finally {
      setLoading(false)
    }
  }

  const selectedDeliveryStaff = deliveryStaffList.find(u => u._id === assignedTo)

  const subtotal = items.reduce((s, it) => {
    const p = productList.find(x => x._id === it.id)
    return s + (p?.basePrice || 0) * it.qty
  }, 0)
  const discountAmount = applied ? applied.discountAmount : 0
  const totalAmt = Math.max(0, subtotal - discountAmount)

  async function applyCoupon(override) {
    const code = (override ?? couponInput).trim().toUpperCase()
    if (!code) return
    setChecking(true)
    setCouponError('')
    try {
      const res = await apiFetch('POST', '/corporate/discounts/validate', { code, subtotal })
      if (res.data?.valid) {
        setApplied({
          code: res.data.code,
          discountAmount: res.data.discountAmount,
          finalAmount: res.data.finalAmount,
        })
        setCouponInput('')
      } else {
        setCouponError(res.data?.message || 'Invalid or expired coupon code')
        setApplied(null)
      }
    } catch (err) {
      setCouponError(err.message || 'Could not validate coupon')
      setApplied(null)
    } finally {
      setChecking(false)
    }
  }

  function removeCoupon() {
    setApplied(null)
    setCouponError('')
    setCouponInput('')
  }

  async function toggleBrowse() {
    const next = !browseOpen
    setBrowseOpen(next)
    if (next && !browseLoaded) {
      setBrowseLoading(true)
      setBrowseError('')
      try {
        const res = await apiFetch('GET', '/corporate/discounts')
        setBrowseList(res.data?.discounts || [])
        setBrowseLoaded(true)
      } catch {
        setBrowseError("Couldn't load coupons. You can still type a code if you have one.")
      } finally {
        setBrowseLoading(false)
      }
    }
  }

  function pickCoupon(code) {
    setBrowseOpen(false)
    applyCoupon(code)
  }

  function formatOffer(d) {
    return d.type === 'percentage' ? `${d.value}% off` : `${formatCurrency(d.value)} off`
  }

  return (
    <div>
      <PageHeader title="Place New Order" />
      <Card>
        <div className="relative flex mb-8">
          <div className="wizard-line" />
          {STEPS.map((label, i) => {
            const n = i + 1
            const done   = n < step
            const active = n === step
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 relative z-10">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold border-2 transition-all duration-200
                  ${done   ? 'bg-accent border-accent text-white' : ''}
                  ${active ? 'bg-surface border-accent text-accent' : ''}
                  ${!done && !active ? 'bg-surface border-border2 text-text2' : ''}`}>
                  {done ? '✓' : n}
                </div>
                <div className={`text-[11px] text-center leading-tight ${done || active ? 'text-accent' : 'text-text2'}`}>{label}</div>
              </div>
            )
          })}
        </div>

        {step === 1 && (
          <div>
            <div className="text-[14px] font-medium mb-3">Choose products for the order</div>
            {productList.length === 0 ? (
              <div className="text-center py-10 text-text2 text-[13px]">No products available. Ask your admin to add products.</div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
                {productList.map(p => {
                  const qty = items.find(i => i.id === p._id)?.qty || 0
                  const imgSrc = p.images?.[0] || null
                  const outOfStock = p.stockQuantity === 0
                  return (
                    <div key={p._id} className={`border rounded-lg overflow-hidden ${outOfStock ? 'opacity-60' : 'border-border'}`}>
                      <div className="h-[100px] bg-accent-light flex items-center justify-center text-[28px] overflow-hidden">
                        {imgSrc
                          ? <img src={imgSrc} alt={p.name} className="w-full h-full object-cover" />
                          : '🎁'
                        }
                      </div>
                      <div className="p-3">
                        <div className="text-[13px] font-medium">{p.name}</div>
                        <div className="text-[14px] font-semibold mt-1">{formatCurrency(p.basePrice)}</div>
                        {outOfStock
                          ? <div className="text-[11px] text-red-500 mt-1">Out of stock</div>
                          : <div className="text-[11px] text-text3 mt-1">Stock: {p.stockQuantity}</div>
                        }
                        <div className="flex items-center gap-2 mt-2">
                          <button disabled={outOfStock} onClick={() => changeQty(p._id, qty - 1)} className="w-7 h-7 rounded border border-border flex items-center justify-center text-text2 hover:bg-surface2 disabled:opacity-40">−</button>
                          <span className="font-semibold min-w-[20px] text-center">{qty}</span>
                          <button disabled={outOfStock} onClick={() => changeQty(p._id, qty + 1)} className="w-7 h-7 rounded border border-border flex items-center justify-center text-text2 hover:bg-surface2 disabled:opacity-40">+</button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="text-[14px] font-medium mb-3">Select staff members for this order</div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
              {staffList.map(s => {
                const sel = selectedStaff.includes(s._id)
                return (
                  <div key={s._id} onClick={() => toggleStaff(s._id)}
                    className={`border rounded-lg p-4 text-center cursor-pointer transition-all duration-150 ${sel ? 'border-accent bg-accent-light' : 'border-border hover:border-border2'}`}>
                    <div className="w-10 h-10 rounded-full bg-accent-light flex items-center justify-center text-sm font-semibold text-accent mx-auto mb-2">{initials(s.firstName + ' ' + s.lastName)}</div>
                    <div className="text-[13px] font-medium">{s.firstName} {s.lastName}</div>
                    <div className="text-[11px] text-text2 mt-0.5">{s.department}</div>
                    {sel && <div className="mt-1.5 text-[11px] text-accent font-medium">✓ Selected</div>}
                  </div>
                )
              })}
            </div>
            <div className="text-[13px] text-text2 mt-3">{selectedStaff.length} staff selected</div>
          </div>
        )}

        {step === 3 && (
          <div className="max-w-lg">
            <FormGroup label="Delivery Date"><Input type="date" value={delivery.date} onChange={e => setDelivery(d => ({ ...d, date: e.target.value }))} /></FormGroup>
            <FormGroup label="Address Type">
              <Select value={delivery.addrType} onChange={e => setDelivery(d => ({ ...d, addrType: e.target.value }))}>
                <option>Office Address</option><option>Home Address</option><option>Custom Address</option>
              </Select>
            </FormGroup>
            <FormGroup label="Delivery Address"><Textarea value={delivery.address} onChange={e => setDelivery(d => ({ ...d, address: e.target.value }))} placeholder="Full delivery address…" /></FormGroup>
            <FormGroup label="Special Instructions"><Textarea value={delivery.instructions} onChange={e => setDelivery(d => ({ ...d, instructions: e.target.value }))} placeholder="Any special delivery instructions…" /></FormGroup>
          </div>
        )}

        {step === 4 && (
          <div className="max-w-lg">
            <div className="text-[13px] text-text2 mb-3">
              Choose the staff member who will <b>deliver</b> this order.
              They'll receive an email and in-app notification once the order is placed.
            </div>

            {deliveryStaffList.length === 0 ? (
              <div className="p-3 rounded border border-amber-200 bg-amber-50 text-amber-800 text-[12px]">
                No delivery staff are currently available for this business. You can still place the order — an administrator will assign someone before delivery.
              </div>
            ) : (
              <>
                <FormGroup label="Delivery Staff" hint="Leave blank to let an administrator assign this order later.">
                  <Select value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
                    <option value="">— Assign later —</option>
                    {deliveryStaffList.map(u => (
                      <option key={u._id} value={u._id}>{u.name}</option>
                    ))}
                  </Select>
                </FormGroup>

                {selectedDeliveryStaff && (
                  <div className="mt-3 p-3 rounded border border-accent bg-accent-light text-[13px] flex items-center gap-2">
                    <span className="text-accent">✓</span>
                    <span>
                      <span className="font-semibold">{selectedDeliveryStaff.name}</span> will deliver this order.
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="flex flex-col gap-3">
            <div className="border border-accent rounded-lg p-4">
              <div className="text-xs font-medium text-text2 mb-2 uppercase tracking-wider">Delivery Staff</div>
              {selectedDeliveryStaff
                ? <div className="text-[13px]"><span className="font-medium">{selectedDeliveryStaff.name}</span> will deliver this order.</div>
                : <div className="text-[12px] text-text2 italic">Not assigned — an administrator will pick a delivery staff member later.</div>}
            </div>
            <div className="border border-accent rounded-lg p-4">
              <div className="text-xs font-medium text-text2 mb-2 uppercase tracking-wider">Staff Members ({selectedStaff.length})</div>
              <div className="flex flex-wrap gap-1.5">
                {selectedStaff.map(id => {
                  const s = staffList.find(x => x._id === id)
                  return s ? <span key={id} className="bg-surface2 border border-border rounded-full px-2.5 py-0.5 text-[12px]">{s.firstName} {s.lastName}</span> : null
                })}
                {selectedStaff.length === 0 && <span className="text-text2 text-[12px]">None selected</span>}
              </div>
            </div>
            <div className="border border-accent rounded-lg p-4">
              <div className="text-xs font-medium text-text2 mb-2 uppercase tracking-wider">Order Items</div>
              {items.map(it => {
                const p = productList.find(x => x._id === it.id)
                return p ? (
                  <div key={it.id} className="flex justify-between py-1.5 border-b border-border last:border-0 text-[13px]">
                    <span>{p.name} × {it.qty}</span>
                    <span className="font-medium">{formatCurrency(p.basePrice * it.qty)}</span>
                  </div>
                ) : null
              })}
              {items.length > 0 && (
                <div className="pt-2 border-t border-border mt-2 text-[13px]">
                  <div className="flex justify-between py-0.5">
                    <span className="text-text2">Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {applied && (
                    <div className="flex justify-between py-0.5 text-accent">
                      <span>Discount ({applied.code})</span>
                      <span>−{formatCurrency(applied.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1.5 font-semibold text-[14px] border-t border-border mt-1">
                    <span>Total</span><span>{formatCurrency(totalAmt)}</span>
                  </div>
                </div>
              )}
              {items.length === 0 && <span className="text-text2 text-[12px]">No items</span>}
            </div>
            <FormGroup label="Coupon Code (optional)">
              {applied ? (
                <div className="flex items-center justify-between bg-accent-light border border-accent rounded px-3 py-2 text-[13px]">
                  <span className="text-accent font-medium">Coupon applied: {applied.code} — −{formatCurrency(applied.discountAmount)}</span>
                  <button type="button" onClick={removeCoupon} className="text-accent hover:text-text1 text-[16px] leading-none" aria-label="Remove coupon">×</button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <Input
                      value={couponInput}
                      onChange={e => { setCouponInput(e.target.value.toUpperCase()); if (couponError) setCouponError('') }}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon() } }}
                      placeholder="e.g. SAVE20"
                    />
                    <Btn onClick={() => applyCoupon()} disabled={checking || !couponInput.trim()}>
                      {checking ? 'Checking…' : 'Apply'}
                    </Btn>
                  </div>
                  {couponError && <div className="text-[12px] text-red-600 mt-1">{couponError}</div>}
                  <button
                    type="button"
                    onClick={toggleBrowse}
                    className="mt-1.5 text-[12px] text-text2 hover:text-accent underline underline-offset-2 cursor-pointer"
                  >
                    {browseOpen ? 'Hide available coupons' : 'Browse available coupons'}
                  </button>
                  {browseOpen && (
                    <div className="mt-2 border border-border rounded bg-surface2 max-h-64 overflow-y-auto">
                      {browseLoading ? (
                        <div className="px-3 py-2 text-[12px] text-text2">Loading…</div>
                      ) : browseError ? (
                        <div className="px-3 py-2 text-[12px] text-red-600">{browseError}</div>
                      ) : browseList.length === 0 ? (
                        <div className="px-3 py-2 text-[12px] text-text2">No active coupons available.</div>
                      ) : (
                        browseList.slice(0, 10).map(d => (
                          <div
                            key={d._id}
                            onClick={() => pickCoupon(d.code)}
                            className="flex items-center gap-3 px-3 py-2 border-b border-border last:border-0 cursor-pointer hover:bg-surface"
                          >
                            <span className="font-semibold text-text1 text-[13px] min-w-[80px]">{d.code}</span>
                            <span className="text-[12px] text-accent flex-shrink-0">{formatOffer(d)}</span>
                            {d.minOrderAmount > 0 && (
                              <span className="text-[11px] text-text2 flex-shrink-0">on orders over {formatCurrency(d.minOrderAmount)}</span>
                            )}
                            <span className="ml-auto text-[11px] text-text3">expires {formatDate(d.validUntil)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </FormGroup>
            <FormGroup label="Remarks">
              <Textarea value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Any additional remarks…" />
            </FormGroup>
          </div>
        )}

        <div className="flex justify-between mt-6 pt-4 border-t border-border">
          <Btn onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}>← Back</Btn>
          {step < FINAL_STEP
            ? <Btn
                variant="primary"
                onClick={() => setStep(s => Math.min(FINAL_STEP, s + 1))}
                disabled={
                  (step === 1 && items.length === 0) ||
                  (step === 3 && (!delivery.date || !delivery.address.trim()))
                }
              >Next →</Btn>
            : <Btn
                variant="primary"
                onClick={submitOrder}
                disabled={loading || !delivery.date || !delivery.address.trim() || items.length === 0}
              >{loading ? 'Submitting…' : 'Submit Order'}</Btn>}
        </div>
      </Card>
    </div>
  )
}

export function CorpUsersPage() {
  const { user: currentUser } = useApp()
  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [editing, setEditing]       = useState(null)
  const [confirmToggle, setConfirmToggle] = useState(null)
  const [toggling, setToggling]     = useState(false)

  async function load() {
    try {
      const res = await apiFetch('GET', '/corporate/users')
      setUsers(res.data?.users || [])
    } catch (err) {
      showToast(err.message || 'Failed to load users.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function doToggle() {
    if (!confirmToggle) return
    setToggling(true)
    try {
      await apiFetch('PATCH', `/corporate/users/${confirmToggle._id}/toggle-status`)
      showToast(`User ${confirmToggle.isActive ? 'deactivated' : 'activated'}.`)
      await load()
      setConfirmToggle(null)
    } catch (err) {
      showToast(err.message || 'Could not update user.', 'error')
    } finally {
      setToggling(false)
    }
  }

  const isSelf = (u) => String(u._id) === String(currentUser?._id)

  return (
    <div>
      <PageHeader title="Manage Users" subtitle="Control portal access for your team">
      </PageHeader>
      <Card noPad>
        {loading ? <Loading /> : users.length === 0 ? (
          <div className="py-12 text-center text-text2 text-sm">No users yet. Invite someone to get started.</div>
        ) : (
          <TableWrap>
            <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map(u => {
                const self = isSelf(u)
                return (
                  <tr key={u._id}>
                    <td data-label="User">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-accent-light flex items-center justify-center text-[10px] font-semibold text-accent flex-shrink-0">{initials(u.name)}</div>
                        <div>
                          <div className="font-medium">{u.name}{self && <span className="ml-1.5 text-[11px] text-text3">(you)</span>}</div>
                          <div className="text-[11px] text-text2 break-all">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td data-label="Role"><Badge status={u.role} /></td>
                    <td data-label="Status"><Badge status={u.isActive ? 'active' : 'inactive'} /></td>
                    <td data-label="Actions">
                      <div className="flex gap-1.5 flex-wrap">
                        <TblAction onClick={() => setEditing(u)}>Edit</TblAction>
                        <TblAction
                          onClick={() => setConfirmToggle(u)}
                          disabled={self}
                          title={self ? "You can't deactivate your own account." : undefined}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </TblAction>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </TableWrap>
        )}
      </Card>

      {showInvite && (
        <InviteCorpUserModal
          onClose={() => setShowInvite(false)}
          onSent={async () => { setShowInvite(false); await load() }}
        />
      )}

      {editing && (
        <EditCorpUserModal
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => { setEditing(null); await load() }}
        />
      )}

      {confirmToggle && (
        <Modal
          title={confirmToggle.isActive ? 'Deactivate user' : 'Activate user'}
          onClose={() => !toggling && setConfirmToggle(null)}
          actions={[
            { label: toggling ? 'Saving…' : (confirmToggle.isActive ? 'Deactivate' : 'Activate'), primary: true, onClick: doToggle, disabled: toggling },
            { label: 'Cancel', onClick: () => !toggling && setConfirmToggle(null) },
          ]}
        >
          <div className="text-[13px]">
            {confirmToggle.isActive
              ? <>Deactivate <span className="font-semibold">{confirmToggle.name}</span>? They won't be able to log in until reactivated.</>
              : <>Activate <span className="font-semibold">{confirmToggle.name}</span>? They'll regain portal access immediately.</>}
          </div>
        </Modal>
      )}
    </div>
  )
}

function InviteCorpUserModal({ onClose, onSent }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit() {
    if (!form.name.trim())  { setError('Name is required.'); return }
    if (/[0-9]/.test(form.name.trim())) { setError('Name must contain only letters.'); return }
    if (!form.email.trim()) { setError('Email is required.'); return }
    setSaving(true); setError('')
    try {
      await apiFetch('POST', '/corporate/users', {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || undefined,
        password: Math.random().toString(36).slice(2) + 'Aa1!',
        isActive: true,
      })
      showToast('User created. They can log in once a password is set for them.')
      onSent()
    } catch (err) {
      setError(err.message || 'Could not invite user.')
      setSaving(false)
    }
  }

  return (
    <Modal
      title="Invite User"
      onClose={() => !saving && onClose()}
      actions={[
        { label: saving ? 'Sending…' : 'Send Invite', primary: true, onClick: submit, disabled: saving },
        { label: 'Cancel', onClick: () => !saving && onClose() },
      ]}
    >
      {error && <div className="mb-3 p-2.5 rounded border border-red-200 bg-red-50 text-red-700 text-[12px]">{error}</div>}
      <FormGroup label="Full Name"><Input value={form.name} onChange={e => { if (/^[^0-9]*$/.test(e.target.value)) set('name')(e) }} placeholder="Jane Doe" /></FormGroup>
      <FormGroup label="Email"><Input type="email" value={form.email} onChange={set('email')} placeholder="colleague@company.com" /></FormGroup>
      <FormGroup label="Phone (optional)"><PhoneInput value={form.phone} onChange={set('phone')} /></FormGroup>
      <div className="mt-3 p-3 bg-surface2 rounded text-xs text-text2">They will have access to your corporate portal once activated.</div>
    </Modal>
  )
}

function EditCorpUserModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    name:  user.name  || '',
    phone: user.phone || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit() {
    if (!form.name.trim()) { setError('Name is required.'); return }
    if (/[0-9]/.test(form.name.trim())) { setError('Name must contain only letters.'); return }
    setSaving(true); setError('')
    try {
      await apiFetch('PUT', `/corporate/users/${user._id}`, {
        name: form.name.trim(),
        phone: form.phone.trim(),
      })
      showToast('User updated.')
      onSaved()
    } catch (err) {
      setError(err.message || 'Could not save changes.')
      setSaving(false)
    }
  }

  return (
    <Modal
      title={`Edit ${user.name || 'user'}`}
      onClose={() => !saving && onClose()}
      actions={[
        { label: saving ? 'Saving…' : 'Save', primary: true, onClick: submit, disabled: saving },
        { label: 'Cancel', onClick: () => !saving && onClose() },
      ]}
    >
      {error && <div className="mb-3 p-2.5 rounded border border-red-200 bg-red-50 text-red-700 text-[12px]">{error}</div>}
      <FormGroup label="Email (read-only)">
        <Input type="email" value={user.email || ''} disabled />
      </FormGroup>
      <FormGroup label="Full Name">
        <Input value={form.name} onChange={e => { if (/^[^0-9]*$/.test(e.target.value)) set('name')(e) }} />
      </FormGroup>
      <FormGroup label="Phone">
        <PhoneInput value={form.phone} onChange={set('phone')} />
      </FormGroup>
      <div className="text-[11px] text-text2 mt-1">
        To change status or password, use the Activate / Deactivate action on the users list.
      </div>
    </Modal>
  )
}

// ============================================================
// OCCASIONS PAGE CONSTANTS
// ============================================================
const OCC_MONTH_NAMES  = ['January','February','March','April','May','June','July','August','September','October','November','December']
const OCC_MONTH_SHORT  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const OCC_WEEKDAYS     = ['Su','Mo','Tu','We','Th','Fr','Sa']
const OCC_TYPE_LABELS  = [
  { value: 'birthday',    label: 'Birthday' },
  { value: 'anniversary', label: 'Anniversary' },
  { value: 'holiday',     label: 'Holiday' },
  { value: 'custom',      label: 'Custom' },
]
const OCC_TYPE_EMOJI   = { birthday: '🎂', anniversary: '🎊', holiday: '🎉', custom: '📅' }

function occIsoYMD(d) {
  const y  = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const da = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${da}`
}

const EMPTY_OCC_FORM = { staff: '', type: 'birthday', date: '', notes: '' }

export function CorpOccasionsPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [occasions, setOccasions]       = useState([])
  const [loading, setLoading]           = useState(false)
  const [staffList, setStaffList]       = useState([])
  const [showAdd, setShowAdd]           = useState(false)
  const [form, setForm]                 = useState(EMPTY_OCC_FORM)
  const [formError, setFormError]       = useState('')
  const [saving, setSaving]             = useState(false)
  const [selectedDay, setSelectedDay]   = useState(null)
  const [deletingId, setDeletingId]     = useState(null)

  const year        = currentMonth.getFullYear()
  const month       = currentMonth.getMonth()
  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevLast    = new Date(year, month, 0).getDate()
  const leading     = firstDay
  const trailing    = (7 - ((leading + daysInMonth) % 7)) % 7
  const today       = new Date()
  const isThisMonth = year === today.getFullYear() && month === today.getMonth()

  async function loadOccasions() {
    setLoading(true)
    const from = occIsoYMD(new Date(year, month, 1))
    const to   = occIsoYMD(new Date(year, month + 1, 0))
    try {
      const res = await apiFetch('GET', `/corporate/occasions?from=${from}&to=${to}`)
      setOccasions(res.data?.occasions || [])
    } catch (err) {
      setOccasions([])
      showToast(err.message || 'Failed to load occasions.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadOccasions() }, [year, month])

  useEffect(() => {
    apiFetch('GET', '/corporate/staff')
      .then(res => setStaffList(res.data?.staff || []))
      .catch(() => setStaffList([]))
  }, [])

  const eventMap = {}
  for (const occ of occasions) {
    const d = new Date(occ.date)
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate()
      ;(eventMap[day] = eventMap[day] || []).push(occ)
    }
  }

  const startOfToday = new Date(today); startOfToday.setHours(0, 0, 0, 0)
  const upcoming = [...occasions]
    .filter(o => new Date(o.date) >= startOfToday)
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  const dayDetails = selectedDay != null ? (eventMap[selectedDay] || []) : []

  function openAddModal(prefillDate) {
    setForm({ ...EMPTY_OCC_FORM, date: prefillDate || '' })
    setFormError('')
    setShowAdd(true)
  }
  function closeAddModal() {
    setShowAdd(false)
    setForm(EMPTY_OCC_FORM)
    setFormError('')
    setSaving(false)
  }

  async function deleteOccasion(id) {
    if (!window.confirm('Are you sure you want to delete this occasion?')) return
    setDeletingId(id)
    try {
      await apiFetch('DELETE', `/corporate/occasions/${id}`)
      setOccasions(list => list.filter(o => o._id !== id))
      if (selectedDay != null) setSelectedDay(null)
      showToast('Occasion deleted.')
    } catch (err) {
      showToast(err.message || 'Could not delete.', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  async function submitAdd() {
    if (!form.staff)  { setFormError('Staff member is required.'); return }
    if (!form.type)   { setFormError('Type is required.'); return }
    if (!form.date)   { setFormError('Date is required.'); return }
    setSaving(true)
    setFormError('')
    try {
      await apiFetch('POST', '/corporate/occasions', {
        staff: form.staff,
        type: form.type,
        date: form.date,
        notes: form.notes || undefined,
      })
      await loadOccasions()
      showToast('Occasion added.')
      closeAddModal()
    } catch (err) {
      setFormError(err.message || 'Could not add occasion.')
      setSaving(false)
    }
  }

  function daysUntil(dateStr) {
    const d = new Date(dateStr); d.setHours(0, 0, 0, 0)
    const diff = Math.round((d - startOfToday) / 86400000)
    if (diff === 0) return 'today'
    if (diff === 1) return 'tomorrow'
    return `in ${diff} days`
  }

  const staffNameById = id => {
    const s = staffList.find(x => x._id === id)
    return s ? `${s.firstName} ${s.lastName}` : ''
  }

  const renderStaffLabel = occ => {
    if (occ.staff && typeof occ.staff === 'object') {
      return `${occ.staff.firstName || ''} ${occ.staff.lastName || ''}`.trim()
    }
    return staffNameById(occ.staff) || '—'
  }

  return (
    <div>
      <PageHeader title="Occasions & Calendar" subtitle="Track birthdays, anniversaries, and events">
        <Btn variant="primary" onClick={() => openAddModal()}>+ Add Occasion</Btn>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
        <Card>
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Btn size="sm" onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}>‹</Btn>
              <div className="px-2.5 py-1 rounded border border-border2 bg-surface text-text1 font-semibold text-sm">
                {OCC_MONTH_NAMES[month]} {year}
              </div>
              <Btn size="sm" onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}>›</Btn>
            </div>
            <Btn size="sm" onClick={() => setCurrentMonth(new Date())}>Today</Btn>
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 min-w-[280px]">
            {OCC_WEEKDAYS.map((d, i) => (
              <div key={d + i} className="text-center text-[11px] font-medium text-text2 py-1.5">{d}</div>
            ))}

            {/* Leading grey days */}
            {Array.from({ length: leading }, (_, i) => (
              <div key={`lead-${i}`} className="min-h-[44px] sm:aspect-square sm:min-h-0 rounded flex items-center justify-center text-[12px] text-text3 opacity-40">
                {prevLast - leading + i + 1}
              </div>
            ))}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1
              const evs = eventMap[day] || []
              const isToday = isThisMonth && day === today.getDate()
              const isSelected = selectedDay === day
              const dateStr = occIsoYMD(new Date(year, month, day))
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    if (evs.length > 0) {
                      // Toggle selection; panel shows existing events + prominent Add button
                      setSelectedDay(selectedDay === day ? null : day)
                    } else {
                      // Empty day — go straight to add modal
                      openAddModal(dateStr)
                    }
                  }}
                  title={evs.length ? `${evs.length} occasion${evs.length > 1 ? 's' : ''} — click to view & add more` : `Add occasion on ${dateStr}`}
                  className={`relative min-h-[44px] sm:aspect-square sm:min-h-0 rounded flex flex-col items-center justify-center cursor-pointer text-[12px] border transition-all outline-none
                    ${isSelected ? 'bg-accent text-white border-accent' : ''}
                    ${!isSelected && isToday ? 'bg-accent-light text-accent font-semibold border-accent' : ''}
                    ${!isSelected && !isToday ? 'border-transparent hover:bg-surface2 hover:border-border2' : ''}`}
                >
                  <span>{day}</span>
                  {evs.length > 0 && (
                    <span className="mt-0.5 flex items-center gap-0.5">
                      {evs.slice(0, 3).map((_, j) => (
                        <span key={j} className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-accent'}`} />
                      ))}
                      {evs.length > 3 && <span className={`text-[9px] leading-none ${isSelected ? 'text-white' : 'text-accent'}`}>+</span>}
                    </span>
                  )}
                </button>
              )
            })}

            {/* Trailing grey days */}
            {Array.from({ length: trailing }, (_, i) => (
              <div key={`trail-${i}`} className="min-h-[44px] sm:aspect-square sm:min-h-0 rounded flex items-center justify-center text-[12px] text-text3 opacity-40">
                {i + 1}
              </div>
            ))}
          </div>

          {loading && <div className="text-[11px] text-text3 mt-3 text-center">Loading…</div>}

          {/* ── Day detail panel (shown when a day with events is selected) ── */}
          {selectedDay != null && dayDetails.length > 0 && (
            <div className="mt-5 border-t border-border pt-4">
              {/* Panel header */}
              <div className="flex items-center justify-between mb-3">
                <div className="text-[13px] font-medium">
                  {OCC_MONTH_NAMES[month]} {selectedDay}, {year}
                  <span className="ml-2 text-[11px] text-text2 font-normal">
                    {dayDetails.length} occasion{dayDetails.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* ── Prominent "Add Another" button ── */}
                  <button
                    type="button"
                    onClick={() => openAddModal(occIsoYMD(new Date(year, month, selectedDay)))}
                    className="inline-flex items-center gap-1 bg-accent text-white text-[11px] font-semibold px-2.5 py-1 rounded-md hover:opacity-90 transition-opacity"
                  >
                    + Add Occasion
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDay(null)}
                    className="text-[11px] text-text2 hover:text-text1 px-1"
                  >
                    × Close
                  </button>
                </div>
              </div>

              {/* Event list */}
              <div className="flex flex-col gap-2">
                {dayDetails.map(occ => (
                  <div key={occ._id} className="flex items-start gap-2 px-2.5 py-2 rounded-lg bg-surface2 border border-border text-[12px]">
                    <span className="text-base leading-none mt-0.5">{OCC_TYPE_EMOJI[occ.type] || '📅'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{occ.title}</div>
                      <div className="text-[11px] text-text2 mt-0.5">{renderStaffLabel(occ)} · {occ.type}</div>
                      {occ.notes && <div className="text-[11px] text-text2 mt-0.5">{occ.notes}</div>}
                      <GoogleSyncRowAction
                        occasion={occ}
                        basePath="/corporate/occasions"
                        onSynced={(patch) => setOccasions(list => list.map(o => o._id === occ._id ? { ...o, ...patch } : o))}
                      />
                    </div>
                    <button
                      onClick={() => deleteOccasion(occ._id)}
                      disabled={deletingId === occ._id}
                      className="text-red-400 hover:text-red-600 text-[13px] disabled:opacity-50 flex-shrink-0 mt-0.5"
                      title="Delete"
                    >🗑</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Upcoming occasions sidebar */}
        <Card>
          <CardHeader title="Upcoming Occasions" />
          {upcoming.length === 0 ? (
            <div className="text-text2 text-sm py-6 text-center">No records found.</div>
          ) : (
            <div className="flex flex-col gap-0">
              {upcoming.map((e, i, arr) => (
                <div key={e._id || i} className="flex items-start gap-3 pb-4 relative">
                  {i < arr.length - 1 && <div className="absolute left-[14px] top-7 bottom-0 w-px bg-border" />}
                  <div className="w-7 h-7 rounded-full bg-accent-light border-2 border-accent flex items-center justify-center text-[11px] z-10">
                    {OCC_TYPE_EMOJI[e.type] || '📅'}
                  </div>
                  <div className="flex-1 pt-0.5 min-w-0">
                    <div className="text-[13px] font-medium truncate">{renderStaffLabel(e)}</div>
                    <div className="text-[11px] text-text2 mt-0.5">
                      {e.type.charAt(0).toUpperCase() + e.type.slice(1)} · {formatDate(e.date)} · {daysUntil(e.date)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <Badge status={e.type === 'birthday' ? 'assigned' : e.type === 'anniversary' ? 'processing' : 'new'} />
                    <button
                      onClick={() => deleteOccasion(e._id)}
                      disabled={deletingId === e._id}
                      className="text-[10px] text-red-400 hover:text-red-600 disabled:opacity-50"
                      title="Delete"
                    >🗑 delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Add Occasion Modal */}
      {showAdd && (
        <Modal
          title="Add Occasion"
          onClose={closeAddModal}
          actions={[
            { label: saving ? 'Adding…' : 'Add', primary: true, onClick: submitAdd, disabled: saving },
            { label: 'Cancel', onClick: closeAddModal },
          ]}
        >
          {formError && (
            <div className="mb-3 p-2.5 rounded border border-red-200 bg-red-50 text-red-700 text-[12px]">{formError}</div>
          )}
          <FormGroup label="Staff Member">
            <Select value={form.staff} onChange={e => setForm(f => ({ ...f, staff: e.target.value }))}>
              <option value="">Select staff…</option>
              {staffList.map(s => (
                <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>
              ))}
            </Select>
          </FormGroup>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormGroup label="Type">
              <Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {OCC_TYPE_LABELS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
            </FormGroup>
            <FormGroup label="Date">
              <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </FormGroup>
          </div>
          <FormGroup label="Notes">
            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes…" />
          </FormGroup>
        </Modal>
      )}
    </div>
  )
}

// ============================================================
// TICKETS PAGE
// ============================================================
const TKT_CATEGORY_OPTIONS = [
  { value: 'general',   label: 'General' },
  { value: 'order',     label: 'Order' },
  { value: 'delivery',  label: 'Delivery' },
  { value: 'billing',   label: 'Billing' },
  { value: 'technical', label: 'Technical' },
]
const TKT_PRIORITY_OPTIONS = [
  { value: 'low',    label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high',   label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]
const TKT_STATUS_LABELS = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed' }
const TKT_PRIORITY_BADGE = { low: 'new', medium: 'processing', high: 'overdue', urgent: 'failed' }
const EMPTY_TICKET_FORM = { subject: '', category: 'general', priority: 'medium', description: '' }

export function CorpTicketsPage() {
  const [tickets, setTickets]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm]             = useState(EMPTY_TICKET_FORM)
  const [formError, setFormError]   = useState('')
  const [saving, setSaving]         = useState(false)
  const [detail, setDetail]         = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [commentError, setCommentError] = useState('')
  const [posting, setPosting]       = useState(false)

  async function loadTickets() {
    try {
      const res = await apiFetch('GET', '/corporate/tickets')
      setTickets(res.data?.tickets || [])
    } catch (err) {
      showToast(err.message || 'Failed to load tickets.', 'error')
      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTickets() }, [])

  const counts = {
    open:       tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved:   tickets.filter(t => t.status === 'resolved').length,
  }

  function openCreateModal() {
    setForm(EMPTY_TICKET_FORM)
    setFormError('')
    setShowCreate(true)
  }
  function closeCreateModal() {
    setShowCreate(false)
    setForm(EMPTY_TICKET_FORM)
    setFormError('')
    setSaving(false)
  }

  async function submitCreate() {
    if (!form.subject.trim())     { setFormError('Subject is required.'); return }
    if (!form.description.trim()) { setFormError('Description is required.'); return }
    setSaving(true)
    setFormError('')
    try {
      await apiFetch('POST', '/corporate/tickets', {
        subject: form.subject.trim(),
        description: form.description.trim(),
        category: form.category,
        priority: form.priority,
      })
      await loadTickets()
      showToast('Ticket created.')
      closeCreateModal()
    } catch (err) {
      setFormError(err.message || 'Could not create ticket.')
      setSaving(false)
    }
  }

  async function openDetail(ticket) {
    setDetail({ ticket, comments: [] })
    setCommentText('')
    setCommentError('')
    setDetailLoading(true)
    try {
      const res = await apiFetch('GET', `/corporate/tickets/${ticket._id}`)
      setDetail({ ticket: res.data?.ticket || ticket, comments: res.data?.comments || [] })
    } catch (err) {
      showToast(err.message || 'Could not load ticket.', 'error')
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }
  function closeDetail() {
    setDetail(null)
    setCommentText('')
    setCommentError('')
    setPosting(false)
  }

  async function postComment() {
    if (!commentText.trim()) { setCommentError('Message is required.'); return }
    if (!detail) return
    setPosting(true)
    setCommentError('')
    try {
      const res = await apiFetch('POST', `/corporate/tickets/${detail.ticket._id}/comment`, { message: commentText.trim() })
      setDetail(d => ({ ...d, comments: [...d.comments, res.data.comment] }))
      setCommentText('')
    } catch (err) {
      setCommentError(err.message || 'Could not post comment.')
    } finally {
      setPosting(false)
    }
  }

  if (loading) return <Loading />

  return (
    <div>
      <PageHeader title="Support Tickets" subtitle="Raise and track support requests">
        <Btn variant="primary" onClick={openCreateModal}>+ New Ticket</Btn>
      </PageHeader>

      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          ['Open',         counts.open,       'bg-blue-50 text-blue-800'],
          ['In Progress',  counts.inProgress, 'bg-amber-50 text-amber-800'],
          ['Resolved',     counts.resolved,   'bg-green-50 text-green-800'],
        ].map(([label, n, tone]) => (
          <div key={label} className="bg-surface border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-text2">{label}</div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${tone}`}>{n}</span>
            </div>
            <div className="text-[22px] font-semibold mt-1.5">{n}</div>
          </div>
        ))}
      </div>

      <Card noPad>
        <TableWrap>
          <thead><tr><th>Ticket</th><th>Subject</th><th>Category</th><th>Priority</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>
            {tickets.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-text2 text-sm">No records found.</td></tr>
            ) : tickets.map(t => (
              <tr key={t._id}>
                <td><span className="font-mono text-[12px] text-text3">{t.ticketNumber || '—'}</span></td>
                <td className="font-medium">{t.subject}</td>
                <td>{t.category}</td>
                <td><Badge status={TKT_PRIORITY_BADGE[t.priority] || 'new'} /></td>
                <td><Badge status={t.status} /></td>
                <td>{formatDate(t.createdAt)}</td>
                <td><TblAction onClick={() => openDetail(t)}>View</TblAction></td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>

      {showCreate && (
        <Modal
          title="New Support Ticket"
          onClose={closeCreateModal}
          actions={[
            { label: saving ? 'Submitting…' : 'Submit Ticket', primary: true, onClick: submitCreate, disabled: saving },
            { label: 'Cancel', onClick: closeCreateModal },
          ]}
        >
          {formError && (
            <div className="mb-3 p-2.5 rounded border border-red-200 bg-red-50 text-red-700 text-[12px]">{formError}</div>
          )}
          <FormGroup label="Subject">
            <Input placeholder="Brief description of the issue" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
          </FormGroup>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormGroup label="Category">
              <Select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {TKT_CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </FormGroup>
            <FormGroup label="Priority">
              <Select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                {TKT_PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </FormGroup>
          </div>
          <FormGroup label="Description">
            <Textarea placeholder="Describe the issue in detail…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </FormGroup>
        </Modal>
      )}

      {detail && (
        <Modal
          title={`${detail.ticket.ticketNumber || 'Ticket'} · ${detail.ticket.subject}`}
          onClose={closeDetail}
          size="lg"
          actions={[{ label: 'Close', onClick: closeDetail }]}
        >
          <div className="flex flex-wrap gap-2 mb-3 text-[11px]">
            <Badge status={detail.ticket.status} />
            <Badge status={TKT_PRIORITY_BADGE[detail.ticket.priority] || 'new'} />
            <span className="px-2 py-0.5 rounded-full bg-surface2 border border-border text-text2">{detail.ticket.category}</span>
            <span className="text-text2">· Created {formatDate(detail.ticket.createdAt)}</span>
          </div>
          <div className="mb-4 p-3 rounded border border-border bg-surface2 text-[13px] whitespace-pre-wrap">{detail.ticket.description}</div>

          <div className="text-xs font-medium text-text2 uppercase tracking-wider mb-2">Conversation</div>
          {detailLoading ? (
            <div className="text-[12px] text-text3 text-center py-4">Loading…</div>
          ) : detail.comments.length === 0 ? (
            <div className="text-[12px] text-text2 text-center py-4">No replies yet.</div>
          ) : (
            <div className="flex flex-col gap-2 mb-4 max-h-[240px] overflow-y-auto">
              {detail.comments.map(c => (
                <div key={c._id} className="p-2.5 rounded bg-surface2 text-[12px]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{c.author?.name || 'Support'}</span>
                    <span className="text-text3 text-[11px]">{formatDate(c.createdAt)}</span>
                  </div>
                  <div className="whitespace-pre-wrap">{c.message}</div>
                </div>
              ))}
            </div>
          )}

          {detail.ticket.status !== 'closed' && (
            <>
              {commentError && (
                <div className="mb-2 p-2 rounded border border-red-200 bg-red-50 text-red-700 text-[11px]">{commentError}</div>
              )}
              <FormGroup label="Add a comment">
                <Textarea value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Reply to support…" />
              </FormGroup>
              <div className="flex justify-end">
                <Btn variant="primary" onClick={postComment} disabled={posting}>{posting ? 'Posting…' : 'Post Comment'}</Btn>
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  )
}

export function CorpFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    apiFetch('GET', '/corporate/feedback')
      .then(res => setFeedbacks(res.data?.feedbacks || []))
      .catch(err => showToast(err.message || 'Failed to load feedback.', 'error'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loading />

  const total = feedbacks.length
  const avg = total ? (feedbacks.reduce((s, f) => s + (f.rating || 0), 0) / total).toFixed(1) : '0.0'
  const fiveStar = feedbacks.filter(f => f.rating === 5).length

  return (
    <div>
      <PageHeader title="Feedback" subtitle="Your submitted feedback" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="text-xs text-text2 mb-1.5">Average Rating</div>
          <div className="text-[22px] font-semibold">⭐ {avg}/5</div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="text-xs text-text2 mb-1.5">Total Submissions</div>
          <div className="text-[22px] font-semibold">{total}</div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="text-xs text-text2 mb-1.5">5-Star</div>
          <div className="text-[22px] font-semibold">{fiveStar}</div>
        </div>
      </div>
      {total === 0 ? (
        <Card>
          <div className="text-center py-8 text-text2 text-sm">
            No feedback submitted yet. Once a delivery is completed, you can share your experience.
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {feedbacks.map(f => (
            <Card key={f._id} className="py-3 px-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-medium text-[14px]">Order {f.order?.orderNumber || '—'}</div>
                  <div className="text-[11px] text-text2">Submitted {formatDate(f.createdAt)}</div>
                </div>
                <div className="text-lg">{'⭐'.repeat(f.rating || 0)}{'☆'.repeat(5 - (f.rating || 0))}</div>
              </div>
              {f.comment && <div className="text-[13px] text-text2 mb-2">{f.comment}</div>}
              {f.adminResponse && (
                <div className="text-[12px] bg-surface2 border-l-2 border-accent px-3 py-2 rounded mt-2">
                  <div className="text-text2 text-[11px] mb-1">Response from support</div>
                  {f.adminResponse}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}