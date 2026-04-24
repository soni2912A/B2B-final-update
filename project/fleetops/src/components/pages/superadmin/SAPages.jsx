// import React, { useEffect, useState, useRef, useCallback } from 'react'
// import { apiFetch, apiDownload, formatDate, formatCurrency } from '../../../utils/api.js'
// import { Badge, Card, PageHeader, FilterBar, TableWrap, TblAction, Btn, Loading, Modal, FormGroup, Input, Select } from '../../ui/index.jsx'
// import { showToast } from '../../ui/index.jsx'

// const DEBOUNCE_MS = 300

// // ─── SA BUSINESSES ────────────────────────────────────────────────────────────
// export function SABusinessesPage() {
//   const [businesses, setBusinesses] = useState([])
//   const [loading, setLoading]       = useState(true)
//   const [showAdd, setShowAdd]        = useState(false)
//   const [viewingId, setViewingId]   = useState(null)
//   const [filters, setFilters]       = useState({ search: '', plan: '', status: '' })
//   const isTypingRef = useRef(false)

//   const buildQuery = useCallback((f) => {
//     const p = new URLSearchParams()
//     if (f.search) p.set('search', f.search)
//     if (f.plan)   p.set('plan', f.plan)
//     if (f.status) p.set('status', f.status)
//     const qs = p.toString()
//     return qs ? `?${qs}` : ''
//   }, [])

//   const load = useCallback(async (f = filters) => {
//     try {
//       const res = await apiFetch('GET', `/super-admin/businesses${buildQuery(f)}`)
//       setBusinesses(res.data?.businesses || [])
//     } catch (err) {
//       showToast(err.message || 'Failed to load businesses.', 'error')
//     } finally {
//       setLoading(false)
//     }
//   }, [filters, buildQuery])

//   // Debounced re-fetch on filter change.
//   useEffect(() => {
//     isTypingRef.current = true
//     setLoading(true)
//     const handle = setTimeout(() => {
//       isTypingRef.current = false
//       load(filters)
//     }, DEBOUNCE_MS)
//     return () => clearTimeout(handle)
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [filters])

//   function onFilterChange(key, val) { setFilters(f => ({ ...f, [key]: val })) }
//   function onClear() { setFilters({ search: '', plan: '', status: '' }) }

//   async function toggleStatus(id, status) {
//     try {
//       await apiFetch('PATCH', `/super-admin/businesses/${id}/toggle-status`, {})
//       showToast(`Business ${status === 'active' ? 'suspended' : 'activated'}`)
//       load(filters)
//     } catch (err) {
//       showToast(err.message || 'Could not update status.', 'error')
//     }
//   }

//   async function deleteBusiness(id, name) {
//     if (!window.confirm(`Are you sure you want to permanently delete "${name}"? This cannot be undone.`)) return
//     try {
//       await apiFetch('DELETE', `/super-admin/businesses/${id}`)
//       showToast('Business deleted.')
//       load(filters)
//     } catch (err) {
//       showToast(err.message || 'Could not delete business.', 'error')
//     }
//   }

//   return (
//     <div>
//       <PageHeader title="Businesses" subtitle="Manage all tenants on the platform">
//         <Btn variant="primary" onClick={() => setShowAdd(true)}>+ Add Business</Btn>
//       </PageHeader>

//       <FilterBar
//         values={filters}
//         onChange={onFilterChange}
//         onClear={onClear}
//         fields={[
//           { key: 'search', placeholder: 'Search by business name or email…' },
//           { key: 'plan', type: 'select', placeholder: 'All Plans', options: [{ v:'starter',l:'Starter' },{ v:'professional',l:'Professional' },{ v:'enterprise',l:'Enterprise' }] },
//           { key: 'status', type: 'select', placeholder: 'All Statuses', options: [{ v:'active',l:'Active' },{ v:'suspended',l:'Suspended' }] },
//         ]}
//       />

//       <Card noPad>
//         {loading ? <Loading /> : (
//           <TableWrap>
//             <thead><tr><th>Business</th><th>Plan</th><th>Users</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
//             <tbody>
//               {businesses.length === 0 ? (
//                 <tr><td colSpan={6} className="text-center py-10 text-text2 text-sm">No records found.</td></tr>
//               ) : businesses.map(b => (
//                 <tr key={b._id}>
//                   <td>
//                     <div className="font-medium">{b.name}</div>
//                     <div className="text-[11px] text-text2">{b.email}</div>
//                   </td>
//                   <td><Badge status={b.plan} /></td>
//                   <td>{b.users}</td>
//                   <td><Badge status={b.status} /></td>
//                   <td className="text-text2">{formatDate(b.createdAt)}</td>
//                   <td>
//                     <div className="flex gap-1.5">
//                       <TblAction onClick={() => setViewingId(b._id)}>View</TblAction>
//                       <TblAction onClick={() => toggleStatus(b._id, b.status)}>{b.status === 'active' ? 'Suspend' : 'Activate'}</TblAction>
//                       <TblAction variant="danger" onClick={() => deleteBusiness(b._id, b.name)}>Delete</TblAction>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </TableWrap>
//         )}
//       </Card>

//       {showAdd && (
//         <AddBusinessModal
//           onClose={() => setShowAdd(false)}
//           onSaved={() => { setShowAdd(false); load(filters) }}
//         />
//       )}

//       {viewingId && (
//         <BusinessDetailsModal
//           businessId={viewingId}
//           onClose={() => setViewingId(null)}
//           onChanged={() => load(filters)}
//         />
//       )}
//     </div>
//   )
// }

// function formatQuotaUsage(used, limit) {
//   if (limit === null || limit === undefined) return `${used} (unlimited)`
//   return `${used} / ${limit}`
// }

// function BusinessDetailsModal({ businessId, onClose, onChanged }) {
//   const [data, setData]       = useState(null)
//   const [loading, setLoading] = useState(true)
//   const [busy, setBusy]       = useState(false)

//   useEffect(() => {
//     apiFetch('GET', `/super-admin/businesses/${businessId}/details`)
//       .then(res => { setData(res.data); setLoading(false) })
//       .catch(err => { showToast(err.message || 'Failed to load details.', 'error'); onClose() })
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [businessId])

//   async function toggle() {
//     if (!data?.business) return
//     const nextAction = data.business.isActive ? 'Suspend' : 'Activate'
//     if (!window.confirm(`${nextAction} ${data.business.name}?`)) return
//     setBusy(true)
//     try {
//       await apiFetch('PATCH', `/super-admin/businesses/${businessId}/toggle-status`, {})
//       showToast(`Business ${data.business.isActive ? 'suspended' : 'activated'}`)
//       onChanged()
//       onClose()
//     } catch (err) {
//       showToast(err.message || 'Could not update status.', 'error')
//       setBusy(false)
//     }
//   }

//   const actions = loading || !data
//     ? [{ label: 'Close', onClick: onClose }]
//     : [
//         {
//           label: busy ? '…' : (data.business.isActive ? 'Suspend' : 'Activate'),
//           primary: true,
//           onClick: toggle,
//           disabled: busy,
//         },
//         { label: 'Close', onClick: onClose },
//       ]

//   return (
//     <Modal title="Business Details" onClose={onClose} actions={actions}>
//       {loading || !data ? <Loading /> : <BusinessDetailsBody data={data} />}
//     </Modal>
//   )
// }

// function BusinessDetailsBody({ data }) {
//   const { business, subscription, primaryAdmin, usage } = data
//   return (
//     <div className="space-y-4 text-[13px]">
//       <section>
//         <div className="text-[11px] font-medium uppercase tracking-wider text-text3 mb-1.5">Identity</div>
//         <div className="flex items-center gap-3">
//           {business.logo
//             ? <img src={business.logo} alt="" className="w-10 h-10 rounded object-cover" />
//             : <div className="w-10 h-10 rounded bg-surface2 flex items-center justify-center text-text3">🏢</div>}
//           <div className="flex-1 min-w-0">
//             <div className="font-medium text-text1 truncate">{business.name}</div>
//             <div className="text-[11px] text-text2 truncate">{business.email}</div>
//             <div className="text-[11px] text-text3 mt-0.5">Created {formatDate(business.createdAt)}</div>
//           </div>
//           <Badge status={business.isActive ? 'active' : 'suspended'} />
//         </div>
//       </section>

//       <section>
//         <div className="text-[11px] font-medium uppercase tracking-wider text-text3 mb-1.5">Primary Admin</div>
//         {primaryAdmin ? (
//           <div>
//             <div className="font-medium">{primaryAdmin.name}</div>
//             <div className="text-[11px] text-text2">{primaryAdmin.email}</div>
//           </div>
//         ) : <div className="text-text3">—</div>}
//       </section>

//       <section>
//         <div className="text-[11px] font-medium uppercase tracking-wider text-text3 mb-1.5">Current Plan</div>
//         {subscription ? (
//           <div>
//             <div className="font-medium">{subscription.name}</div>
//             <div className="text-[11px] text-text2">{formatCurrency(subscription.price)} / {subscription.billingCycle}</div>
//             {subscription.features?.length > 0 && (
//               <ul className="mt-1.5 text-[12px] text-text2 list-disc ml-4">
//                 {subscription.features.map((f, i) => <li key={i}>{f}</li>)}
//               </ul>
//             )}
//           </div>
//         ) : <div className="text-text3">—</div>}
//       </section>

//       <section>
//         <div className="text-[11px] font-medium uppercase tracking-wider text-text3 mb-1.5">Usage</div>
//         <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
//           <div className="flex justify-between"><span className="text-text2">Corporates</span><span>{formatQuotaUsage(usage.corporates, subscription?.maxCorporates)}</span></div>
//           <div className="flex justify-between"><span className="text-text2">Staff</span><span>{formatQuotaUsage(usage.staff, subscription?.maxStaffPerCorporate)}</span></div>
//           <div className="flex justify-between"><span className="text-text2">Orders</span><span>{formatQuotaUsage(usage.orders, subscription?.maxOrders)}</span></div>
//           <div className="flex justify-between"><span className="text-text2">Users</span><span>{usage.users}</span></div>
//         </div>
//       </section>
//     </div>
//   )
// }

// function AddBusinessModal({ onClose, onSaved }) {
//   const EMPTY = { name: '', adminName: '', adminEmail: '', adminPassword: '', plan: 'starter' }
//   const [form, setForm]     = useState(EMPTY)
//   const [error, setError]   = useState('')
//   const [saving, setSaving] = useState(false)

//   function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }

//   async function save() {
//     const name = form.name.trim()
//     const adminEmail = form.adminEmail.trim()

//     if (!name) { setError('Business name is required.'); return }
//     // Heuristic: if Business Name contains an @, the user likely typed their
//     // email into the wrong field. Catch this before the server reports a
//     // confusing uniqueness error.
//     if (name.includes('@')) {
//       setError('Business Name should be your company name (e.g. "Acme Logistics"), not an email.')
//       return
//     }
//     if (!adminEmail) { setError('Admin email is required.'); return }
//     if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
//       setError('Admin email format is invalid.'); return
//     }
//     if (!form.adminPassword || form.adminPassword.length < 6) {
//       setError('Admin password must be at least 6 characters.'); return
//     }

//     setSaving(true); setError('')
//     try {
//       await apiFetch('POST', '/super-admin/businesses', {
//         name,
//         adminEmail,
//         adminPassword: form.adminPassword,
//         adminName: form.adminName.trim() || undefined,
//         plan: form.plan || undefined,
//       })
//       showToast('Business created.')
//       onSaved()
//     } catch (err) {
//       setError(err.message || 'Could not create business.')
//       setSaving(false)
//     }
//   }

//   return (
//     <Modal
//       title="Add Business"
//       onClose={onClose}
//       actions={[
//         { label: saving ? 'Creating…' : 'Create Business', primary: true, onClick: save, disabled: saving },
//         { label: 'Cancel', onClick: onClose },
//       ]}
//     >
//       {error && <div className="mb-3 p-2.5 rounded border border-red-200 bg-red-50 text-red-700 text-[12px]">{error}</div>}
//       <FormGroup label="Business Name">
//         <Input value={form.name} onChange={set('name')} placeholder="e.g. Acme Logistics" />
//       </FormGroup>
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//         <FormGroup label="Admin Name (optional)">
//           <Input value={form.adminName} onChange={set('adminName')} placeholder="Jane Doe" />
//         </FormGroup>
//         <FormGroup label="Plan">
//           <Select value={form.plan} onChange={set('plan')}>
//             <option value="starter">Starter</option>
//             <option value="professional">Professional</option>
//             <option value="enterprise">Enterprise</option>
//           </Select>
//         </FormGroup>
//       </div>
//       <FormGroup label="Admin Email">
//         <Input type="email" value={form.adminEmail} onChange={set('adminEmail')} placeholder="admin@company.com" />
//       </FormGroup>
//       <FormGroup label="Admin Password">
//         <Input type="password" value={form.adminPassword} onChange={set('adminPassword')} placeholder="Initial password (min 6 chars)" />
//       </FormGroup>
//       <div className="text-[11px] text-text2 mt-1">
//         The admin email also serves as the business's primary contact. The admin can change their password after first login.
//       </div>
//     </Modal>
//   )
// }

// // ─── SA SUBSCRIPTIONS ─────────────────────────────────────────────────────────
// // Plan catalog. Source of truth is the Subscription schema (see
// // backend/src/models/Subscription.model.js). Fields displayed here match that
// // schema exactly — editing a field updates the same field in the DB. NO quota
// // enforcement exists anywhere in the codebase today; the notice below makes
// // this explicit to super-admins.

// // Quota convention: null/undefined → "Unlimited" (Enterprise tier). Numeric 0
// // would display literally as "0", which is a valid "no allowance" value if
// // anyone ever wants it. Seed.js uses null for unlimited, matching this.
// function formatQuota(val) {
//   if (val === null || val === undefined) return 'Unlimited'
//   return val
// }

// export function SASubscriptionsPage() {
//   const [plans, setPlans]     = useState([])
//   const [loading, setLoading] = useState(true)
//   const [editing, setEditing] = useState(null)
//   const [creating, setCreating] = useState(false)

//   async function load() {
//     try {
//       const res = await apiFetch('GET', '/super-admin/subscriptions')
//       // Filter to template plans only (business: null). Tenant-instance rows
//       // from self-registered admins also live in this collection but aren't
//       // catalog entries and shouldn't show up here.
//       const all = res.data?.subscriptions || []
//       setPlans(all.filter(p => !p.business))
//     } catch (err) {
//       showToast(err.message || 'Failed to load subscription plans.', 'error')
//     } finally {
//       setLoading(false)
//     }
//   }

//   useEffect(() => { load() }, [])

//   if (loading) return <Loading />

//   return (
//     <div>
//       <PageHeader title="Subscription Plans">
//         <Btn variant="primary" onClick={() => setCreating(true)}>+ New Plan</Btn>
//       </PageHeader>

//       {/* Honest label — sets expectations that edits here are display-only. */}
//       <div className="mb-5 px-3 py-2 rounded border border-border bg-surface2 text-[12px] text-text2">
//         Plan catalog — plans created here appear on the admin self-registration page. Quotas and features are not enforced at runtime yet.
//       </div>

//       {plans.length === 0 ? (
//         <Card>
//           <div className="py-6 text-center text-text2 text-sm">
//             No plans found. The plan catalog is seeded via <span className="font-mono">npm run seed</span>.
//           </div>
//         </Card>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
//           {plans.map(p => {
//             const popular = (p.name || '').toLowerCase() === 'professional'
//             return (
//               <div key={p._id} className={`bg-surface border rounded-lg overflow-hidden ${popular ? 'border-accent' : 'border-border'}`}>
//                 {popular && <div className="bg-accent text-white text-center py-1.5 text-xs font-medium">Most Popular</div>}
//                 <div className="p-6">
//                   <div className="text-lg font-bold mb-1">{p.name}</div>
//                   <div className="flex items-baseline gap-1 my-3">
//                     <span className="text-[32px] font-bold">{formatCurrency(p.price)}</span>
//                     <span className="text-[14px] text-text2">/{p.billingCycle === 'yearly' ? 'yr' : 'mo'}</span>
//                   </div>
//                   <div className="grid grid-cols-1 gap-1.5 text-[12px] text-text2 mb-4">
//                     <div className="flex justify-between"><span>Max Corporates</span><span className="font-medium text-text1">{formatQuota(p.maxCorporates)}</span></div>
//                     <div className="flex justify-between"><span>Max Staff per Corp</span><span className="font-medium text-text1">{formatQuota(p.maxStaffPerCorporate)}</span></div>
//                     <div className="flex justify-between"><span>Max Orders</span><span className="font-medium text-text1">{formatQuota(p.maxOrders)}</span></div>
//                   </div>
//                   <div className="flex flex-col gap-2 mb-5 min-h-[60px]">
//                     {(p.features || []).length === 0 ? (
//                       <div className="text-[12px] text-text3 italic">No features listed</div>
//                     ) : p.features.map(f => (
//                       <div key={f} className="flex items-center gap-2 text-[13px]">
//                         <span className="text-accent">✓</span> {f}
//                       </div>
//                     ))}
//                   </div>
//                   <Btn
//                     variant={popular ? 'primary' : 'secondary'}
//                     className="w-full justify-center"
//                     onClick={() => setEditing(p)}
//                   >
//                     Edit Plan
//                   </Btn>
//                 </div>
//               </div>
//             )
//           })}
//         </div>
//       )}

//       {editing && (
//         <EditPlanModal
//           plan={editing}
//           mode="edit"
//           onClose={() => setEditing(null)}
//           onSaved={() => { setEditing(null); load() }}
//         />
//       )}

//       {creating && (
//         <EditPlanModal
//           plan={null}
//           mode="create"
//           onClose={() => setCreating(false)}
//           onSaved={() => { setCreating(false); load() }}
//         />
//       )}
//     </div>
//   )
// }

// function EditPlanModal({ plan, mode = 'edit', onClose, onSaved }) {
//   // Form state mirrors Subscription schema exactly. On edit, name stays
//   // read-only (plan identity). On create, name is required and editable.
//   const isCreate = mode === 'create'
//   const [form, setForm] = useState({
//     name: plan?.name || '',
//     price: plan?.price ?? 0,
//     billingCycle: plan?.billingCycle || 'monthly',
//     maxCorporates: plan?.maxCorporates ?? 10,
//     maxStaffPerCorporate: plan?.maxStaffPerCorporate ?? 100,
//     maxOrders: plan?.maxOrders ?? 500,
//     featuresText: (plan?.features || []).join(', '),
//   })
//   const [saving, setSaving] = useState(false)
//   const [error, setError]   = useState('')

//   function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }

//   async function save() {
//     const priceNum = Number(form.price)
//     const maxCorp  = Number(form.maxCorporates)
//     const maxStaff = Number(form.maxStaffPerCorporate)
//     const maxOrd   = Number(form.maxOrders)

//     if (isCreate && !form.name.trim())              { setError('Plan name is required.'); return }
//     if (!Number.isFinite(priceNum) || priceNum < 0) { setError('Price must be a non-negative number.'); return }
//     if (!Number.isFinite(maxCorp) || maxCorp < 0)   { setError('Max Corporates must be a non-negative number.'); return }
//     if (!Number.isFinite(maxStaff) || maxStaff < 0) { setError('Max Staff per Corp must be a non-negative number.'); return }
//     if (!Number.isFinite(maxOrd) || maxOrd < 0)     { setError('Max Orders must be a non-negative number.'); return }

//     const features = form.featuresText
//       .split(',')
//       .map(s => s.trim())
//       .filter(Boolean)

//     setSaving(true); setError('')
//     try {
//       if (isCreate) {
//         await apiFetch('POST', '/super-admin/subscriptions', {
//           name: form.name.trim(),
//           price: priceNum,
//           billingCycle: form.billingCycle,
//           maxCorporates: maxCorp,
//           maxStaffPerCorporate: maxStaff,
//           maxOrders: maxOrd,
//           features,
//           isActive: true,
//         })
//         showToast('Plan created.')
//       } else {
//         // Edit: the backend allowlist drops `name` and other stray keys, so this
//         // only updates the catalog fields.
//         await apiFetch('PUT', `/super-admin/subscriptions/${plan._id}`, {
//           price: priceNum,
//           billingCycle: form.billingCycle,
//           maxCorporates: maxCorp,
//           maxStaffPerCorporate: maxStaff,
//           maxOrders: maxOrd,
//           features,
//         })
//         showToast('Plan updated.')
//       }
//       onSaved()
//     } catch (err) {
//       setError(err.message || (isCreate ? 'Could not create plan.' : 'Could not update plan.'))
//       setSaving(false)
//     }
//   }

//   return (
//     <Modal
//       title={isCreate ? 'New Plan' : `Edit ${plan.name}`}
//       onClose={onClose}
//       actions={[
//         { label: saving ? 'Saving…' : (isCreate ? 'Create Plan' : 'Save'), primary: true, onClick: save, disabled: saving },
//         { label: 'Cancel', onClick: onClose },
//       ]}
//     >
//       {error && <div className="mb-3 p-2.5 rounded border border-red-200 bg-red-50 text-red-700 text-[12px]">{error}</div>}

//       <FormGroup label={isCreate ? 'Name' : 'Name (read-only)'}>
//         <Input
//           value={form.name}
//           onChange={isCreate ? set('name') : undefined}
//           disabled={!isCreate}
//           placeholder={isCreate ? 'e.g. Starter, Professional, Enterprise' : undefined}
//         />
//       </FormGroup>
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//         <FormGroup label="Price">
//           <Input type="number" value={form.price} onChange={set('price')} />
//         </FormGroup>
//         <FormGroup label="Billing Cycle">
//           <Select value={form.billingCycle} onChange={set('billingCycle')}>
//             <option value="monthly">Monthly</option>
//             <option value="yearly">Yearly</option>
//           </Select>
//         </FormGroup>
//         <FormGroup label="Max Corporates">
//           <Input type="number" value={form.maxCorporates} onChange={set('maxCorporates')} />
//         </FormGroup>
//         <FormGroup label="Max Staff per Corp">
//           <Input type="number" value={form.maxStaffPerCorporate} onChange={set('maxStaffPerCorporate')} />
//         </FormGroup>
//       </div>
//       <FormGroup label="Max Orders">
//         <Input type="number" value={form.maxOrders} onChange={set('maxOrders')} />
//       </FormGroup>
//       <FormGroup label="Features (comma-separated)">
//         <Input
//           value={form.featuresText}
//           onChange={set('featuresText')}
//           placeholder="bulk_import, api_access, priority_support"
//         />
//       </FormGroup>
//       <div className="text-[11px] text-text2 mt-1">
//         Displayed as checkmarks on the plan card. Not enforced anywhere today.
//       </div>
//     </Modal>
//   )
// }

// // ─── SA LOGS (platform-wide login audit) ─────────────────────────────────────
// const SA_LOGS_DEBOUNCE_MS = 300

// export function SAPlatformLogsPage() {
//   const [filters, setFilters] = useState({ search: '', status: '', from: '', to: '' })
//   const [logs, setLogs]       = useState([])
//   const [loading, setLoading] = useState(true)
//   const [exporting, setExporting] = useState(false)

//   const buildQuery = useCallback((f) => {
//     const p = new URLSearchParams()
//     if (f.search) p.set('search', f.search)
//     if (f.status) p.set('status', f.status)
//     if (f.from)   p.set('from', f.from)
//     if (f.to)     p.set('to', f.to)
//     const qs = p.toString()
//     return qs ? `?${qs}` : ''
//   }, [])

//   const load = useCallback(async (f) => {
//     try {
//       const res = await apiFetch('GET', `/super-admin/login-logs${buildQuery(f)}`)
//       setLogs(res.data?.logs || [])
//     } catch (err) {
//       showToast(err.message || 'Failed to load logs.', 'error')
//     } finally {
//       setLoading(false)
//     }
//   }, [buildQuery])

//   // Debounced re-fetch on filter change.
//   useEffect(() => {
//     setLoading(true)
//     const handle = setTimeout(() => load(filters), SA_LOGS_DEBOUNCE_MS)
//     return () => clearTimeout(handle)
//   }, [filters, load])

//   function onFilterChange(key, val) {
//     setFilters(f => ({ ...f, [key]: val }))
//   }
//   function onClear() {
//     setFilters({ search: '', status: '', from: '', to: '' })
//   }

//   async function doExport() {
//     setExporting(true)
//     try {
//       await apiDownload(`/super-admin/login-logs/export${buildQuery(filters)}`, `platform-login-logs-${Date.now()}.xlsx`)
//     } catch (err) {
//       showToast(err.message || 'Export failed.', 'error')
//     } finally {
//       setExporting(false)
//     }
//   }

//   return (
//     <div>
//       <PageHeader title="Platform Logs" subtitle="All cross-tenant login and activity events">
//         <Btn size="sm" onClick={doExport} disabled={exporting}>{exporting ? 'Exporting…' : '↓ Export'}</Btn>
//       </PageHeader>
//       <FilterBar
//         values={filters}
//         onChange={onFilterChange}
//         onClear={onClear}
//         fields={[
//           { key: 'search', placeholder: 'Search by user, email, or IP…' },
//           { key: 'status', type: 'select', placeholder: 'All', options: [{ v:'success',l:'Success' },{ v:'failed',l:'Failed' }] },
//           { key: 'from',   type: 'date' },
//           { key: 'to',     type: 'date' },
//         ]}
//       />
//       <Card noPad>
//         {loading ? <Loading /> : (
//           <TableWrap>
//             <thead><tr><th>User</th><th>IP Address</th><th>Device</th><th>Status</th><th>Date & Time</th></tr></thead>
//             <tbody>
//               {logs.length === 0 ? (
//                 <tr><td colSpan={5} className="text-center py-10 text-text2 text-sm">No records found.</td></tr>
//               ) : logs.map(l => (
//                 <tr key={l._id}>
//                   <td>
//                     <div className="font-medium">{l.user?.name || l.attemptedEmail || 'Unknown'}</div>
//                     <div className="text-[11px] text-text2">{l.user?.email || l.attemptedEmail || ''}</div>
//                   </td>
//                   <td><span className="font-mono text-[12px]">{l.ipAddress || '—'}</span></td>
//                   <td className="text-text2">{l.device || '—'}</td>
//                   <td>
//                     {l.status === 'success'
//                       ? <span className="bg-green-50 text-green-800 px-2 py-0.5 rounded-full text-[11px] font-medium">✓ Success</span>
//                       : <span className="bg-red-50 text-red-800 px-2 py-0.5 rounded-full text-[11px] font-medium">✗ Failed</span>}
//                   </td>
//                   <td className="text-text2 font-mono text-[11px]">{formatDate(l.loggedAt || l.createdAt)}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </TableWrap>
//         )}
//       </Card>
//     </div>
//   )
// }
















import React, { useEffect, useState, useRef, useCallback } from 'react'
import { apiFetch, apiDownload, formatDate, formatCurrency } from '../../../utils/api.js'
import { Badge, Card, PageHeader, FilterBar, TableWrap, TblAction, Btn, Loading, Modal, FormGroup, Input, Select } from '../../ui/index.jsx'
import { showToast } from '../../ui/index.jsx'

const DEBOUNCE_MS = 300

// ─── SA BUSINESSES ────────────────────────────────────────────────────────────
export function SABusinessesPage() {
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [viewingId, setViewingId] = useState(null)
  const [filters, setFilters] = useState({ search: '', plan: '', status: '' })
  const isTypingRef = useRef(false)

  const buildQuery = useCallback((f) => {
    const p = new URLSearchParams()
    if (f.search) p.set('search', f.search)
    if (f.plan) p.set('plan', f.plan)
    if (f.status) p.set('status', f.status)
    const qs = p.toString()
    return qs ? `?${qs}` : ''
  }, [])

  const load = useCallback(async (f = filters) => {
    try {
      const res = await apiFetch('GET', `/super-admin/businesses${buildQuery(f)}`)
      setBusinesses(res.data?.businesses || [])
    } catch (err) {
      showToast(err.message || 'Failed to load businesses.', 'error')
    } finally {
      setLoading(false)
    }
  }, [filters, buildQuery])

  // Debounced re-fetch on filter change.
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
  function onClear() { setFilters({ search: '', plan: '', status: '' }) }

  async function toggleStatus(id, status) {
    try {
      await apiFetch('PATCH', `/super-admin/businesses/${id}/toggle-status`, {})
      showToast(`Business ${status === 'active' ? 'suspended' : 'activated'}`)
      load(filters)
    } catch (err) {
      showToast(err.message || 'Could not update status.', 'error')
    }
  }

  async function deleteBusiness(id, name) {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}"? This cannot be undone.`)) return
    try {
      await apiFetch('DELETE', `/super-admin/businesses/${id}`)
      showToast('Business deleted.')
      load(filters)
    } catch (err) {
      showToast(err.message || 'Could not delete business.', 'error')
    }
  }

  return (
    <div>
      <PageHeader title="Businesses" subtitle="Manage all tenants on the platform">
        <Btn variant="primary" onClick={() => setShowAdd(true)}>+ Add Business</Btn>
      </PageHeader>

      <FilterBar
        values={filters}
        onChange={onFilterChange}
        onClear={onClear}
        fields={[
          { key: 'search', placeholder: 'Search by business name or email…' },
          { key: 'plan', type: 'select', placeholder: 'All Plans', options: [{ v: 'starter', l: 'Starter' }, { v: 'professional', l: 'Professional' }, { v: 'enterprise', l: 'Enterprise' }] },
          { key: 'status', type: 'select', placeholder: 'All Statuses', options: [{ v: 'active', l: 'Active' }, { v: 'suspended', l: 'Suspended' }] },
        ]}
      />

      <Card noPad>
        {loading ? <Loading /> : (
          <TableWrap>
            <thead><tr><th>Business</th><th>Plan</th><th>Users</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              {businesses.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-text2 text-sm">No records found.</td></tr>
              ) : businesses.map(b => (
                <tr key={b._id}>
                  <td>
                    <div className="font-medium">{b.name}</div>
                    <div className="text-[11px] text-text2">{b.email}</div>
                  </td>
                  <td><Badge status={b.plan} /></td>
                  <td>{b.users}</td>
                  <td><Badge status={b.status} /></td>
                  <td className="text-text2">{formatDate(b.createdAt)}</td>
                  <td>
                    <div className="flex gap-1.5">
                      <TblAction onClick={() => setViewingId(b._id)}>View</TblAction>
                      <TblAction onClick={() => toggleStatus(b._id, b.status)}>{b.status === 'active' ? 'Suspend' : 'Activate'}</TblAction>
                      <TblAction variant="danger" onClick={() => deleteBusiness(b._id, b.name)}>Delete</TblAction>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>

      {showAdd && (
        <AddBusinessModal
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); load(filters) }}
        />
      )}

      {viewingId && (
        <BusinessDetailsModal
          businessId={viewingId}
          onClose={() => setViewingId(null)}
          onChanged={() => load(filters)}
        />
      )}
    </div>
  )
}

function formatQuotaUsage(used, limit) {
  if (limit === null || limit === undefined) return `${used} (unlimited)`
  return `${used} / ${limit}`
}

function BusinessDetailsModal({ businessId, onClose, onChanged }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    apiFetch('GET', `/super-admin/businesses/${businessId}/details`)
      .then(res => { setData(res.data); setLoading(false) })
      .catch(err => { showToast(err.message || 'Failed to load details.', 'error'); onClose() })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId])

  async function toggle() {
    if (!data?.business) return
    const nextAction = data.business.isActive ? 'Suspend' : 'Activate'
    if (!window.confirm(`${nextAction} ${data.business.name}?`)) return
    setBusy(true)
    try {
      await apiFetch('PATCH', `/super-admin/businesses/${businessId}/toggle-status`, {})
      showToast(`Business ${data.business.isActive ? 'suspended' : 'activated'}`)
      onChanged()
      onClose()
    } catch (err) {
      showToast(err.message || 'Could not update status.', 'error')
      setBusy(false)
    }
  }

  const actions = loading || !data
    ? [{ label: 'Close', onClick: onClose }]
    : [
      {
        label: busy ? '…' : (data.business.isActive ? 'Suspend' : 'Activate'),
        primary: true,
        onClick: toggle,
        disabled: busy,
      },
      { label: 'Close', onClick: onClose },
    ]

  return (
    <Modal title="Business Details" onClose={onClose} actions={actions}>
      {loading || !data ? <Loading /> : <BusinessDetailsBody data={data} />}
    </Modal>
  )
}

function BusinessDetailsBody({ data }) {
  const { business, subscription, primaryAdmin, usage } = data
  return (
    <div className="space-y-4 text-[13px]">
      <section>
        <div className="text-[11px] font-medium uppercase tracking-wider text-text3 mb-1.5">Identity</div>
        <div className="flex items-center gap-3">
          {business.logo
            ? <img src={business.logo} alt="" className="w-10 h-10 rounded object-cover" />
            : <div className="w-10 h-10 rounded bg-surface2 flex items-center justify-center text-text3">🏢</div>}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-text1 truncate">{business.name}</div>
            <div className="text-[11px] text-text2 truncate">{business.email}</div>
            <div className="text-[11px] text-text3 mt-0.5">Created {formatDate(business.createdAt)}</div>
          </div>
          <Badge status={business.isActive ? 'active' : 'suspended'} />
        </div>
      </section>

      <section>
        <div className="text-[11px] font-medium uppercase tracking-wider text-text3 mb-1.5">Primary Admin</div>
        {primaryAdmin ? (
          <div>
            <div className="font-medium">{primaryAdmin.name}</div>
            <div className="text-[11px] text-text2">{primaryAdmin.email}</div>
          </div>
        ) : <div className="text-text3">—</div>}
      </section>

      <section>
        <div className="text-[11px] font-medium uppercase tracking-wider text-text3 mb-1.5">Current Plan</div>
        {subscription ? (
          <div>
            <div className="font-medium">{subscription.name}</div>
            <div className="text-[11px] text-text2">{formatCurrency(subscription.price)} / {subscription.billingCycle}</div>
            {subscription.features?.length > 0 && (
              <ul className="mt-1.5 text-[12px] text-text2 list-disc ml-4">
                {subscription.features.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            )}
          </div>
        ) : <div className="text-text3">—</div>}
      </section>

      <section>
        <div className="text-[11px] font-medium uppercase tracking-wider text-text3 mb-1.5">Usage</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
          <div className="flex justify-between"><span className="text-text2">Corporates</span><span>{formatQuotaUsage(usage.corporates, subscription?.maxCorporates)}</span></div>
          <div className="flex justify-between"><span className="text-text2">Staff</span><span>{formatQuotaUsage(usage.staff, subscription?.maxStaffPerCorporate)}</span></div>
          <div className="flex justify-between"><span className="text-text2">Orders</span><span>{formatQuotaUsage(usage.orders, subscription?.maxOrders)}</span></div>
          <div className="flex justify-between"><span className="text-text2">Users</span><span>{usage.users}</span></div>
        </div>
      </section>
    </div>
  )
}

function AddBusinessModal({ onClose, onSaved }) {
  const EMPTY = { name: '', adminName: '', adminEmail: '', adminPassword: '', plan: 'starter' }
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }

  async function save() {
    const name = form.name.trim()
    const adminEmail = form.adminEmail.trim()

    if (!name) { setError('Business name is required.'); return }
    // Heuristic: if Business Name contains an @, the user likely typed their
    // email into the wrong field. Catch this before the server reports a
    // confusing uniqueness error.
    if (name.includes('@')) {
      setError('Business Name should be your company name (e.g. "Acme Logistics"), not an email.')
      return
    }
    if (form.adminName && /[0-9]/.test(form.adminName.trim())) { setError('Admin name must contain only letters.'); return }
    if (!adminEmail) { setError('Admin email is required.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
      setError('Admin email format is invalid.'); return
    }
    if (!form.adminPassword || form.adminPassword.length < 6) {
      setError('Admin password must be at least 6 characters.'); return
    }

    setSaving(true); setError('')
    try {
      await apiFetch('POST', '/super-admin/businesses', {
        name,
        adminEmail,
        adminPassword: form.adminPassword,
        adminName: form.adminName.trim() || undefined,
        plan: form.plan || undefined,
      })
      showToast('Business created.')
      onSaved()
    } catch (err) {
      setError(err.message || 'Could not create business.')
      setSaving(false)
    }
  }

  return (
    <Modal
      title="Add Business"
      onClose={onClose}
      actions={[
        { label: saving ? 'Creating…' : 'Create Business', primary: true, onClick: save, disabled: saving },
        { label: 'Cancel', onClick: onClose },
      ]}
    >
      {error && <div className="mb-3 p-2.5 rounded border border-red-200 bg-red-50 text-red-700 text-[12px]">{error}</div>}
      <FormGroup label="Business Name">
        <Input value={form.name} onChange={set('name')} placeholder="e.g. Acme Logistics" />
      </FormGroup>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FormGroup label="Admin Name (optional)">
          <Input value={form.adminName} onChange={e => { if (/^[^0-9]*$/.test(e.target.value)) set('adminName')(e) }} placeholder="Jane Doe" />
        </FormGroup>
        <FormGroup label="Plan">
          <Select value={form.plan} onChange={set('plan')}>
            <option value="starter">Starter</option>
            <option value="professional">Professional</option>
            <option value="enterprise">Enterprise</option>
          </Select>
        </FormGroup>
      </div>
      <FormGroup label="Admin Email">
        <Input type="email" value={form.adminEmail} onChange={set('adminEmail')} placeholder="admin@company.com" />
      </FormGroup>
      <FormGroup label="Admin Password">
        <Input type="password" value={form.adminPassword} onChange={set('adminPassword')} placeholder="Initial password (min 6 chars)" />
      </FormGroup>
      <div className="text-[11px] text-text2 mt-1">
        The admin email also serves as the business's primary contact. The admin can change their password after first login.
      </div>
    </Modal>
  )
}

// ─── SA SUBSCRIPTIONS ─────────────────────────────────────────────────────────
// Plan catalog. Source of truth is the Subscription schema (see
// backend/src/models/Subscription.model.js). Fields displayed here match that
// schema exactly — editing a field updates the same field in the DB. NO quota
// enforcement exists anywhere in the codebase today; the notice below makes
// this explicit to super-admins.

// Quota convention: null/undefined → "Unlimited" (Enterprise tier). Numeric 0
// would display literally as "0", which is a valid "no allowance" value if
// anyone ever wants it. Seed.js uses null for unlimited, matching this.
function formatQuota(val) {
  if (val === null || val === undefined) return 'Unlimited'
  return val
}

export function SASubscriptionsPage() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)

  async function load() {
    try {
      const res = await apiFetch('GET', '/super-admin/subscriptions')
      // Filter to template plans only (business: null). Tenant-instance rows
      // from self-registered admins also live in this collection but aren't
      // catalog entries and shouldn't show up here.
      const all = res.data?.subscriptions || []
      setPlans(all.filter(p => !p.business))
    } catch (err) {
      showToast(err.message || 'Failed to load subscription plans.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return <Loading />

  return (
    <div>
      <PageHeader title="Subscription Plans">
        <Btn variant="primary" onClick={() => setCreating(true)}>+ New Plan</Btn>
      </PageHeader>

      {/* Honest label — sets expectations that edits here are display-only. */}
      <div className="mb-5 px-3 py-2 rounded border border-border bg-surface2 text-[12px] text-text2">
        Plan catalog — plans created here appear on the admin self-registration page. Quotas and features are not enforced at runtime yet.
      </div>

      {plans.length === 0 ? (
        <Card>
          <div className="py-6 text-center text-text2 text-sm">
            No plans found. The plan catalog is seeded via <span className="font-mono">npm run seed</span>.
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map(p => {
            const popular = (p.name || '').toLowerCase() === 'professional'
            return (
              <div key={p._id} className={`bg-surface border rounded-lg overflow-hidden ${popular ? 'border-accent' : 'border-border'}`}>
                {popular && <div className="bg-accent text-white text-center py-1.5 text-xs font-medium">Most Popular</div>}
                <div className="p-6">
                  <div className="text-lg font-bold mb-1">{p.name}</div>
                  <div className="flex items-baseline gap-1 my-3">
                    <span className="text-[32px] font-bold">{formatCurrency(p.price)}</span>
                    <span className="text-[14px] text-text2">/{p.billingCycle === 'yearly' ? 'yr' : 'mo'}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 text-[12px] text-text2 mb-4">
                    <div className="flex justify-between"><span>Max Corporates</span><span className="font-medium text-text1">{formatQuota(p.maxCorporates)}</span></div>
                    <div className="flex justify-between"><span>Max Staff per Corp</span><span className="font-medium text-text1">{formatQuota(p.maxStaffPerCorporate)}</span></div>
                    <div className="flex justify-between"><span>Max Orders</span><span className="font-medium text-text1">{formatQuota(p.maxOrders)}</span></div>
                  </div>
                  <div className="flex flex-col gap-2 mb-5 min-h-[60px]">
                    {(p.features || []).length === 0 ? (
                      <div className="text-[12px] text-text3 italic">No features listed</div>
                    ) : p.features.map(f => (
                      <div key={f} className="flex items-center gap-2 text-[13px]">
                        <span className="text-accent">✓</span> {f}
                      </div>
                    ))}
                  </div>
                  <Btn
                    variant={popular ? 'primary' : 'secondary'}
                    className="w-full justify-center"
                    onClick={() => setEditing(p)}
                  >
                    Edit Plan
                  </Btn>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editing && (
        <EditPlanModal
          plan={editing}
          mode="edit"
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load() }}
        />
      )}

      {creating && (
        <EditPlanModal
          plan={null}
          mode="create"
          onClose={() => setCreating(false)}
          onSaved={() => { setCreating(false); load() }}
        />
      )}
    </div>
  )
}

function EditPlanModal({ plan, mode = 'edit', onClose, onSaved }) {
  // Form state mirrors Subscription schema exactly. On edit, name stays
  // read-only (plan identity). On create, name is required and editable.
  const isCreate = mode === 'create'
  const [form, setForm] = useState({
    name: plan?.name || '',
    price: plan?.price ?? 0,
    billingCycle: plan?.billingCycle || 'monthly',
    maxCorporates: plan?.maxCorporates ?? 10,
    maxStaffPerCorporate: plan?.maxStaffPerCorporate ?? 100,
    maxOrders: plan?.maxOrders ?? 500,
    featuresText: (plan?.features || []).join(', '),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }

  async function save() {
    const priceNum = Number(form.price)
    const maxCorp = Number(form.maxCorporates)
    const maxStaff = Number(form.maxStaffPerCorporate)
    const maxOrd = Number(form.maxOrders)

    if (isCreate && !form.name.trim()) { setError('Plan name is required.'); return }
    if (!Number.isFinite(priceNum) || priceNum < 0) { setError('Price must be a non-negative number.'); return }
    if (!Number.isFinite(maxCorp) || maxCorp < 0) { setError('Max Corporates must be a non-negative number.'); return }
    if (!Number.isFinite(maxStaff) || maxStaff < 0) { setError('Max Staff per Corp must be a non-negative number.'); return }
    if (!Number.isFinite(maxOrd) || maxOrd < 0) { setError('Max Orders must be a non-negative number.'); return }

    const features = form.featuresText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    setSaving(true); setError('')
    try {
      if (isCreate) {
        await apiFetch('POST', '/super-admin/subscriptions', {
          name: form.name.trim(),
          price: priceNum,
          billingCycle: form.billingCycle,
          maxCorporates: maxCorp,
          maxStaffPerCorporate: maxStaff,
          maxOrders: maxOrd,
          features,
          isActive: true,
        })
        showToast('Plan created.')
      } else {
        // Edit: the backend allowlist drops `name` and other stray keys, so this
        // only updates the catalog fields.
        await apiFetch('PUT', `/super-admin/subscriptions/${plan._id}`, {
          price: priceNum,
          billingCycle: form.billingCycle,
          maxCorporates: maxCorp,
          maxStaffPerCorporate: maxStaff,
          maxOrders: maxOrd,
          features,
        })
        showToast('Plan updated.')
      }
      onSaved()
    } catch (err) {
      setError(err.message || (isCreate ? 'Could not create plan.' : 'Could not update plan.'))
      setSaving(false)
    }
  }

  return (
    <Modal
      title={isCreate ? 'New Plan' : `Edit ${plan.name}`}
      onClose={onClose}
      actions={[
        { label: saving ? 'Saving…' : (isCreate ? 'Create Plan' : 'Save'), primary: true, onClick: save, disabled: saving },
        { label: 'Cancel', onClick: onClose },
      ]}
    >
      {error && <div className="mb-3 p-2.5 rounded border border-red-200 bg-red-50 text-red-700 text-[12px]">{error}</div>}

      <FormGroup label={isCreate ? 'Name' : 'Name (read-only)'}>
        <Input
          value={form.name}
          onChange={isCreate ? set('name') : undefined}
          disabled={!isCreate}
          placeholder={isCreate ? 'e.g. Starter, Professional, Enterprise' : undefined}
        />
      </FormGroup>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FormGroup label="Price">
          <Input type="number" value={form.price} onChange={set('price')} />
        </FormGroup>
        <FormGroup label="Billing Cycle">
          <Select value={form.billingCycle} onChange={set('billingCycle')}>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </Select>
        </FormGroup>
        <FormGroup label="Max Corporates">
          <Input type="number" value={form.maxCorporates} onChange={set('maxCorporates')} />
        </FormGroup>
        <FormGroup label="Max Staff per Corp">
          <Input type="number" value={form.maxStaffPerCorporate} onChange={set('maxStaffPerCorporate')} />
        </FormGroup>
      </div>
      <FormGroup label="Max Orders">
        <Input type="number" value={form.maxOrders} onChange={set('maxOrders')} />
      </FormGroup>
      <FormGroup label="Features (comma-separated)">
        <Input
          value={form.featuresText}
          onChange={set('featuresText')}
          placeholder="bulk_import, api_access, priority_support"
        />
      </FormGroup>
      <div className="text-[11px] text-text2 mt-1">
        Displayed as checkmarks on the plan card. Not enforced anywhere today.
      </div>
    </Modal>
  )
}

// ─── SA LOGS (platform-wide login audit) ─────────────────────────────────────
const SA_LOGS_DEBOUNCE_MS = 300

export function SAPlatformLogsPage() {
  const [filters, setFilters] = useState({ search: '', status: '', from: '', to: '' })
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const buildQuery = useCallback((f) => {
    const p = new URLSearchParams()
    if (f.search) p.set('search', f.search)
    if (f.status) p.set('status', f.status)
    if (f.from) p.set('from', f.from)
    if (f.to) p.set('to', f.to)
    const qs = p.toString()
    return qs ? `?${qs}` : ''
  }, [])

  const load = useCallback(async (f) => {
    try {
      const res = await apiFetch('GET', `/super-admin/login-logs${buildQuery(f)}`)
      setLogs(res.data?.logs || [])
    } catch (err) {
      showToast(err.message || 'Failed to load logs.', 'error')
    } finally {
      setLoading(false)
    }
  }, [buildQuery])

  // Debounced re-fetch on filter change.
  useEffect(() => {
    setLoading(true)
    const handle = setTimeout(() => load(filters), SA_LOGS_DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [filters, load])

  function onFilterChange(key, val) {
    setFilters(f => ({ ...f, [key]: val }))
  }
  function onClear() {
    setFilters({ search: '', status: '', from: '', to: '' })
  }

  async function doExport() {
    setExporting(true)
    try {
      await apiDownload(`/super-admin/login-logs/export${buildQuery(filters)}`, `platform-login-logs-${Date.now()}.xlsx`)
    } catch (err) {
      showToast(err.message || 'Export failed.', 'error')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <PageHeader title="Platform Logs" subtitle="All cross-tenant login and activity events">
        <Btn size="sm" onClick={doExport} disabled={exporting}>{exporting ? 'Exporting…' : '↓ Export'}</Btn>
      </PageHeader>
      <FilterBar
        values={filters}
        onChange={onFilterChange}
        onClear={onClear}
        fields={[
          { key: 'search', placeholder: 'Search by user, email, or IP…' },
          { key: 'status', type: 'select', placeholder: 'All', options: [{ v: 'success', l: 'Success' }, { v: 'failed', l: 'Failed' }] },
          { key: 'from', type: 'date' },
          { key: 'to', type: 'date' },
        ]}
      />
      <Card noPad>
        {loading ? <Loading /> : (
          <TableWrap>
            <thead><tr><th>User</th><th>IP Address</th><th>Device</th><th>Status</th><th>Date & Time</th></tr></thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-text2 text-sm">No records found.</td></tr>
              ) : logs.map(l => (
                <tr key={l._id}>
                  <td>
                    <div className="font-medium">{l.user?.name || l.attemptedEmail || 'Unknown'}</div>
                    <div className="text-[11px] text-text2">{l.user?.email || l.attemptedEmail || ''}</div>
                  </td>
                  <td><span className="font-mono text-[12px]">{l.ipAddress || '—'}</span></td>
                  <td className="text-text2">{l.device || '—'}</td>
                  <td>
                    {l.status === 'success'
                      ? <span className="bg-green-50 text-green-800 px-2 py-0.5 rounded-full text-[11px] font-medium">✓ Success</span>
                      : <span className="bg-red-50 text-red-800 px-2 py-0.5 rounded-full text-[11px] font-medium">✗ Failed</span>}
                  </td>
                  <td className="text-text2 font-mono text-[11px]">{formatDate(l.loggedAt || l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>
    </div>
  )
}