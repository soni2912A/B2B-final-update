// import React, { useEffect, useState, useRef, useCallback } from 'react'
// import { apiFetch, apiDownload, formatDate, formatTime } from '../../../utils/api.js'
// import { Badge, Card, PageHeader, FilterBar, TableWrap, TblAction, Btn, Loading, Modal, FormGroup, Input, Select, Textarea } from '../../ui/index.jsx'
// import { showToast } from '../../ui/index.jsx'
// import { useApp } from '../../../AppContext.jsx'

// const TEMPLATE_TYPE_OPTIONS = [
//   { value: 'order_confirm',    label: 'Order Confirmation' },
//   { value: 'order_assigned',   label: 'Order Assigned' },
//   { value: 'pre_delivery',     label: 'Pre-delivery Reminder' },
//   { value: 'delivery_confirm', label: 'Delivery Confirmation' },
//   { value: 'invoice',          label: 'Invoice' },
//   { value: 'feedback_request', label: 'Feedback Request' },
//   { value: 'welcome',          label: 'Welcome' },
//   { value: 'password_reset',   label: 'Password Reset' },
// ]
// const EMPTY_TEMPLATE_FORM = { name: '', type: 'order_confirm', subject: '', body: '' }

// export function EmailTemplatesPage() {
//   const [templates, setTemplates]   = useState([])
//   const [loading, setLoading]       = useState(true)
//   const [editing, setEditing]       = useState(null)
//   const [showForm, setShowForm]     = useState(false)
//   const [form, setForm]             = useState(EMPTY_TEMPLATE_FORM)
//   const [formError, setFormError]   = useState('')
//   const [saving, setSaving]         = useState(false)
//   const [confirmDel, setConfirmDel] = useState(null)
//   const [deleting, setDeleting]     = useState(false)

//   async function loadTemplates() {
//     try {
//       const res = await apiFetch('GET', '/admin/templates')
//       setTemplates(res.data?.templates || [])
//     } catch (err) {
//       showToast(err.message || 'Failed to load templates.', 'error')
//       setTemplates([])
//     } finally {
//       setLoading(false)
//     }
//   }
//   useEffect(() => { loadTemplates() }, [])

//   function openCreate() {
//     setEditing(null)
//     setForm(EMPTY_TEMPLATE_FORM)
//     setFormError('')
//     setShowForm(true)
//   }
//   function openEdit(t) {
//     setEditing(t)
//     setForm({
//       name: t.name || '',
//       type: t.type || 'order_confirm',
//       subject: t.subject || '',
//       body: t.body || '',
//     })
//     setFormError('')
//     setShowForm(true)
//   }
//   function closeForm() {
//     setShowForm(false)
//     setEditing(null)
//     setForm(EMPTY_TEMPLATE_FORM)
//     setFormError('')
//     setSaving(false)
//   }

//   async function submitForm() {
//     if (!form.name.trim())    { setFormError('Name is required.'); return }
//     if (!form.type)           { setFormError('Type is required.'); return }
//     if (!form.subject.trim()) { setFormError('Subject is required.'); return }
//     if (!form.body.trim())    { setFormError('Body is required.'); return }

//     const payload = {
//       name: form.name.trim(),
//       type: form.type,
//       subject: form.subject.trim(),
//       body: form.body,
//     }

//     setSaving(true)
//     setFormError('')
//     try {
//       if (editing) {
//         await apiFetch('PUT', `/admin/templates/${editing._id}`, payload)
//         showToast('Template saved.')
//       } else {
//         await apiFetch('POST', '/admin/templates', payload)
//         showToast('Template created.')
//       }
//       await loadTemplates()
//       closeForm()
//     } catch (err) {
//       setFormError(err.message || 'Could not save template.')
//       setSaving(false)
//     }
//   }

//   async function confirmDelete() {
//     if (!confirmDel) return
//     setDeleting(true)
//     try {
//       await apiFetch('DELETE', `/admin/templates/${confirmDel._id}`)
//       showToast('Template deleted.')
//       setConfirmDel(null)
//       await loadTemplates()
//     } catch (err) {
//       showToast(err.message || 'Could not delete template.', 'error')
//     } finally {
//       setDeleting(false)
//     }
//   }

//   if (loading) return <Loading />

//   return (
//     <div>
//       <PageHeader title="Email Templates" subtitle="Customize notification emails">
//         <Btn variant="primary" onClick={openCreate}>+ New Template</Btn>
//       </PageHeader>

//       <Card noPad>
//         <TableWrap>
//           <thead><tr><th>Name</th><th>Type</th><th>Subject</th><th>Updated</th><th>Actions</th></tr></thead>
//           <tbody>
//             {templates.length === 0 ? (
//               <tr><td colSpan={5} className="text-center py-10 text-text2 text-sm">No records found.</td></tr>
//             ) : templates.map(t => (
//               <tr key={t._id}>
//                 <td data-label="Name" className="font-medium">{t.name}</td>
//                 <td data-label="Type"><Badge status={t.type} /></td>
//                 <td data-label="Subject" className="text-text2 md:max-w-[380px] md:truncate">{t.subject}</td>
//                 <td data-label="Updated">{formatDate(t.updatedAt)}</td>
//                 <td data-label="Actions">
//                   <div className="flex gap-1.5 flex-wrap">
//                     <TblAction onClick={() => openEdit(t)}>Edit</TblAction>
//                     <TblAction onClick={() => setConfirmDel(t)}>Delete</TblAction>
//                   </div>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </TableWrap>
//       </Card>

//       {showForm && (
//         <Modal
//           title={editing ? 'Edit Template' : 'Email Template'}
//           onClose={closeForm}
//           size="lg"
//           actions={[
//             { label: saving ? 'Saving…' : 'Save', primary: true, onClick: submitForm, disabled: saving },
//             { label: 'Cancel', onClick: closeForm },
//           ]}
//         >
//           {formError && (
//             <div className="mb-3 p-2.5 rounded border border-red-200 bg-red-50 text-red-700 text-[12px]">{formError}</div>
//           )}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//             <FormGroup label="Template Name">
//               <Input placeholder="e.g. Order Confirmation" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
//             </FormGroup>
//             <FormGroup label="Type">
//               <Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
//                 {TEMPLATE_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
//               </Select>
//             </FormGroup>
//           </div>
//           <FormGroup label="Subject">
//             <Input placeholder="Your order {{orderNumber}} is confirmed" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
//           </FormGroup>
//           <FormGroup label="Body (HTML)">
//             <textarea
//               className="w-full px-3 py-2 border border-border2 rounded bg-surface text-text1 text-[12px] font-mono outline-none focus:border-accent resize-y min-h-[160px] max-h-[50vh]"
//               placeholder="<p>Dear {{name}},</p>…"
//               value={form.body}
//               onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
//             />
//           </FormGroup>
//           <div className="text-[11px] text-text2">Placeholders: {'{{name}}'}, {'{{orderNumber}}'}, {'{{date}}'}, {'{{invoiceNumber}}'}</div>
//         </Modal>
//       )}

//       {confirmDel && (
//         <Modal
//           title="Delete Template"
//           onClose={() => !deleting && setConfirmDel(null)}
//           actions={[
//             { label: deleting ? 'Deleting…' : 'Delete', primary: true, onClick: confirmDelete, disabled: deleting },
//             { label: 'Cancel', onClick: () => setConfirmDel(null) },
//           ]}
//         >
//           <div className="text-[13px] text-text1">
//             Delete template <span className="font-semibold">{confirmDel.name}</span>? This cannot be undone.
//           </div>
//         </Modal>
//       )}
//     </div>
//   )
// }

// const LOGS_POLL_MS = 30000
// const LOGS_DEBOUNCE_MS = 300

// export function LoginLogsPage() {
//   const [filters, setFilters] = useState({ search: '', status: '', from: '', to: '' })
//   const [logs, setLogs]       = useState([])
//   const [loading, setLoading] = useState(true)
//   const [exporting, setExporting] = useState(false)
//   const isTypingRef = useRef(false)

//   const buildQuery = useCallback((f) => {
//     const p = new URLSearchParams()
//     if (f.search) p.set('search', f.search)
//     if (f.status) p.set('status', f.status)
//     if (f.from)   p.set('from', f.from)
//     if (f.to)     p.set('to', f.to)
//     const qs = p.toString()
//     return qs ? `?${qs}` : ''
//   }, [])

//   const load = useCallback(async (f = filters) => {
//     try {
//       const res = await apiFetch('GET', `/admin/login-logs${buildQuery(f)}`)
//       setLogs(res.data?.logs || [])
//     } catch (err) {
//       showToast(err.message || 'Failed to load logs.', 'error')
//     } finally {
//       setLoading(false)
//     }
//   }, [filters, buildQuery])

//   useEffect(() => {
//     isTypingRef.current = true
//     setLoading(true)
//     const handle = setTimeout(() => {
//       isTypingRef.current = false
//       load(filters)
//     }, LOGS_DEBOUNCE_MS)
//     return () => clearTimeout(handle)
//   }, [filters])

//   useEffect(() => {
//     const interval = setInterval(() => {
//       if (document.visibilityState !== 'visible') return
//       if (isTypingRef.current) return
//       load(filters)
//     }, LOGS_POLL_MS)
//     return () => clearInterval(interval)
//   }, [filters])

//   function onFilterChange(key, val) {
//     setFilters(f => ({ ...f, [key]: val }))
//   }
//   function onClear() {
//     setFilters({ search: '', status: '', from: '', to: '' })
//   }

//   async function doExport() {
//     setExporting(true)
//     try {
//       await apiDownload(`/admin/login-logs/export${buildQuery(filters)}`, `login-logs-${Date.now()}.xlsx`)
//     } catch (err) {
//       showToast(err.message || 'Export failed.', 'error')
//     } finally {
//       setExporting(false)
//     }
//   }

//   return (
//     <div>
//       <PageHeader title="Login & Activity Logs" subtitle="Audit trail of all login attempts">
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
//                   <td data-label="User">
//                     <div className="font-medium">{l.user?.name || l.attemptedEmail || 'Unknown'}</div>
//                     <div className="text-[11px] text-text2 break-all">{l.user?.email || l.attemptedEmail || ''}</div>
//                   </td>
//                   <td data-label="IP Address"><span className="font-mono text-[12px]">{l.ipAddress || '—'}</span></td>
//                   <td data-label="Device" className="text-text2">{l.device || '—'}</td>
//                   <td data-label="Status">
//                     {l.status === 'success'
//                       ? <span className="bg-green-50 text-green-800 px-2 py-0.5 rounded-full text-[11px] font-medium">✓ Success</span>
//                       : <span className="bg-red-50 text-red-800 px-2 py-0.5 rounded-full text-[11px] font-medium">✗ Failed</span>}
//                   </td>
//                   <td data-label="Date & Time" className="text-text2">{formatDate(l.loggedAt || l.createdAt)} {formatTime(l.loggedAt || l.createdAt)}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </TableWrap>
//         )}
//       </Card>
//     </div>
//   )
// }

// const EMAIL_LOG_STATUS_OPTIONS = [
//   { v: 'sent',    l: 'Sent' },
//   { v: 'failed',  l: 'Failed' },
//   { v: 'bounced', l: 'Bounced' },
//   { v: 'pending', l: 'Pending' },
//   { v: 'skipped', l: 'Skipped (dev)' },
// ]
// const EMAIL_LOG_DEBOUNCE_MS = 300

// export function EmailLogsPage() {
//   const [filters, setFilters] = useState({ search: '', status: '', from: '', to: '' })
//   const [logs, setLogs]       = useState([])
//   const [loading, setLoading] = useState(true)
//   const [confirmResend, setConfirmResend] = useState(null)
//   const [resending, setResending]         = useState(false)
//   const isTypingRef = useRef(false)

//   const buildQuery = useCallback((f) => {
//     const p = new URLSearchParams()
//     if (f.search) p.set('search', f.search)
//     if (f.status) p.set('status', f.status)
//     if (f.from)   p.set('from', f.from)
//     if (f.to)     p.set('to', f.to)
//     const qs = p.toString()
//     return qs ? `?${qs}` : ''
//   }, [])

//   const load = useCallback(async (f = filters) => {
//     try {
//       const res = await apiFetch('GET', `/admin/email-logs${buildQuery(f)}`)
//       setLogs(res.data?.logs || [])
//     } catch (err) {
//       showToast(err.message || 'Failed to load email logs.', 'error')
//     } finally {
//       setLoading(false)
//     }
//   }, [filters, buildQuery])

//   useEffect(() => {
//     isTypingRef.current = true
//     setLoading(true)
//     const handle = setTimeout(() => {
//       isTypingRef.current = false
//       load(filters)
//     }, EMAIL_LOG_DEBOUNCE_MS)
//     return () => clearTimeout(handle)
//   }, [filters])

//   function onFilterChange(key, val) {
//     setFilters(f => ({ ...f, [key]: val }))
//   }
//   function onClear() {
//     setFilters({ search: '', status: '', from: '', to: '' })
//   }

//   async function doResend() {
//     if (!confirmResend) return
//     setResending(true)
//     try {
//       await apiFetch('POST', `/admin/email-logs/${confirmResend._id}/resend`)
//       showToast('Email resent.')
//       setConfirmResend(null)
//       await load(filters)
//     } catch (err) {
//       showToast(err.message || 'Could not resend.', 'error')
//     } finally {
//       setResending(false)
//     }
//   }

//   return (
//     <div>
//       <PageHeader title="Email Logs" subtitle="Track all outgoing email communications" />
//       <FilterBar
//         values={filters}
//         onChange={onFilterChange}
//         onClear={onClear}
//         fields={[
//           { key: 'search', placeholder: 'Search recipient or subject…' },
//           { key: 'status', type: 'select', placeholder: 'All', options: EMAIL_LOG_STATUS_OPTIONS },
//           { key: 'from',   type: 'date' },
//           { key: 'to',     type: 'date' },
//         ]}
//       />
//       <Card noPad>
//         {loading ? <Loading /> : (
//           <TableWrap>
//             <thead>
//               <tr><th>To</th><th>Subject</th><th>Type</th><th>Status</th><th>Attempts</th><th>Sent At</th><th>Actions</th></tr>
//             </thead>
//             <tbody>
//               {logs.length === 0 ? (
//                 <tr><td colSpan={7} className="text-center py-10 text-text2 text-sm">No records found.</td></tr>
//               ) : logs.map(l => {
//                 const isFailed = l.status === 'failed' || l.status === 'bounced'
//                 const canResend = isFailed || l.status === 'skipped' || l.status === 'sent'
//                 return (
//                   <tr key={l._id}>
//                     <td data-label="To" className="text-text2 break-all">{l.to}</td>
//                     <td data-label="Subject" className="md:max-w-[340px]">
//                       <div className="md:truncate">{l.subject}</div>
//                       {isFailed && l.errorMessage && (
//                         <div
//                           className="text-[11px] text-red-600 mt-0.5 md:truncate"
//                           title={l.errorMessage}
//                         >
//                           ⨯ {l.errorMessage}
//                         </div>
//                       )}
//                     </td>
//                     <td data-label="Type" className="text-text2 text-[11px]">{l.templateType || '—'}</td>
//                     <td data-label="Status"><Badge status={l.status} /></td>
//                     <td data-label="Attempts" className="text-text2 text-[12px]">{l.attempts || 1}</td>
//                     <td data-label="Sent At" className="text-text2">{formatDate(l.sentAt || l.createdAt)} {formatTime(l.sentAt || l.createdAt)}</td>
//                     <td data-label="Actions">
//                       {canResend && (
//                         <TblAction onClick={() => setConfirmResend(l)}>
//                           {isFailed ? '↻ Retry' : 'Resend'}
//                         </TblAction>
//                       )}
//                     </td>
//                   </tr>
//                 )
//               })}
//             </tbody>
//           </TableWrap>
//         )}
//       </Card>

//       {confirmResend && (
//         <Modal
//           title="Resend Email"
//           onClose={() => !resending && setConfirmResend(null)}
//           actions={[
//             { label: resending ? 'Resending…' : 'Resend', primary: true, onClick: doResend, disabled: resending },
//             { label: 'Cancel', onClick: () => setConfirmResend(null) },
//           ]}
//         >
//           <div className="text-[13px] text-text1">
//             Resend <span className="font-semibold">{confirmResend.subject}</span> to <span className="font-mono">{confirmResend.to}</span>?
//           </div>
//           <div className="text-[11px] text-text2 mt-2">
//             A new email log row will be created for this attempt — the original row is preserved.
//           </div>
//         </Modal>
//       )}
//     </div>
//   )
// }

// const FORMAT_EXT = { Excel: 'xlsx', CSV: 'csv', PDF: 'pdf' }

// const IMPORT_ENTITIES = [
//   { label: 'Staff Members', icon: '👥', path: '/admin/staff',      filenameRoot: 'staff' },
//   { label: 'Products',      icon: '📦', path: '/admin/products',   filenameRoot: 'products' },
//   { label: 'Corporates',    icon: '🏢', path: '/admin/corporates', filenameRoot: 'corporates' },
// ]

// const EXPORT_ENTITIES = [
//   { label: 'Orders',        icon: '📋', path: '/admin/orders',     filenameRoot: 'orders',        formats: ['Excel', 'CSV', 'PDF'] },
//   { label: 'Invoices',      icon: '💳', path: '/admin/invoices',   filenameRoot: 'invoices',      formats: ['Excel', 'PDF'] },
//   { label: 'Staff',         icon: '👥', path: '/admin/staff',      filenameRoot: 'staff',         formats: ['Excel', 'CSV'] },
//   { label: 'Products',      icon: '📦', path: '/admin/products',   filenameRoot: 'products',      formats: ['Excel', 'CSV'] },
//   { label: 'Activity Logs', icon: '🔍', path: '/admin/login-logs', filenameRoot: 'activity-logs', formats: ['Excel', 'CSV'] },
// ]

// export function ImportExportPage() {
//   const [busy, setBusy]             = useState({})      // { [key]: true } while downloading/uploading
//   const [pendingFile, setPendingFile] = useState(null)  // { entity, file }
//   const [errorModal, setErrorModal] = useState(null)    // { entity, errors[] }
//   const fileInputRef                = useRef(null)
//   const currentEntityRef            = useRef(null)

//   function setBusyKey(key, v) {
//     setBusy(b => ({ ...b, [key]: v }))
//   }

//   async function doExport(entity, formatLabel) {
//     const fmt = FORMAT_EXT[formatLabel]
//     const key = `export:${entity.label}:${fmt}`
//     setBusyKey(key, true)
//     try {
//       await apiDownload(`${entity.path}/export?format=${fmt}`, `${entity.filenameRoot}-${Date.now()}.${fmt}`)
//     } catch (err) {
//       showToast(err.message || 'Export failed.', 'error')
//     } finally {
//       setBusyKey(key, false)
//     }
//   }

//   async function doTemplate(entity) {
//     const key = `template:${entity.label}`
//     setBusyKey(key, true)
//     try {
//       await apiDownload(`${entity.path}/import/template`, `${entity.filenameRoot}-template.xlsx`)
//     } catch (err) {
//       showToast(err.message || 'Template download failed.', 'error')
//     } finally {
//       setBusyKey(key, false)
//     }
//   }

//   function triggerPick(entity) {
//     currentEntityRef.current = entity
//     if (fileInputRef.current) {
//       fileInputRef.current.value = ''     // allow re-uploading same filename
//       fileInputRef.current.click()
//     }
//   }

//   function onFileSelected(e) {
//     const file = e.target.files && e.target.files[0]
//     const entity = currentEntityRef.current
//     if (!file || !entity) return
//     if (file.size > 5 * 1024 * 1024) {
//       showToast('File exceeds 5MB limit.', 'error')
//       return
//     }
//     setPendingFile({ entity, file })
//   }

//   async function confirmUpload() {
//     if (!pendingFile) return
//     const { entity, file } = pendingFile
//     const key = `upload:${entity.label}`
//     setBusyKey(key, true)
//     try {
//       const form = new FormData()
//       form.append('file', file)
//       const res = await apiFetch('POST', `${entity.path}/import`, form, true)
//       showToast(res?.message || `Imported ${res?.data?.imported ?? ''} record(s).`)
//       setPendingFile(null)
//     } catch (err) {
//       if (err.status === 413) {
//         showToast(err.message, 'error')
//       } else if (Array.isArray(err.errors) && err.errors.length > 0) {
//         setErrorModal({ entity, errors: err.errors })
//       } else {
//         showToast(err.message || 'Import failed.', 'error')
//       }
//       setPendingFile(null)
//     } finally {
//       setBusyKey(key, false)
//     }
//   }

//   return (
//     <div>
//       <PageHeader title="Data Import & Export" subtitle="Bulk data operations" />

//       <input
//         ref={fileInputRef}
//         type="file"
//         accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//         onChange={onFileSelected}
//         className="hidden"
//       />

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
//         {}
//         <Card>
//           <div className="text-[14px] font-medium mb-1">Import Data</div>
//           <p className="text-xs text-text2 mb-4">Upload CSV or Excel files to bulk-add records</p>
//           {IMPORT_ENTITIES.map(entity => (
//             <div
//               key={entity.label}
//               className="border border-border rounded p-3 mb-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
//             >
//               <div className="flex items-center gap-2.5 min-w-0">
//                 <span className="text-xl flex-shrink-0">{entity.icon}</span>
//                 <div className="min-w-0">
//                   <div className="font-medium text-[13px] truncate">{entity.label}</div>
//                   <div className="text-[11px] text-text2">CSV or XLSX · max 5MB</div>
//                 </div>
//               </div>
//               <div className="flex flex-wrap gap-2">
//                 <Btn size="sm" onClick={() => doTemplate(entity)} disabled={busy[`template:${entity.label}`]}>
//                   {busy[`template:${entity.label}`] ? '…' : '↓ Template'}
//                 </Btn>
//                 <Btn size="sm" variant="primary" onClick={() => triggerPick(entity)} disabled={busy[`upload:${entity.label}`]}>
//                   {busy[`upload:${entity.label}`] ? 'Uploading…' : '↑ Upload'}
//                 </Btn>
//               </div>
//             </div>
//           ))}
//         </Card>

//         {}
//         <Card>
//           <div className="text-[14px] font-medium mb-1">Export Data</div>
//           <p className="text-xs text-text2 mb-4">Download your data in various formats</p>
//           {EXPORT_ENTITIES.map(entity => (
//             <div
//               key={entity.label}
//               className="border border-border rounded p-3 mb-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
//             >
//               <div className="flex items-center gap-2.5 min-w-0">
//                 <span className="text-xl flex-shrink-0">{entity.icon}</span>
//                 <div className="font-medium text-[13px] truncate">{entity.label}</div>
//               </div>
//               <div className="flex flex-wrap gap-1.5">
//                 {entity.formats.map(f => {
//                   const key = `export:${entity.label}:${FORMAT_EXT[f]}`
//                   return (
//                     <Btn key={f} size="sm" onClick={() => doExport(entity, f)} disabled={busy[key]}>
//                       {busy[key] ? '…' : `↓ ${f}`}
//                     </Btn>
//                   )
//                 })}
//               </div>
//             </div>
//           ))}
//         </Card>
//       </div>

//       {}
//       {pendingFile && (
//         <Modal
//           title="Confirm Import"
//           onClose={() => setPendingFile(null)}
//           actions={[
//             { label: busy[`upload:${pendingFile.entity.label}`] ? 'Uploading…' : 'Import', primary: true, onClick: confirmUpload, disabled: busy[`upload:${pendingFile.entity.label}`] },
//             { label: 'Cancel', onClick: () => setPendingFile(null) },
//           ]}
//         >
//           <div className="text-[13px] text-text1">
//             Upload <span className="font-semibold">{pendingFile.file.name}</span> as <span className="font-semibold">{pendingFile.entity.label}</span>?
//           </div>
//           <div className="text-[12px] text-text2 mt-2">
//             Existing records will not be affected. Duplicate rows will be rejected.
//           </div>
//         </Modal>
//       )}

//       {}
//       {errorModal && (
//         <Modal
//           title={`${errorModal.entity.label} — Import Failed`}
//           onClose={() => setErrorModal(null)}
//           actions={[{ label: 'Close', onClick: () => setErrorModal(null) }]}
//         >
//           <div className="text-[12px] text-text2 mb-3">No rows were imported. Fix the issues below and retry.</div>
//           <div className="max-h-[280px] overflow-y-auto border border-border rounded">
//             <table className="w-full text-[12px]">
//               <thead className="bg-surface2 sticky top-0">
//                 <tr><th className="text-left px-2 py-1.5">Row</th><th className="text-left px-2 py-1.5">Field</th><th className="text-left px-2 py-1.5">Error</th></tr>
//               </thead>
//               <tbody>
//                 {errorModal.errors.slice(0, 10).map((e, i) => (
//                   <tr key={i} className="border-t border-border">
//                     <td className="px-2 py-1.5 font-mono">{e.row}</td>
//                     <td className="px-2 py-1.5 font-mono">{e.field}</td>
//                     <td className="px-2 py-1.5 text-red-700">{e.error}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//           {errorModal.errors.length > 10 && (
//             <div className="text-[11px] text-text3 mt-2">… and {errorModal.errors.length - 10} more.</div>
//           )}
//         </Modal>
//       )}
//     </div>
//   )
// }

// const EMPTY_INVITE = { email: '', name: '', role: 'staff', roleId: '' }
// const EMPTY_EDIT   = { name: '', role: 'staff', roleId: '' }

// function userStatus(u) {
//   if (u.isActive) return { key: 'active',  label: 'Active',         tone: 'active' }
//   if (u.inviteToken || (u.inviteExpire && new Date(u.inviteExpire) > new Date())) {
//     return { key: 'pending', label: 'Pending Invite', tone: 'pending' }
//   }
//   return { key: 'inactive', label: 'Deactivated', tone: 'inactive' }
// }

// export function AdminUsersPage() {
//   const { user: currentUser } = useApp()
//   const [users, setUsers]     = useState([])
//   const [roles, setRoles]     = useState([])
//   const [loading, setLoading] = useState(true)

//   const [showInvite, setShowInvite] = useState(false)
//   const [inviteForm, setInviteForm] = useState(EMPTY_INVITE)
//   const [inviteError, setInviteError] = useState('')
//   const [inviting, setInviting]     = useState(false)

//   const [editing, setEditing]       = useState(null)   // user being edited (or null)
//   const [editForm, setEditForm]     = useState(EMPTY_EDIT)
//   const [editError, setEditError]   = useState('')
//   const [savingEdit, setSavingEdit] = useState(false)

//   const [confirmReset, setConfirmReset] = useState(null)
//   const [resettingPw, setResettingPw]   = useState(false)
//   const [confirmToggle, setConfirmToggle] = useState(null)
//   const [toggling, setToggling]           = useState(false)

//   async function load() {
//     try {
//       const [u, r] = await Promise.all([
//         apiFetch('GET', '/admin/users'),
//         apiFetch('GET', '/admin/roles').catch(() => ({ data: { roles: [] } })),
//       ])
//       setUsers(u.data?.users || [])
//       setRoles(r.data?.roles || [])
//     } catch (err) {
//       showToast(err.message || 'Failed to load users.', 'error')
//     } finally {
//       setLoading(false)
//     }
//   }
//   useEffect(() => { load() }, [])

//   function openInvite() {
//     setInviteForm(EMPTY_INVITE); setInviteError(''); setShowInvite(true)
//   }
//   function closeInvite() {
//     setShowInvite(false); setInviteForm(EMPTY_INVITE); setInviteError(''); setInviting(false)
//   }
//   async function submitInvite() {
//     if (!inviteForm.email.trim()) { setInviteError('Email is required.'); return }
//     if (!inviteForm.name.trim())  { setInviteError('Name is required.'); return }
//     setInviting(true); setInviteError('')
//     try {
//       await apiFetch('POST', '/admin/users/invite', {
//         email: inviteForm.email.trim(),
//         name: inviteForm.name.trim(),
//         role: inviteForm.role,
//         roleId: inviteForm.roleId || undefined,
//       })
//       showToast('Invitation sent. In dev, copy the link from the backend terminal.')
//       await load()
//       closeInvite()
//     } catch (err) {
//       setInviteError(err.message || 'Could not send invitation.')
//       setInviting(false)
//     }
//   }

//   function openEdit(u) {
//     setEditing(u); setEditForm({ name: u.name || '', role: u.role || 'staff', roleId: '' }); setEditError('')
//   }
//   function closeEdit() {
//     setEditing(null); setEditForm(EMPTY_EDIT); setEditError(''); setSavingEdit(false)
//   }
//   async function submitEdit() {
//     if (!editForm.name.trim()) { setEditError('Name is required.'); return }
//     setSavingEdit(true); setEditError('')
//     try {
//       await apiFetch('PUT', `/admin/users/${editing._id}`, {
//         name: editForm.name.trim(),
//         role: editForm.role,
//         roleId: editForm.roleId || undefined,
//       })
//       showToast('User updated.')
//       await load()
//       closeEdit()
//     } catch (err) {
//       setEditError(err.message || 'Could not save changes.')
//       setSavingEdit(false)
//     }
//   }

//   async function doResetPassword() {
//     if (!confirmReset) return
//     setResettingPw(true)
//     try {
//       await apiFetch('PATCH', `/admin/users/${confirmReset._id}/reset-password`)
//       showToast('Password reset email sent.')
//       setConfirmReset(null)
//     } catch (err) {
//       showToast(err.message || 'Could not send reset email.', 'error')
//     } finally {
//       setResettingPw(false)
//     }
//   }

//   async function doToggleStatus() {
//     if (!confirmToggle) return
//     setToggling(true)
//     try {
//       await apiFetch('PATCH', `/admin/users/${confirmToggle._id}/toggle-status`)
//       showToast(`User ${confirmToggle.isActive ? 'deactivated' : 'activated'}.`)
//       await load()
//       setConfirmToggle(null)
//     } catch (err) {
//       showToast(err.message || 'Could not update status.', 'error')
//     } finally {
//       setToggling(false)
//     }
//   }

//   const isSelf = (u) => String(u._id) === String(currentUser?._id)

//   return (
//     <div>
//       <PageHeader title="Admin Users" subtitle="Manage team members and access">
//         <Btn variant="primary" onClick={openInvite}>+ Invite User</Btn>
//       </PageHeader>
//       <Card noPad>
//         {loading ? <Loading /> : (
//           <TableWrap>
//             <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Last Login</th><th>Actions</th></tr></thead>
//             <tbody>
//               {users.length === 0 ? (
//                 <tr><td colSpan={5} className="text-center py-10 text-text2 text-sm">No records found.</td></tr>
//               ) : users.map(u => {
//                 const status = userStatus(u)
//                 const pendingInvite = status.key === 'pending'
//                 const self = isSelf(u)
//                 return (
//                   <tr key={u._id}>
//                     <td data-label="User">
//                       <div className="flex items-center gap-2">
//                         <div className="w-7 h-7 rounded-full bg-accent-light flex items-center justify-center text-[10px] font-semibold text-accent">
//                           {(u.name||'?').split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase()}
//                         </div>
//                         <div>
//                           <div className="font-medium">{u.name}{self && <span className="ml-1.5 text-[11px] text-text3">(you)</span>}</div>
//                           <div className="text-[11px] text-text2 break-all">{u.email}</div>
//                         </div>
//                       </div>
//                     </td>
//                     <td data-label="Role"><Badge status={u.role} /></td>
//                     <td data-label="Status"><Badge status={status.tone} />{status.key === 'pending' && <span className="ml-1 text-[11px] text-text2">Pending Invite</span>}</td>
//                     <td data-label="Last Login" className="text-text2">{u.lastLogin ? formatDate(u.lastLogin) : '—'}</td>
//                     <td data-label="Actions">
//                       <div className="flex gap-1.5 flex-wrap">
//                         <TblAction onClick={() => openEdit(u)}>Edit</TblAction>
//                         <TblAction onClick={() => setConfirmReset(u)} disabled={pendingInvite}>Reset PW</TblAction>
//                         <TblAction onClick={() => setConfirmToggle(u)} disabled={self}>
//                           {u.isActive ? 'Deactivate' : 'Activate'}
//                         </TblAction>
//                       </div>
//                     </td>
//                   </tr>
//                 )
//               })}
//             </tbody>
//           </TableWrap>
//         )}
//       </Card>

//       {}
//       {showInvite && (
//         <Modal
//           title="Invite Team Member"
//           onClose={closeInvite}
//           actions={[
//             { label: inviting ? 'Sending…' : 'Send Invitation', primary: true, onClick: submitInvite, disabled: inviting },
//             { label: 'Cancel', onClick: closeInvite },
//           ]}
//         >
//           {inviteError && <div className="mb-3 p-2.5 rounded border border-red-200 bg-red-50 text-red-700 text-[12px]">{inviteError}</div>}
//           <FormGroup label="Email Address">
//             <Input type="email" placeholder="colleague@company.com" value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))} />
//           </FormGroup>
//           <FormGroup label="Name">
//             <Input placeholder="Full name" value={inviteForm.name} onChange={e => setInviteForm(f => ({ ...f, name: e.target.value }))} />
//           </FormGroup>
//           <FormGroup label="Role">
//             <Select value={inviteForm.role} onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))}>
//               <option value="staff">Staff</option>
//             </Select>
//           </FormGroup>
//           <FormGroup label="Access Role (optional)" hint="Assigns a preset of module/action permissions. Leave blank to use baseline role access.">
//             <Select value={inviteForm.roleId} onChange={e => setInviteForm(f => ({ ...f, roleId: e.target.value }))}>
//               <option value="">— No preset —</option>
//               {roles.map(r => (
//                 <option key={r._id} value={r._id}>
//                   {r.name} ({r.scope}) — {(r.permissions || []).length} perms
//                 </option>
//               ))}
//             </Select>
//           </FormGroup>
//           <div className="text-[11px] text-text2 mt-1">
//             The invitee will receive an email with a link to set their password. Link expires in 48 hours.
//           </div>
//         </Modal>
//       )}

//       {}
//       {editing && (
//         <Modal
//           title={`Edit ${editing.name || 'User'}`}
//           onClose={closeEdit}
//           actions={[
//             { label: savingEdit ? 'Saving…' : 'Save', primary: true, onClick: submitEdit, disabled: savingEdit },
//             { label: 'Cancel', onClick: closeEdit },
//           ]}
//         >
//           {editError && <div className="mb-3 p-2.5 rounded border border-red-200 bg-red-50 text-red-700 text-[12px]">{editError}</div>}
//           <FormGroup label="Email (read-only)">
//             <Input type="email" value={editing.email || ''} disabled />
//           </FormGroup>
//           <FormGroup label="Name">
//             <Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
//           </FormGroup>
//           <FormGroup label="Role">
//             <Select value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}>
//               <option value="staff">Staff</option>
//             </Select>
//           </FormGroup>
//           <FormGroup label="Access Role (optional)" hint="Selecting a role will replace this user's current permissions with the role's preset.">
//             <Select value={editForm.roleId} onChange={e => setEditForm(f => ({ ...f, roleId: e.target.value }))}>
//               <option value="">— Keep current permissions —</option>
//               {roles.map(r => (
//                 <option key={r._id} value={r._id}>
//                   {r.name} ({r.scope}) — {(r.permissions || []).length} perms
//                 </option>
//               ))}
//             </Select>
//           </FormGroup>
//         </Modal>
//       )}

//       {}
//       {confirmReset && (
//         <Modal
//           title="Send Password Reset Email"
//           onClose={() => !resettingPw && setConfirmReset(null)}
//           actions={[
//             { label: resettingPw ? 'Sending…' : 'Send Reset Email', primary: true, onClick: doResetPassword, disabled: resettingPw },
//             { label: 'Cancel', onClick: () => setConfirmReset(null) },
//           ]}
//         >
//           <div className="text-[13px]">
//             Send a password-reset email to <span className="font-semibold">{confirmReset.email}</span>? They'll receive a link to choose a new password. The link expires in 1 hour.
//           </div>
//         </Modal>
//       )}

//       {}
//       {confirmToggle && (
//         <Modal
//           title={confirmToggle.isActive ? 'Deactivate User' : 'Activate User'}
//           onClose={() => !toggling && setConfirmToggle(null)}
//           actions={[
//             { label: toggling ? 'Saving…' : (confirmToggle.isActive ? 'Deactivate' : 'Activate'), primary: true, onClick: doToggleStatus, disabled: toggling },
//             { label: 'Cancel', onClick: () => setConfirmToggle(null) },
//           ]}
//         >
//           <div className="text-[13px]">
//             {confirmToggle.isActive
//               ? <>Deactivate <span className="font-semibold">{confirmToggle.name}</span>? They won't be able to log in until reactivated.</>
//               : <>Activate <span className="font-semibold">{confirmToggle.name}</span>? They'll regain access immediately.</>}
//           </div>
//         </Modal>
//       )}
//     </div>
//   )
// }

// const CURRENCY_OPTIONS = [
//   { value: 'USD', label: 'USD ($)' },
//   { value: 'EUR', label: 'EUR (€)' },
//   { value: 'GBP', label: 'GBP (£)' },
//   { value: 'INR', label: 'INR (₹)' },
// ]
// const TIMEZONE_OPTIONS = [
//   'UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Kolkata', 'Asia/Singapore',
// ]
// const DATE_FORMAT_OPTIONS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']

// function addressToString(a) {
//   if (!a) return ''
//   return [a.street, a.city, a.state, a.pincode, a.country].filter(Boolean).join(', ')
// }
// function stringToAddress(s) {
//   const parts = String(s || '').split(',').map(p => p.trim())
//   const [street, city, state, pincode, country] = [
//     parts.slice(0, parts.length - 4).join(', '),
//     parts[parts.length - 4],
//     parts[parts.length - 3],
//     parts[parts.length - 2],
//     parts[parts.length - 1],
//   ]
//   return {
//     street: street || '',
//     city: city || '',
//     state: state || '',
//     pincode: pincode || '',
//     country: country || 'India',
//   }
// }

// export function SettingsPage() {
//   const [biz, setBiz]               = useState(null)
//   const [loading, setLoading]       = useState(true)
//   const [info, setInfo]             = useState({ name: '', email: '', phone: '', addressText: '' })
//   const [defaults, setDefaults]     = useState({ currency: 'INR', timezone: 'Asia/Kolkata', dateFormat: 'DD/MM/YYYY' })
//   const [savingInfo, setSavingInfo] = useState(false)
//   const [savingDefaults, setSavingDefaults] = useState(false)
//   const [uploading, setUploading]   = useState(false)
//   const [infoError, setInfoError]   = useState('')
//   const [defaultsError, setDefaultsError] = useState('')
//   const logoInputRef                = useRef(null)

//   async function load() {
//     try {
//       const res = await apiFetch('GET', '/admin/business')
//       const b = res.data?.business || {}
//       setBiz(b)
//       setInfo({
//         name: b.name || '',
//         email: b.email || '',
//         phone: b.phone || '',
//         addressText: addressToString(b.address),
//       })
//       setDefaults({
//         currency: b.currency || 'INR',
//         timezone: b.timezone || 'Asia/Kolkata',
//         dateFormat: b.dateFormat || 'DD/MM/YYYY',
//       })
//     } catch (err) {
//       showToast(err.message || 'Failed to load settings.', 'error')
//     } finally {
//       setLoading(false)
//     }
//   }
//   useEffect(() => { load() }, [])

//   async function saveInfo() {
//     if (!info.name.trim())  { setInfoError('Business name is required.'); return }
//     if (!info.email.trim()) { setInfoError('Email is required.'); return }
//     setSavingInfo(true); setInfoError('')
//     try {
//       const res = await apiFetch('PATCH', '/admin/business', {
//         name: info.name.trim(),
//         email: info.email.trim(),
//         phone: info.phone.trim(),
//         address: stringToAddress(info.addressText),
//       })
//       setBiz(res.data?.business || biz)
//       showToast('Business information saved.')
//     } catch (err) {
//       setInfoError(err.message || 'Could not save.')
//     } finally {
//       setSavingInfo(false)
//     }
//   }

//   async function saveDefaults() {
//     setSavingDefaults(true); setDefaultsError('')
//     try {
//       const res = await apiFetch('PATCH', '/admin/business', {
//         currency: defaults.currency,
//         timezone: defaults.timezone,
//         dateFormat: defaults.dateFormat,
//       })
//       setBiz(res.data?.business || biz)
//       showToast('Preferences saved.')
//     } catch (err) {
//       setDefaultsError(err.message || 'Could not save.')
//     } finally {
//       setSavingDefaults(false)
//     }
//   }

//   function triggerLogoPick() {
//     if (logoInputRef.current) {
//       logoInputRef.current.value = ''
//       logoInputRef.current.click()
//     }
//   }

//   async function onLogoSelected(e) {
//     const file = e.target.files && e.target.files[0]
//     if (!file) return
//     if (file.size > 2 * 1024 * 1024) {
//       showToast('File must be under 2MB.', 'error')
//       return
//     }
//     if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type)) {
//       showToast('Only PNG, JPEG, WEBP, or SVG allowed.', 'error')
//       return
//     }
//     setUploading(true)
//     try {
//       const form = new FormData()
//       form.append('logo', file)
//       const res = await apiFetch('POST', '/admin/business/logo', form, true)
//       const logo = res.data?.logo
//       if (logo) setBiz(b => ({ ...(b || {}), logo }))
//       showToast('Logo uploaded.')
//     } catch (err) {
//       showToast(err.message || 'Upload failed.', 'error')
//     } finally {
//       setUploading(false)
//     }
//   }

//   if (loading) return <Loading />

//   const logoSrc = biz?.logo ? `${biz.logo}?v=${(biz.updatedAt ? new Date(biz.updatedAt).getTime() : Date.now())}` : null

//   return (
//     <div>
//       <PageHeader title="System Configuration" />

//       <input
//         ref={logoInputRef}
//         type="file"
//         accept="image/png,image/jpeg,image/webp,image/svg+xml"
//         onChange={onLogoSelected}
//         className="hidden"
//       />

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
//         <Card>
//           <div className="text-[14px] font-medium mb-4">Business Information</div>
//           {infoError && <div className="mb-3 p-2.5 rounded border border-red-200 bg-red-50 text-red-700 text-[12px]">{infoError}</div>}
//           <FormGroup label="Business Name">
//             <Input value={info.name} onChange={e => setInfo(i => ({ ...i, name: e.target.value }))} />
//           </FormGroup>
//           <FormGroup label="Email">
//             <Input type="email" value={info.email} onChange={e => setInfo(i => ({ ...i, email: e.target.value }))} />
//           </FormGroup>
//           <FormGroup label="Phone">
//             <Input value={info.phone} onChange={e => setInfo(i => ({ ...i, phone: e.target.value }))} />
//           </FormGroup>
//           <FormGroup label="Address">
//             <Textarea
//               value={info.addressText}
//               onChange={e => setInfo(i => ({ ...i, addressText: e.target.value }))}
//               placeholder="Street, City, State, Pincode, Country"
//             />
//           </FormGroup>
//           <Btn variant="primary" onClick={saveInfo} disabled={savingInfo}>
//             {savingInfo ? 'Saving…' : 'Save Changes'}
//           </Btn>
//         </Card>

//         <div className="flex flex-col gap-4">
//           <Card>
//             <div className="text-[14px] font-medium mb-4">System Defaults</div>
//             {defaultsError && <div className="mb-3 p-2.5 rounded border border-red-200 bg-red-50 text-red-700 text-[12px]">{defaultsError}</div>}
//             <FormGroup label="Default Currency">
//               <Select value={defaults.currency} onChange={e => setDefaults(d => ({ ...d, currency: e.target.value }))}>
//                 {CURRENCY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
//               </Select>
//             </FormGroup>
//             <FormGroup label="Timezone">
//               <Select value={defaults.timezone} onChange={e => setDefaults(d => ({ ...d, timezone: e.target.value }))}>
//                 {TIMEZONE_OPTIONS.map(tz => <option key={tz} value={tz}>{tz}</option>)}
//               </Select>
//             </FormGroup>
//             <FormGroup label="Date Format">
//               <Select value={defaults.dateFormat} onChange={e => setDefaults(d => ({ ...d, dateFormat: e.target.value }))}>
//                 {DATE_FORMAT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
//               </Select>
//             </FormGroup>
//             <Btn size="sm" onClick={saveDefaults} disabled={savingDefaults}>
//               {savingDefaults ? 'Saving…' : 'Save'}
//             </Btn>
//           </Card>

//           <Card>
//             <div className="text-[14px] font-medium mb-3">Logo & Branding</div>
//             <div className="w-20 h-20 border-2 border-dashed border-border rounded flex items-center justify-center mb-3 bg-surface2 overflow-hidden">
//               {logoSrc
//                 ? <img src={logoSrc} alt="Logo" className="w-full h-full object-contain" />
//                 : <span className="text-2xl">📸</span>}
//             </div>
//             <Btn size="sm" onClick={triggerLogoPick} disabled={uploading}>
//               {uploading ? 'Uploading…' : (biz?.logo ? 'Replace Logo' : 'Upload Logo')}
//             </Btn>
//             <div className="text-[11px] text-text2 mt-2">PNG / JPEG / WEBP / SVG, max 2MB.</div>
//           </Card>

//           <Card>
//             <div className="text-[14px] font-medium mb-3">Help & Walkthrough</div>
//             <div className="text-[12px] text-text2 mb-3">
//               Replay the guided tour of the main features for your role.
//             </div>
//             <Btn size="sm" onClick={() => {
//               try {
//                 const uid = JSON.parse(localStorage.getItem('auth_user') || '{}')._id
//                 if (uid) localStorage.removeItem(`onboarding:completed:${uid}`)
//               } catch {  }
//               window.dispatchEvent(new CustomEvent('onboarding:replay'))
//             }}>
//               ↻ Replay walkthrough
//             </Btn>
//           </Card>

//           <GoogleCalendarCard />
//         </div>
//       </div>
//     </div>
//   )
// }

// function GoogleCalendarCard() {
//   const [status, setStatus] = useState(null)   // { configured, connected, email, connectedAt }
//   const [loading, setLoading] = useState(true)
//   const [busy, setBusy] = useState(false)

//   async function load() {
//     try {
//       const res = await apiFetch('GET', '/auth/google/status')
//       setStatus(res.data || null)
//     } catch {
//       setStatus({ configured: false, connected: false })
//     } finally {
//       setLoading(false)
//     }
//   }

//   useEffect(() => { load() }, [])

//   useEffect(() => {
//     if (typeof window === 'undefined') return
//     const params = new URLSearchParams(window.location.search)
//     const flag = params.get('google')
//     if (!flag) return
//     if (flag === 'connected') {
//       showToast('Google Calendar connected.')
//       load()
//     } else if (flag === 'error') {
//       const reason = params.get('google_reason') || 'unknown'
//       showToast(`Google Calendar connection failed: ${reason}`, 'error')
//     }
//     params.delete('google')
//     params.delete('google_reason')
//     const rest = params.toString()
//     const url = window.location.pathname + (rest ? `?${rest}` : '') + window.location.hash
//     window.history.replaceState({}, '', url)
//   }, [])

//   async function connect() {
//     setBusy(true)
//     try {
//       const res = await apiFetch('GET', '/auth/google/connect')
//       const url = res.data?.url
//       if (!url) throw new Error('No authorization URL returned.')
//       window.location.href = url
//     } catch (err) {
//       showToast(err.message || 'Could not start connection.', 'error')
//       setBusy(false)
//     }
//   }

//   async function disconnect() {
//     if (!confirm('Disconnect Google Calendar? Future occasions will need to be synced again after reconnecting.')) return
//     setBusy(true)
//     try {
//       await apiFetch('POST', '/auth/google/disconnect')
//       showToast('Google Calendar disconnected.')
//       await load()
//     } catch (err) {
//       showToast(err.message || 'Could not disconnect.', 'error')
//     } finally {
//       setBusy(false)
//     }
//   }

//   if (loading) return null
//   if (!status?.configured) return null

//   return (
//     <Card>
//       <div className="text-[14px] font-medium mb-1">Google Calendar</div>
//       <div className="text-[12px] text-text2 mb-3">
//         Sync occasion dates to your Google Calendar as events with reminders.
//       </div>
//       {status.connected ? (
//         <>
//           <div className="mb-3 p-2.5 rounded border border-green-200 bg-green-50 text-[12px]">
//             <div className="flex items-center gap-2">
//               <span>✓</span>
//               <span>Connected as <span className="font-medium">{status.email}</span></span>
//             </div>
//             {status.connectedAt && (
//               <div className="text-text2 mt-0.5 pl-5">
//                 Connected on {new Date(status.connectedAt).toLocaleDateString()}
//               </div>
//             )}
//           </div>
//           <Btn size="sm" variant="danger" onClick={disconnect} disabled={busy}>
//             {busy ? 'Working…' : 'Disconnect'}
//           </Btn>
//         </>
//       ) : (
//         <>
//           <div className="text-[11px] text-text2 mb-3">
//             You'll be redirected to Google to grant calendar access.
//           </div>
//           <Btn size="sm" variant="primary" onClick={connect} disabled={busy}>
//             {busy ? 'Redirecting…' : 'Connect Google Calendar'}
//           </Btn>
//         </>
//       )}
//     </Card>
//   )
// }

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { apiFetch, apiDownload, formatDate, formatTime } from '../../../utils/api.js'
import { Badge, Card, PageHeader, FilterBar, TableWrap, TblAction, Btn, Loading, Modal, FormGroup, Input, Select, Textarea } from '../../ui/index.jsx'
import { showToast } from '../../ui/index.jsx'
import { useApp } from '../../../AppContext.jsx'

const TEMPLATE_TYPE_OPTIONS = [
  { value: 'order_confirm',    label: 'Order Confirmation' },
  { value: 'order_assigned',   label: 'Order Assigned' },
  { value: 'pre_delivery',     label: 'Pre-delivery Reminder' },
  { value: 'delivery_confirm', label: 'Delivery Confirmation' },
  { value: 'invoice',          label: 'Invoice' },
  { value: 'feedback_request', label: 'Feedback Request' },
  { value: 'welcome',          label: 'Welcome' },
  { value: 'password_reset',   label: 'Password Reset' },
]
const EMPTY_TEMPLATE_FORM = { name: '', type: 'order_confirm', subject: '', body: '' }

export function EmailTemplatesPage() {
  const [templates, setTemplates]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [editing, setEditing]       = useState(null)
  const [showForm, setShowForm]     = useState(false)
  const [form, setForm]             = useState(EMPTY_TEMPLATE_FORM)
  const [formError, setFormError]   = useState('')
  const [saving, setSaving]         = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)
  const [deleting, setDeleting]     = useState(false)
  const [previewTemplate, setPreview] = useState(null)
  const [previewTab, setPreviewTab]   = useState('html')

  async function loadTemplates() {
    try {
      const res = await apiFetch('GET', '/admin/templates')
      setTemplates(res.data?.templates || [])
    } catch (err) {
      showToast(err.message || 'Failed to load templates.', 'error')
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { loadTemplates() }, [])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_TEMPLATE_FORM)
    setFormError('')
    setShowForm(true)
  }
  function openEdit(t) {
    setEditing(t)
    setForm({
      name: t.name || '',
      type: t.type || 'order_confirm',
      subject: t.subject || '',
      body: t.body || '',
    })
    setFormError('')
    setShowForm(true)
  }
  function closeForm() {
    setShowForm(false)
    setEditing(null)
    setForm(EMPTY_TEMPLATE_FORM)
    setFormError('')
    setSaving(false)
  }

  async function submitForm() {
    if (!form.name.trim())    { setFormError('Name is required.'); return }
    if (!form.type)           { setFormError('Type is required.'); return }
    if (!form.subject.trim()) { setFormError('Subject is required.'); return }
    if (!form.body.trim())    { setFormError('Body is required.'); return }

    const payload = {
      name: form.name.trim(),
      type: form.type,
      subject: form.subject.trim(),
      body: form.body,
    }

    setSaving(true)
    setFormError('')
    try {
      if (editing) {
        await apiFetch('PUT', `/admin/templates/${editing._id}`, payload)
        showToast('Template saved.')
      } else {
        await apiFetch('POST', '/admin/templates', payload)
        showToast('Template created.')
      }
      await loadTemplates()
      closeForm()
      setPreview(payload)
      setPreviewTab('html')
    } catch (err) {
      setFormError(err.message || 'Could not save template.')
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!confirmDel) return
    setDeleting(true)
    try {
      await apiFetch('DELETE', `/admin/templates/${confirmDel._id}`)
      showToast('Template deleted.')
      setConfirmDel(null)
      await loadTemplates()
    } catch (err) {
      showToast(err.message || 'Could not delete template.', 'error')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <Loading />

  return (
    <div>
      <PageHeader title="Email Templates" subtitle="Customize notification emails">
        <Btn variant="primary" onClick={openCreate}>+ New Template</Btn>
      </PageHeader>

      <Card noPad>
        <TableWrap>
          <thead><tr><th>Name</th><th>Type</th><th>Subject</th><th>Updated</th><th>Actions</th></tr></thead>
          <tbody>
            {templates.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-text2 text-sm">No records found.</td></tr>
            ) : templates.map(t => (
              <tr key={t._id}>
                <td data-label="Name" className="font-medium">{t.name}</td>
                <td data-label="Type"><Badge status={t.type} /></td>
                <td data-label="Subject" className="text-text2 md:max-w-[380px] md:truncate">{t.subject}</td>
                <td data-label="Updated">{formatDate(t.updatedAt)}</td>
                <td data-label="Actions">
                  <div className="flex gap-1.5 flex-wrap">
                    <TblAction onClick={() => { setPreview(t); setPreviewTab('html') }}>Preview</TblAction>
                    <TblAction onClick={() => openEdit(t)}>Edit</TblAction>
                    <TblAction onClick={() => setConfirmDel(t)}>Delete</TblAction>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>

      {showForm && (
        <Modal
          title={editing ? 'Edit Template' : 'Email Template'}
          onClose={closeForm}
          size="lg"
          actions={[
            { label: saving ? 'Saving…' : 'Save', primary: true, onClick: submitForm, disabled: saving },
            { label: 'Cancel', onClick: closeForm },
          ]}
        >
          {formError && (
            <div className="mb-3 p-2.5 rounded border border-red-200 bg-red-50 text-red-700 text-[12px]">{formError}</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormGroup label="Template Name">
              <Input placeholder="e.g. Order Confirmation" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </FormGroup>
            <FormGroup label="Type">
              <Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {TEMPLATE_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </FormGroup>
          </div>
          <FormGroup label="Subject">
            <Input placeholder="Your order {{orderNumber}} is confirmed" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Body (HTML)">
            <textarea
              className="w-full px-3 py-2 border border-border2 rounded bg-surface text-text1 text-[12px] font-mono outline-none focus:border-accent resize-y min-h-[160px] max-h-[50vh]"
              placeholder="<p>Dear {{name}},</p>…"
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            />
          </FormGroup>
          <div className="text-[11px] text-text2">Placeholders: {'{{name}}'}, {'{{orderNumber}}'}, {'{{date}}'}, {'{{invoiceNumber}}'}</div>
        </Modal>
      )}

      {confirmDel && (
        <Modal
          title="Delete Template"
          onClose={() => !deleting && setConfirmDel(null)}
          actions={[
            { label: deleting ? 'Deleting…' : 'Delete', primary: true, onClick: confirmDelete, disabled: deleting },
            { label: 'Cancel', onClick: () => setConfirmDel(null) },
          ]}
        >
          <div className="text-[13px] text-text1">
            Delete template <span className="font-semibold">{confirmDel.name}</span>? This cannot be undone.
          </div>
        </Modal>
      )}

      {previewTemplate && (
        <Modal
          title={`Preview — ${previewTemplate.name || 'Template'}`}
          onClose={() => setPreview(null)}
          size="lg"
          actions={[{ label: 'Close', onClick: () => setPreview(null) }]}
        >
          <div className="mb-3 flex gap-2 items-center">
            <span className="text-[12px] text-text2 font-medium">Subject:</span>
            <span className="text-[13px] font-semibold text-text1">{previewTemplate.subject || '—'}</span>
          </div>
          <div className="flex gap-2 mb-3">
            <button onClick={() => setPreviewTab('html')}
              className={`px-3 py-1 rounded text-[12px] font-medium transition-colors ${previewTab === 'html' ? 'bg-accent text-white' : 'bg-surface2 text-text2 hover:bg-surface3'}`}>
              Rendered Preview
            </button>
            <button onClick={() => setPreviewTab('source')}
              className={`px-3 py-1 rounded text-[12px] font-medium transition-colors ${previewTab === 'source' ? 'bg-accent text-white' : 'bg-surface2 text-text2 hover:bg-surface3'}`}>
              HTML Source
            </button>
          </div>
          {previewTab === 'html' ? (
            <div className="border border-border rounded-lg overflow-hidden bg-white">
              <div className="bg-gray-50 border-b border-border px-4 py-2 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="text-[11px] text-text3 ml-2">Email Preview</span>
              </div>
              <iframe
                srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;padding:24px;max-width:600px;margin:0 auto;color:#222;line-height:1.6}p{margin:0 0 12px}</style></head><body>${previewTemplate.body || '<p style="color:#999">No body content yet.</p>'}</body></html>`}
                className="w-full min-h-[320px] border-0"
                title="Email Preview"
                sandbox="allow-same-origin"
              />
            </div>
          ) : (
            <pre className="bg-surface2 rounded-lg p-4 text-[11px] font-mono text-text1 overflow-auto max-h-[400px] whitespace-pre-wrap border border-border">
              {previewTemplate.body || '(empty)'}
            </pre>
          )}
          <div className="mt-3 text-[11px] text-text3">
            Placeholders like <code className="bg-surface2 px-1 rounded">{'{{name}}'}</code> will be replaced with real values when emails are sent.
          </div>
        </Modal>
      )}
    </div>
  )
}

const LOGS_POLL_MS = 30000
const LOGS_DEBOUNCE_MS = 300

export function LoginLogsPage() {
  const [filters, setFilters] = useState({ search: '', status: '', from: '', to: '' })
  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
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
      const res = await apiFetch('GET', `/admin/login-logs${buildQuery(f)}`)
      setLogs(res.data?.logs || [])
    } catch (err) {
      showToast(err.message || 'Failed to load logs.', 'error')
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
    }, LOGS_DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [filters])

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState !== 'visible') return
      if (isTypingRef.current) return
      load(filters)
    }, LOGS_POLL_MS)
    return () => clearInterval(interval)
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
      await apiDownload(`/admin/login-logs/export${buildQuery(filters)}`, `login-logs-${Date.now()}.xlsx`)
    } catch (err) {
      showToast(err.message || 'Export failed.', 'error')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <PageHeader title="Login & Activity Logs" subtitle="Audit trail of all login attempts">
        <Btn size="sm" onClick={doExport} disabled={exporting}>{exporting ? 'Exporting…' : '↓ Export'}</Btn>
      </PageHeader>
      <FilterBar
        values={filters}
        onChange={onFilterChange}
        onClear={onClear}
        fields={[
          { key: 'search', placeholder: 'Search by user, email, or IP…' },
          { key: 'status', type: 'select', placeholder: 'All', options: [{ v:'success',l:'Success' },{ v:'failed',l:'Failed' }] },
          { key: 'from',   type: 'date' },
          { key: 'to',     type: 'date' },
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
                  <td data-label="User">
                    <div className="font-medium">{l.user?.name || l.attemptedEmail || 'Unknown'}</div>
                    <div className="text-[11px] text-text2 break-all">{l.user?.email || l.attemptedEmail || ''}</div>
                  </td>
                  <td data-label="IP Address"><span className="font-mono text-[12px]">{l.ipAddress || '—'}</span></td>
                  <td data-label="Device" className="text-text2">{l.device || '—'}</td>
                  <td data-label="Status">
                    {l.status === 'success'
                      ? <span className="bg-green-50 text-green-800 px-2 py-0.5 rounded-full text-[11px] font-medium">✓ Success</span>
                      : <span className="bg-red-50 text-red-800 px-2 py-0.5 rounded-full text-[11px] font-medium">✗ Failed</span>}
                  </td>
                  <td data-label="Date & Time" className="text-text2">{formatDate(l.loggedAt || l.createdAt)} {formatTime(l.loggedAt || l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>
    </div>
  )
}

const EMAIL_LOG_STATUS_OPTIONS = [
  { v: 'sent',    l: 'Sent' },
  { v: 'failed',  l: 'Failed' },
  { v: 'bounced', l: 'Bounced' },
  { v: 'pending', l: 'Pending' },
  { v: 'skipped', l: 'Skipped (dev)' },
]
const EMAIL_LOG_DEBOUNCE_MS = 300

export function EmailLogsPage() {
  const [filters, setFilters] = useState({ search: '', status: '', from: '', to: '' })
  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmResend, setConfirmResend] = useState(null)
  const [resending, setResending]         = useState(false)
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
      const res = await apiFetch('GET', `/admin/email-logs${buildQuery(f)}`)
      setLogs(res.data?.logs || [])
    } catch (err) {
      showToast(err.message || 'Failed to load email logs.', 'error')
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
    }, EMAIL_LOG_DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [filters])

  function onFilterChange(key, val) {
    setFilters(f => ({ ...f, [key]: val }))
  }
  function onClear() {
    setFilters({ search: '', status: '', from: '', to: '' })
  }

  async function doResend() {
    if (!confirmResend) return
    setResending(true)
    try {
      await apiFetch('POST', `/admin/email-logs/${confirmResend._id}/resend`)
      showToast('Email resent.')
      setConfirmResend(null)
      await load(filters)
    } catch (err) {
      showToast(err.message || 'Could not resend.', 'error')
    } finally {
      setResending(false)
    }
  }

  return (
    <div>
      <PageHeader title="Email Logs" subtitle="Track all outgoing email communications" />
      <FilterBar
        values={filters}
        onChange={onFilterChange}
        onClear={onClear}
        fields={[
          { key: 'search', placeholder: 'Search recipient or subject…' },
          { key: 'status', type: 'select', placeholder: 'All', options: EMAIL_LOG_STATUS_OPTIONS },
          { key: 'from',   type: 'date' },
          { key: 'to',     type: 'date' },
        ]}
      />
      <Card noPad>
        {loading ? <Loading /> : (
          <TableWrap>
            <thead>
              <tr><th>To</th><th>Subject</th><th>Type</th><th>Status</th><th>Attempts</th><th>Sent At</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-text2 text-sm">No records found.</td></tr>
              ) : logs.map(l => {
                const isFailed = l.status === 'failed' || l.status === 'bounced'
                const canResend = isFailed || l.status === 'skipped' || l.status === 'sent'
                return (
                  <tr key={l._id}>
                    <td data-label="To" className="text-text2 break-all">{l.to}</td>
                    <td data-label="Subject" className="md:max-w-[340px]">
                      <div className="md:truncate">{l.subject}</div>
                      {isFailed && l.errorMessage && (
                        <div
                          className="text-[11px] text-red-600 mt-0.5 md:truncate"
                          title={l.errorMessage}
                        >
                          ⨯ {l.errorMessage}
                        </div>
                      )}
                    </td>
                    <td data-label="Type" className="text-text2 text-[11px]">{l.templateType || '—'}</td>
                    <td data-label="Status"><Badge status={l.status} /></td>
                    <td data-label="Attempts" className="text-text2 text-[12px]">{l.attempts || 1}</td>
                    <td data-label="Sent At" className="text-text2">{formatDate(l.sentAt || l.createdAt)} {formatTime(l.sentAt || l.createdAt)}</td>
                    <td data-label="Actions">
                      {canResend && (
                        <TblAction onClick={() => setConfirmResend(l)}>
                          {isFailed ? '↻ Retry' : 'Resend'}
                        </TblAction>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </TableWrap>
        )}
      </Card>

      {confirmResend && (
        <Modal
          title="Resend Email"
          onClose={() => !resending && setConfirmResend(null)}
          actions={[
            { label: resending ? 'Resending…' : 'Resend', primary: true, onClick: doResend, disabled: resending },
            { label: 'Cancel', onClick: () => setConfirmResend(null) },
          ]}
        >
          <div className="text-[13px] text-text1">
            Resend <span className="font-semibold">{confirmResend.subject}</span> to <span className="font-mono">{confirmResend.to}</span>?
          </div>
          <div className="text-[11px] text-text2 mt-2">
            A new email log row will be created for this attempt — the original row is preserved.
          </div>
        </Modal>
      )}
    </div>
  )
}

const FORMAT_EXT = { Excel: 'xlsx', CSV: 'csv', PDF: 'pdf' }

const IMPORT_ENTITIES = [
  { label: 'Staff Members', icon: '👥', path: '/admin/staff',      filenameRoot: 'staff' },
  { label: 'Products',      icon: '📦', path: '/admin/products',   filenameRoot: 'products' },
  { label: 'Corporates',    icon: '🏢', path: '/admin/corporates', filenameRoot: 'corporates' },
]

const EXPORT_ENTITIES = [
  { label: 'Orders',        icon: '📋', path: '/admin/orders',     filenameRoot: 'orders',        formats: ['Excel', 'CSV', 'PDF'] },
  { label: 'Invoices',      icon: '💳', path: '/admin/invoices',   filenameRoot: 'invoices',      formats: ['Excel', 'PDF'] },
  { label: 'Staff',         icon: '👥', path: '/admin/staff',      filenameRoot: 'staff',         formats: ['Excel', 'CSV'] },
  { label: 'Products',      icon: '📦', path: '/admin/products',   filenameRoot: 'products',      formats: ['Excel', 'CSV'] },
  { label: 'Activity Logs', icon: '🔍', path: '/admin/login-logs', filenameRoot: 'activity-logs', formats: ['Excel', 'CSV'] },
]

export function ImportExportPage() {
  const [busy, setBusy]             = useState({})      // { [key]: true } while downloading/uploading
  const [pendingFile, setPendingFile] = useState(null)  // { entity, file }
  const [errorModal, setErrorModal] = useState(null)    // { entity, errors[] }
  const fileInputRef                = useRef(null)
  const currentEntityRef            = useRef(null)

  function setBusyKey(key, v) {
    setBusy(b => ({ ...b, [key]: v }))
  }

  async function doExport(entity, formatLabel) {
    const fmt = FORMAT_EXT[formatLabel]
    const key = `export:${entity.label}:${fmt}`
    setBusyKey(key, true)
    try {
      await apiDownload(`${entity.path}/export?format=${fmt}`, `${entity.filenameRoot}-${Date.now()}.${fmt}`)
    } catch (err) {
      showToast(err.message || 'Export failed.', 'error')
    } finally {
      setBusyKey(key, false)
    }
  }

  async function doTemplate(entity) {
    const key = `template:${entity.label}`
    setBusyKey(key, true)
    try {
      await apiDownload(`${entity.path}/import/template`, `${entity.filenameRoot}-template.xlsx`)
    } catch (err) {
      showToast(err.message || 'Template download failed.', 'error')
    } finally {
      setBusyKey(key, false)
    }
  }

  function triggerPick(entity) {
    currentEntityRef.current = entity
    if (fileInputRef.current) {
      fileInputRef.current.value = ''     // allow re-uploading same filename
      fileInputRef.current.click()
    }
  }

  function onFileSelected(e) {
    const file = e.target.files && e.target.files[0]
    const entity = currentEntityRef.current
    if (!file || !entity) return
    if (file.size > 5 * 1024 * 1024) {
      showToast('File exceeds 5MB limit.', 'error')
      return
    }
    setPendingFile({ entity, file })
  }

  async function confirmUpload() {
    if (!pendingFile) return
    const { entity, file } = pendingFile
    const key = `upload:${entity.label}`
    setBusyKey(key, true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await apiFetch('POST', `${entity.path}/import`, form, true)
      showToast(res?.message || `Imported ${res?.data?.imported ?? ''} record(s).`)
      setPendingFile(null)
    } catch (err) {
      if (err.status === 413) {
        showToast(err.message, 'error')
      } else if (Array.isArray(err.errors) && err.errors.length > 0) {
        setErrorModal({ entity, errors: err.errors })
      } else {
        showToast(err.message || 'Import failed.', 'error')
      }
      setPendingFile(null)
    } finally {
      setBusyKey(key, false)
    }
  }

  return (
    <div>
      <PageHeader title="Data Import & Export" subtitle="Bulk data operations" />

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        onChange={onFileSelected}
        className="hidden"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {}
        <Card>
          <div className="text-[14px] font-medium mb-1">Import Data</div>
          <p className="text-xs text-text2 mb-4">Upload CSV or Excel files to bulk-add records</p>
          {IMPORT_ENTITIES.map(entity => (
            <div
              key={entity.label}
              className="border border-border rounded p-3 mb-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xl flex-shrink-0">{entity.icon}</span>
                <div className="min-w-0">
                  <div className="font-medium text-[13px] truncate">{entity.label}</div>
                  <div className="text-[11px] text-text2">CSV or XLSX · max 5MB</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Btn size="sm" onClick={() => doTemplate(entity)} disabled={busy[`template:${entity.label}`]}>
                  {busy[`template:${entity.label}`] ? '…' : '↓ Template'}
                </Btn>
                <Btn size="sm" variant="primary" onClick={() => triggerPick(entity)} disabled={busy[`upload:${entity.label}`]}>
                  {busy[`upload:${entity.label}`] ? 'Uploading…' : '↑ Upload'}
                </Btn>
              </div>
            </div>
          ))}
        </Card>

        {}
        <Card>
          <div className="text-[14px] font-medium mb-1">Export Data</div>
          <p className="text-xs text-text2 mb-4">Download your data in various formats</p>
          {EXPORT_ENTITIES.map(entity => (
            <div
              key={entity.label}
              className="border border-border rounded p-3 mb-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xl flex-shrink-0">{entity.icon}</span>
                <div className="font-medium text-[13px] truncate">{entity.label}</div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {entity.formats.map(f => {
                  const key = `export:${entity.label}:${FORMAT_EXT[f]}`
                  return (
                    <Btn key={f} size="sm" onClick={() => doExport(entity, f)} disabled={busy[key]}>
                      {busy[key] ? '…' : `↓ ${f}`}
                    </Btn>
                  )
                })}
              </div>
            </div>
          ))}
        </Card>
      </div>

      {}
      {pendingFile && (
        <Modal
          title="Confirm Import"
          onClose={() => setPendingFile(null)}
          actions={[
            { label: busy[`upload:${pendingFile.entity.label}`] ? 'Uploading…' : 'Import', primary: true, onClick: confirmUpload, disabled: busy[`upload:${pendingFile.entity.label}`] },
            { label: 'Cancel', onClick: () => setPendingFile(null) },
          ]}
        >
          <div className="text-[13px] text-text1">
            Upload <span className="font-semibold">{pendingFile.file.name}</span> as <span className="font-semibold">{pendingFile.entity.label}</span>?
          </div>
          <div className="text-[12px] text-text2 mt-2">
            Existing records will not be affected. Duplicate rows will be rejected.
          </div>
        </Modal>
      )}

      {}
      {errorModal && (
        <Modal
          title={`${errorModal.entity.label} — Import Failed`}
          onClose={() => setErrorModal(null)}
          actions={[{ label: 'Close', onClick: () => setErrorModal(null) }]}
        >
          <div className="text-[12px] text-text2 mb-3">No rows were imported. Fix the issues below and retry.</div>
          <div className="max-h-[280px] overflow-y-auto border border-border rounded">
            <table className="w-full text-[12px]">
              <thead className="bg-surface2 sticky top-0">
                <tr><th className="text-left px-2 py-1.5">Row</th><th className="text-left px-2 py-1.5">Field</th><th className="text-left px-2 py-1.5">Error</th></tr>
              </thead>
              <tbody>
                {errorModal.errors.slice(0, 10).map((e, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-2 py-1.5 font-mono">{e.row}</td>
                    <td className="px-2 py-1.5 font-mono">{e.field}</td>
                    <td className="px-2 py-1.5 text-red-700">{e.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {errorModal.errors.length > 10 && (
            <div className="text-[11px] text-text3 mt-2">… and {errorModal.errors.length - 10} more.</div>
          )}
        </Modal>
      )}
    </div>
  )
}

const EMPTY_INVITE = { email: '', name: '', role: 'staff', roleId: '' }
const EMPTY_EDIT   = { name: '', role: 'staff', roleId: '' }

function userStatus(u) {
  if (u.isActive) return { key: 'active',  label: 'Active',         tone: 'active' }
  if (u.inviteToken || (u.inviteExpire && new Date(u.inviteExpire) > new Date())) {
    return { key: 'pending', label: 'Pending Invite', tone: 'pending' }
  }
  return { key: 'inactive', label: 'Deactivated', tone: 'inactive' }
}

export function AdminUsersPage() {
  const { user: currentUser } = useApp()
  const [users, setUsers]     = useState([])
  const [roles, setRoles]     = useState([])
  const [loading, setLoading] = useState(true)

  const [showInvite, setShowInvite] = useState(false)
  const [inviteForm, setInviteForm] = useState(EMPTY_INVITE)
  const [inviteError, setInviteError] = useState('')
  const [inviting, setInviting]     = useState(false)

  const [editing, setEditing]       = useState(null)   // user being edited (or null)
  const [editForm, setEditForm]     = useState(EMPTY_EDIT)
  const [editError, setEditError]   = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  const [confirmReset, setConfirmReset] = useState(null)
  const [resettingPw, setResettingPw]   = useState(false)
  const [confirmToggle, setConfirmToggle] = useState(null)
  const [toggling, setToggling]           = useState(false)

  async function load() {
    try {
      const [u, r] = await Promise.all([
        apiFetch('GET', '/admin/users'),
        apiFetch('GET', '/admin/roles').catch(() => ({ data: { roles: [] } })),
      ])
      setUsers(u.data?.users || [])
      setRoles(r.data?.roles || [])
    } catch (err) {
      showToast(err.message || 'Failed to load users.', 'error')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  function openInvite() {
    setInviteForm(EMPTY_INVITE); setInviteError(''); setShowInvite(true)
  }
  function closeInvite() {
    setShowInvite(false); setInviteForm(EMPTY_INVITE); setInviteError(''); setInviting(false)
  }
  async function submitInvite() {
    if (!inviteForm.email.trim()) { setInviteError('Email is required.'); return }
    if (!inviteForm.name.trim())  { setInviteError('Name is required.'); return }
    if (!/^[A-Za-z\s]+$/.test(inviteForm.name.trim())) { setInviteError('Name must contain only letters.'); return }
    setInviting(true); setInviteError('')
    try {
      await apiFetch('POST', '/admin/users/invite', {
        email: inviteForm.email.trim(),
        name: inviteForm.name.trim(),
        role: inviteForm.role,
        roleId: inviteForm.roleId || undefined,
      })
      showToast('Invitation sent. In dev, copy the link from the backend terminal.')
      await load()
      closeInvite()
    } catch (err) {
      setInviteError(err.message || 'Could not send invitation.')
      setInviting(false)
    }
  }

  function openEdit(u) {
    setEditing(u); setEditForm({ name: u.name || '', role: u.role || 'staff', roleId: '' }); setEditError('')
  }
  function closeEdit() {
    setEditing(null); setEditForm(EMPTY_EDIT); setEditError(''); setSavingEdit(false)
  }
  async function submitEdit() {
    if (!editForm.name.trim()) { setEditError('Name is required.'); return }
    if (!/^[A-Za-z\s]+$/.test(editForm.name.trim())) { setEditError('Name must contain only letters.'); return }
    setSavingEdit(true); setEditError('')
    try {
      await apiFetch('PUT', `/admin/users/${editing._id}`, {
        name: editForm.name.trim(),
        role: editForm.role,
        roleId: editForm.roleId || undefined,
      })
      showToast('User updated.')
      await load()
      closeEdit()
    } catch (err) {
      setEditError(err.message || 'Could not save changes.')
      setSavingEdit(false)
    }
  }

  async function doResetPassword() {
    if (!confirmReset) return
    setResettingPw(true)
    try {
      await apiFetch('PATCH', `/admin/users/${confirmReset._id}/reset-password`)
      showToast('Password reset email sent.')
      setConfirmReset(null)
    } catch (err) {
      showToast(err.message || 'Could not send reset email.', 'error')
    } finally {
      setResettingPw(false)
    }
  }

  async function doToggleStatus() {
    if (!confirmToggle) return
    setToggling(true)
    try {
      await apiFetch('PATCH', `/admin/users/${confirmToggle._id}/toggle-status`)
      showToast(`User ${confirmToggle.isActive ? 'deactivated' : 'activated'}.`)
      await load()
      setConfirmToggle(null)
    } catch (err) {
      showToast(err.message || 'Could not update status.', 'error')
    } finally {
      setToggling(false)
    }
  }

  const isSelf = (u) => String(u._id) === String(currentUser?._id)

  return (
    <div>
      <PageHeader title="Admin Users" subtitle="Manage team members and access">
        <Btn variant="primary" onClick={openInvite}>+ Invite User</Btn>
      </PageHeader>
      <Card noPad>
        {loading ? <Loading /> : (
          <TableWrap>
            <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Last Login</th><th>Actions</th></tr></thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-text2 text-sm">No records found.</td></tr>
              ) : users.map(u => {
                const status = userStatus(u)
                const pendingInvite = status.key === 'pending'
                const self = isSelf(u)
                return (
                  <tr key={u._id}>
                    <td data-label="User">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-accent-light flex items-center justify-center text-[10px] font-semibold text-accent">
                          {(u.name||'?').split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{u.name}{self && <span className="ml-1.5 text-[11px] text-text3">(you)</span>}</div>
                          <div className="text-[11px] text-text2 break-all">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td data-label="Role"><Badge status={u.role} /></td>
                    <td data-label="Status"><Badge status={status.tone} />{status.key === 'pending' && <span className="ml-1 text-[11px] text-text2">Pending Invite</span>}</td>
                    <td data-label="Last Login" className="text-text2">{u.lastLogin ? formatDate(u.lastLogin) : '—'}</td>
                    <td data-label="Actions">
                      <div className="flex gap-1.5 flex-wrap">
                        <TblAction onClick={() => openEdit(u)}>Edit</TblAction>
                        <TblAction onClick={() => setConfirmReset(u)} disabled={pendingInvite}>Reset PW</TblAction>
                        <TblAction onClick={() => setConfirmToggle(u)} disabled={self}>
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

      {}
      {showInvite && (
        <Modal
          title="Invite Team Member"
          onClose={closeInvite}
          actions={[
            { label: inviting ? 'Sending…' : 'Send Invitation', primary: true, onClick: submitInvite, disabled: inviting },
            { label: 'Cancel', onClick: closeInvite },
          ]}
        >
          {inviteError && <div className="mb-3 p-2.5 rounded border border-red-200 bg-red-50 text-red-700 text-[12px]">{inviteError}</div>}
          <FormGroup label="Email Address">
            <Input type="email" placeholder="colleague@company.com" value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Name">
            <Input placeholder="Full name" value={inviteForm.name} onChange={e => setInviteForm(f => ({ ...f, name: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Role">
            <Select value={inviteForm.role} onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))}>
              <option value="staff">Staff</option>
            </Select>
          </FormGroup>
          <FormGroup label="Access Role (optional)" hint="Assigns a preset of module/action permissions. Leave blank to use baseline role access.">
            <Select value={inviteForm.roleId} onChange={e => setInviteForm(f => ({ ...f, roleId: e.target.value }))}>
              <option value="">— No preset —</option>
              {roles.map(r => (
                <option key={r._id} value={r._id}>
                  {r.name} ({r.scope}) — {(r.permissions || []).length} perms
                </option>
              ))}
            </Select>
          </FormGroup>
          <div className="text-[11px] text-text2 mt-1">
            The invitee will receive an email with a link to set their password. Link expires in 48 hours.
          </div>
        </Modal>
      )}

      {}
      {editing && (
        <Modal
          title={`Edit ${editing.name || 'User'}`}
          onClose={closeEdit}
          actions={[
            { label: savingEdit ? 'Saving…' : 'Save', primary: true, onClick: submitEdit, disabled: savingEdit },
            { label: 'Cancel', onClick: closeEdit },
          ]}
        >
          {editError && <div className="mb-3 p-2.5 rounded border border-red-200 bg-red-50 text-red-700 text-[12px]">{editError}</div>}
          <FormGroup label="Email (read-only)">
            <Input type="email" value={editing.email || ''} disabled />
          </FormGroup>
          <FormGroup label="Name">
            <Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Role">
            <Select value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}>
              <option value="staff">Staff</option>
            </Select>
          </FormGroup>
          <FormGroup label="Access Role (optional)" hint="Selecting a role will replace this user's current permissions with the role's preset.">
            <Select value={editForm.roleId} onChange={e => setEditForm(f => ({ ...f, roleId: e.target.value }))}>
              <option value="">— Keep current permissions —</option>
              {roles.map(r => (
                <option key={r._id} value={r._id}>
                  {r.name} ({r.scope}) — {(r.permissions || []).length} perms
                </option>
              ))}
            </Select>
          </FormGroup>
        </Modal>
      )}

      {}
      {confirmReset && (
        <Modal
          title="Send Password Reset Email"
          onClose={() => !resettingPw && setConfirmReset(null)}
          actions={[
            { label: resettingPw ? 'Sending…' : 'Send Reset Email', primary: true, onClick: doResetPassword, disabled: resettingPw },
            { label: 'Cancel', onClick: () => setConfirmReset(null) },
          ]}
        >
          <div className="text-[13px]">
            Send a password-reset email to <span className="font-semibold">{confirmReset.email}</span>? They'll receive a link to choose a new password. The link expires in 1 hour.
          </div>
        </Modal>
      )}

      {}
      {confirmToggle && (
        <Modal
          title={confirmToggle.isActive ? 'Deactivate User' : 'Activate User'}
          onClose={() => !toggling && setConfirmToggle(null)}
          actions={[
            { label: toggling ? 'Saving…' : (confirmToggle.isActive ? 'Deactivate' : 'Activate'), primary: true, onClick: doToggleStatus, disabled: toggling },
            { label: 'Cancel', onClick: () => setConfirmToggle(null) },
          ]}
        >
          <div className="text-[13px]">
            {confirmToggle.isActive
              ? <>Deactivate <span className="font-semibold">{confirmToggle.name}</span>? They won't be able to log in until reactivated.</>
              : <>Activate <span className="font-semibold">{confirmToggle.name}</span>? They'll regain access immediately.</>}
          </div>
        </Modal>
      )}
    </div>
  )
}

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'INR', label: 'INR (₹)' },
]
const TIMEZONE_OPTIONS = [
  'UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Kolkata', 'Asia/Singapore',
]
const DATE_FORMAT_OPTIONS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']

function addressToString(a) {
  if (!a) return ''
  return [a.street, a.city, a.state, a.pincode, a.country].filter(Boolean).join(', ')
}
function stringToAddress(s) {
  const parts = String(s || '').split(',').map(p => p.trim())
  const [street, city, state, pincode, country] = [
    parts.slice(0, parts.length - 4).join(', '),
    parts[parts.length - 4],
    parts[parts.length - 3],
    parts[parts.length - 2],
    parts[parts.length - 1],
  ]
  return {
    street: street || '',
    city: city || '',
    state: state || '',
    pincode: pincode || '',
    country: country || 'India',
  }
}

export function SettingsPage() {
  const [biz, setBiz]               = useState(null)
  const [loading, setLoading]       = useState(true)
  const [info, setInfo]             = useState({ name: '', email: '', phone: '', addressText: '' })
  const [defaults, setDefaults]     = useState({ currency: 'INR', timezone: 'Asia/Kolkata', dateFormat: 'DD/MM/YYYY' })
  const [savingInfo, setSavingInfo] = useState(false)
  const [savingDefaults, setSavingDefaults] = useState(false)
  const [uploading, setUploading]   = useState(false)
  const [infoError, setInfoError]   = useState('')
  const [defaultsError, setDefaultsError] = useState('')
  const logoInputRef                = useRef(null)

  async function load() {
    try {
      const res = await apiFetch('GET', '/admin/business')
      const b = res.data?.business || {}
      setBiz(b)
      setInfo({
        name: b.name || '',
        email: b.email || '',
        phone: b.phone || '',
        addressText: addressToString(b.address),
      })
      setDefaults({
        currency: b.currency || 'INR',
        timezone: b.timezone || 'Asia/Kolkata',
        dateFormat: b.dateFormat || 'DD/MM/YYYY',
      })
    } catch (err) {
      showToast(err.message || 'Failed to load settings.', 'error')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  async function saveInfo() {
    if (!info.name.trim())  { setInfoError('Business name is required.'); return }
    if (!info.email.trim()) { setInfoError('Email is required.'); return }
    setSavingInfo(true); setInfoError('')
    try {
      const res = await apiFetch('PATCH', '/admin/business', {
        name: info.name.trim(),
        email: info.email.trim(),
        phone: info.phone.trim(),
        address: stringToAddress(info.addressText),
      })
      setBiz(res.data?.business || biz)
      showToast('Business information saved.')
    } catch (err) {
      setInfoError(err.message || 'Could not save.')
    } finally {
      setSavingInfo(false)
    }
  }

  async function saveDefaults() {
    setSavingDefaults(true); setDefaultsError('')
    try {
      const res = await apiFetch('PATCH', '/admin/business', {
        currency: defaults.currency,
        timezone: defaults.timezone,
        dateFormat: defaults.dateFormat,
      })
      setBiz(res.data?.business || biz)
      showToast('Preferences saved.')
    } catch (err) {
      setDefaultsError(err.message || 'Could not save.')
    } finally {
      setSavingDefaults(false)
    }
  }

  function triggerLogoPick() {
    if (logoInputRef.current) {
      logoInputRef.current.value = ''
      logoInputRef.current.click()
    }
  }

  async function onLogoSelected(e) {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      showToast('File must be under 2MB.', 'error')
      return
    }
    if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type)) {
      showToast('Only PNG, JPEG, WEBP, or SVG allowed.', 'error')
      return
    }
    setUploading(true)
    try {
      const form = new FormData()
      form.append('logo', file)
      const res = await apiFetch('POST', '/admin/business/logo', form, true)
      const logo = res.data?.logo
      if (logo) setBiz(b => ({ ...(b || {}), logo }))
      showToast('Logo uploaded.')
    } catch (err) {
      showToast(err.message || 'Upload failed.', 'error')
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <Loading />

  const logoSrc = biz?.logo ? `${biz.logo}?v=${(biz.updatedAt ? new Date(biz.updatedAt).getTime() : Date.now())}` : null

  return (
    <div>
      <PageHeader title="System Configuration" />

      <input
        ref={logoInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={onLogoSelected}
        className="hidden"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <div className="text-[14px] font-medium mb-4">Business Information</div>
          {infoError && <div className="mb-3 p-2.5 rounded border border-red-200 bg-red-50 text-red-700 text-[12px]">{infoError}</div>}
          <FormGroup label="Business Name">
            <Input value={info.name} onChange={e => setInfo(i => ({ ...i, name: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Email">
            <Input type="email" value={info.email} onChange={e => setInfo(i => ({ ...i, email: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Phone">
            <Input value={info.phone} onChange={e => setInfo(i => ({ ...i, phone: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Address">
            <Textarea
              value={info.addressText}
              onChange={e => setInfo(i => ({ ...i, addressText: e.target.value }))}
              placeholder="Street, City, State, Pincode, Country"
            />
          </FormGroup>
          <Btn variant="primary" onClick={saveInfo} disabled={savingInfo}>
            {savingInfo ? 'Saving…' : 'Save Changes'}
          </Btn>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <div className="text-[14px] font-medium mb-4">System Defaults</div>
            {defaultsError && <div className="mb-3 p-2.5 rounded border border-red-200 bg-red-50 text-red-700 text-[12px]">{defaultsError}</div>}
            <FormGroup label="Default Currency">
              <Select value={defaults.currency} onChange={e => setDefaults(d => ({ ...d, currency: e.target.value }))}>
                {CURRENCY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </FormGroup>
            <FormGroup label="Timezone">
              <Select value={defaults.timezone} onChange={e => setDefaults(d => ({ ...d, timezone: e.target.value }))}>
                {TIMEZONE_OPTIONS.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </Select>
            </FormGroup>
            <FormGroup label="Date Format">
              <Select value={defaults.dateFormat} onChange={e => setDefaults(d => ({ ...d, dateFormat: e.target.value }))}>
                {DATE_FORMAT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
              </Select>
            </FormGroup>
            <Btn size="sm" onClick={saveDefaults} disabled={savingDefaults}>
              {savingDefaults ? 'Saving…' : 'Save'}
            </Btn>
          </Card>

          <Card>
            <div className="text-[14px] font-medium mb-3">Logo & Branding</div>
            <div className="w-20 h-20 border-2 border-dashed border-border rounded flex items-center justify-center mb-3 bg-surface2 overflow-hidden">
              {logoSrc
                ? <img src={logoSrc} alt="Logo" className="w-full h-full object-contain" />
                : <span className="text-2xl">📸</span>}
            </div>
            <Btn size="sm" onClick={triggerLogoPick} disabled={uploading}>
              {uploading ? 'Uploading…' : (biz?.logo ? 'Replace Logo' : 'Upload Logo')}
            </Btn>
            <div className="text-[11px] text-text2 mt-2">PNG / JPEG / WEBP / SVG, max 2MB.</div>
          </Card>

          <Card>
            <div className="text-[14px] font-medium mb-3">Help & Walkthrough</div>
            <div className="text-[12px] text-text2 mb-3">
              Replay the guided tour of the main features for your role.
            </div>
            <Btn size="sm" onClick={() => {
              try {
                const uid = JSON.parse(localStorage.getItem('auth_user') || '{}')._id
                if (uid) localStorage.removeItem(`onboarding:completed:${uid}`)
              } catch {  }
              window.dispatchEvent(new CustomEvent('onboarding:replay'))
            }}>
              ↻ Replay walkthrough
            </Btn>
          </Card>

          <GoogleCalendarCard />
        </div>
      </div>
    </div>
  ) 
}

function GoogleCalendarCard() {
  const [status, setStatus] = useState(null)   // { configured, connected, email, connectedAt }
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  async function load() {
    try {
      const res = await apiFetch('GET', '/auth/google/status')
      setStatus(res.data || null)
    } catch {
      setStatus({ configured: false, connected: false })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const flag = params.get('google')
    if (!flag) return
    if (flag === 'connected') {
      showToast('Google Calendar connected.')
      load()
    } else if (flag === 'error') {
      const reason = params.get('google_reason') || 'unknown'
      showToast(`Google Calendar connection failed: ${reason}`, 'error')
    }
    params.delete('google')
    params.delete('google_reason')
    const rest = params.toString()
    const url = window.location.pathname + (rest ? `?${rest}` : '') + window.location.hash
    window.history.replaceState({}, '', url)
  }, [])

  async function connect() {
    setBusy(true)
    try {
      const res = await apiFetch('GET', '/auth/google/connect')
      const url = res.data?.url
      if (!url) throw new Error('No authorization URL returned.')
      window.location.href = url
    } catch (err) {
      showToast(err.message || 'Could not start connection.', 'error')
      setBusy(false)
    }
  }

  async function disconnect() {
    if (!confirm('Disconnect Google Calendar? Future occasions will need to be synced again after reconnecting.')) return
    setBusy(true)
    try {
      await apiFetch('POST', '/auth/google/disconnect')
      showToast('Google Calendar disconnected.')
      await load()
    } catch (err) {
      showToast(err.message || 'Could not disconnect.', 'error')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return null
  if (!status?.configured) return null

  return (
    <Card>
      <div className="text-[14px] font-medium mb-1">Google Calendar</div>
      <div className="text-[12px] text-text2 mb-3">
        Sync occasion dates to your Google Calendar as events with reminders.
      </div>
      {status.connected ? (
        <>
          <div className="mb-3 p-2.5 rounded border border-green-200 bg-green-50 text-[12px]">
            <div className="flex items-center gap-2">
              <span>✓</span>
              <span>Connected as <span className="font-medium">{status.email}</span></span>
            </div>
            {status.connectedAt && (
              <div className="text-text2 mt-0.5 pl-5">
                Connected on {new Date(status.connectedAt).toLocaleDateString()}
              </div>
            )}
          </div>
          <Btn size="sm" variant="danger" onClick={disconnect} disabled={busy}>
            {busy ? 'Working…' : 'Disconnect'}
          </Btn>
        </>
      ) : (
        <>
          <div className="text-[11px] text-text2 mb-3">
            You'll be redirected to Google to grant calendar access.
          </div>
          <Btn size="sm" variant="primary" onClick={connect} disabled={busy}>
            {busy ? 'Redirecting…' : 'Connect Google Calendar'}
          </Btn>
        </>
      )}
    </Card>
  )
}