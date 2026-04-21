// import React, { useEffect, useRef, useState } from 'react'
// import { apiFetch, formatDate, formatCurrency } from '../../../utils/api.js'
// import { Badge, Card, CardHeader, PageHeader, FilterBar, TableWrap, TblAction, Btn, Loading, Modal, FormGroup, Input, Select, Textarea } from '../../ui/index.jsx'
// import { showToast } from '../../ui/index.jsx'
// import GoogleSyncRowAction from '../../ui/GoogleSyncRowAction.jsx'
// import { useApp } from '../../../AppContext.jsx'

// // ─── OCCASIONS ─────────────────────────────────────────────────────────────────
// const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
// const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
// const WEEKDAYS_FULL  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
// const WEEKDAYS_SHORT = ['Su','Mo','Tu','We','Th','Fr','Sa']
// const WEEKDAYS_MIN   = ['S','M','T','W','T','F','S']

// const EVENT_EMOJI = { birthday: '🎂', anniversary: '🎊', holiday: '🎉', custom: '📅' }

// function isoYMD(d) {
//   const y  = d.getFullYear()
//   const mo = String(d.getMonth() + 1).padStart(2, '0')
//   const da = String(d.getDate()).padStart(2, '0')
//   return `${y}-${mo}-${da}`
// }

// const EMPTY_OCC_FORM = { type: 'birthday', title: '', corporate: '', date: '', notes: '' }

// export function OccasionsPage() {
//   const [currentMonth, setCurrentMonth] = useState(new Date())
//   const [occasions, setOccasions]       = useState([])
//   const [loading, setLoading]           = useState(false)
//   const [showAdd, setShowAdd]           = useState(false)
//   const [occForm, setOccForm]           = useState(EMPTY_OCC_FORM)
//   const [occFormError, setOccFormError] = useState('')
//   const [occSaving, setOccSaving]       = useState(false)
//   const [corpList, setCorpList]         = useState([])
//   const [pickerOpen, setPickerOpen]     = useState(false)
//   const [pickerYear, setPickerYear]     = useState(new Date().getFullYear())
//   const pickerRef = useRef(null)
//   const calendarRef = useRef(null)

//   const year         = currentMonth.getFullYear()
//   const month        = currentMonth.getMonth()
//   const firstDay     = new Date(year, month, 1).getDay()
//   const daysInMonth  = new Date(year, month + 1, 0).getDate()
//   const prevLastDate = new Date(year, month, 0).getDate()
//   const leadingCount  = firstDay
//   const trailingCount = (7 - ((leadingCount + daysInMonth) % 7)) % 7

//   const today = new Date()
//   const isCurrentMonth = year === today.getFullYear() && month === today.getMonth()

//   // ── Data fetch on month change ───────────────────────────────────────────
//   async function loadOccasions(signal) {
//     setLoading(true)
//     const from = isoYMD(new Date(year, month, 1))
//     const to   = isoYMD(new Date(year, month + 1, 0))
//     try {
//       const res = await apiFetch('GET', `/admin/occasions?from=${from}&to=${to}&limit=200`)
//       if (!signal?.aborted) setOccasions(res.data?.occasions || [])
//     } catch (err) {
//       if (!signal?.aborted) {
//         setOccasions([])
//         showToast(err.message || 'Failed to load occasions.', 'error')
//       }
//     } finally {
//       if (!signal?.aborted) setLoading(false)
//     }
//   }

//   useEffect(() => {
//     const ctrl = { aborted: false }
//     loadOccasions(ctrl)
//     return () => { ctrl.aborted = true }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [year, month])

//   // Load corporate list once for the Add Occasion form dropdown
//   useEffect(() => {
//     apiFetch('GET', '/admin/corporates?limit=200')
//       .then(res => setCorpList(res.data?.corporates || []))
//       .catch(() => setCorpList([]))
//   }, [])

//   // ── Map occasions by day-of-month ────────────────────────────────────────
//   const eventMap = {}
//   for (const occ of occasions) {
//     const d = new Date(occ.date)
//     if (d.getFullYear() === year && d.getMonth() === month) {
//       const day = d.getDate()
//       ;(eventMap[day] = eventMap[day] || []).push(occ)
//     }
//   }

//   // ── Upcoming list: occasions on or after today, sorted ──────────────────
//   const upcoming = [...occasions]
//     .filter(o => new Date(o.date) >= new Date(today.toDateString()))
//     .sort((a, b) => new Date(a.date) - new Date(b.date))
//     .slice(0, 6)

//   // ── Navigation helpers ──────────────────────────────────────────────────
//   const goPrev  = () => setCurrentMonth(new Date(year, month - 1, 1))
//   const goNext  = () => setCurrentMonth(new Date(year, month + 1, 1))
//   const goToday = () => setCurrentMonth(new Date())

//   // ── Keyboard: Left/Right/T on the focused calendar wrapper ──────────────
//   function handleKeyDown(e) {
//     if (showAdd || pickerOpen) return
//     if (e.target && e.target.tagName === 'INPUT') return
//     if (e.key === 'ArrowLeft')       { e.preventDefault(); goPrev() }
//     else if (e.key === 'ArrowRight') { e.preventDefault(); goNext() }
//     else if (e.key === 't' || e.key === 'T') { e.preventDefault(); goToday() }
//   }

//   // ── Month/year picker: open via title click, close on outside click ─────
//   function openPicker() {
//     setPickerYear(year)
//     setPickerOpen(true)
//   }
//   useEffect(() => {
//     if (!pickerOpen) return
//     function onDocMouseDown(e) {
//       if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false)
//     }
//     function onEsc(e) { if (e.key === 'Escape') setPickerOpen(false) }
//     document.addEventListener('mousedown', onDocMouseDown)
//     document.addEventListener('keydown', onEsc)
//     return () => {
//       document.removeEventListener('mousedown', onDocMouseDown)
//       document.removeEventListener('keydown', onEsc)
//     }
//   }, [pickerOpen])

//   function pickMonth(idx) {
//     setCurrentMonth(new Date(pickerYear, idx, 1))
//     setPickerOpen(false)
//   }

//   return (
//     <div>
//       <PageHeader title="Occasions & Calendar" subtitle="Track birthdays, anniversaries, and events">
//         <Btn variant="primary" onClick={() => setShowAdd(true)}>+ Add Occasion</Btn>
//       </PageHeader>

//       <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
//         <Card>
//           <div
//             ref={calendarRef}
//             tabIndex={0}
//             role="grid"
//             aria-label={`Calendar for ${MONTH_NAMES[month]} ${year}`}
//             onKeyDown={handleKeyDown}
//             className="outline-none focus:ring-1 focus:ring-accent rounded"
//           >
//             {/* Header row: prev / title-picker / next / today */}
//             <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
//               <div className="flex items-center gap-2">
//                 <Btn size="sm" onClick={goPrev} title="Previous month" aria-label="Previous month">‹</Btn>

//                 <div className="relative" ref={pickerRef}>
//                   <button
//                     type="button"
//                     onClick={() => (pickerOpen ? setPickerOpen(false) : openPicker())}
//                     aria-haspopup="dialog"
//                     aria-expanded={pickerOpen}
//                     title="Pick a month or year"
//                     className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-border2 bg-surface text-text1 font-semibold text-sm cursor-pointer hover:bg-surface2 hover:text-accent transition-colors"
//                   >
//                     <span>{MONTH_NAMES[month]} {year}</span>
//                     <span className="text-[10px] text-text3">▾</span>
//                   </button>
//                   {pickerOpen && (
//                     <div className="absolute left-0 top-full mt-1 z-30 bg-surface border border-border rounded-lg shadow-lg p-3 w-64" role="dialog" aria-label="Month and year picker">
//                       <div className="flex items-center justify-between mb-2">
//                         <button
//                           type="button"
//                           onClick={() => setPickerYear(y => y - 1)}
//                           title="Previous year"
//                           aria-label="Previous year"
//                           className="w-7 h-7 rounded border border-border2 bg-surface text-text2 hover:bg-surface2 hover:text-text1 cursor-pointer text-xs flex items-center justify-center"
//                         >◂</button>
//                         <span className="font-semibold text-sm">{pickerYear}</span>
//                         <button
//                           type="button"
//                           onClick={() => setPickerYear(y => y + 1)}
//                           title="Next year"
//                           aria-label="Next year"
//                           className="w-7 h-7 rounded border border-border2 bg-surface text-text2 hover:bg-surface2 hover:text-text1 cursor-pointer text-xs flex items-center justify-center"
//                         >▸</button>
//                       </div>
//                       <div className="grid grid-cols-3 gap-1.5">
//                         {MONTH_SHORT.map((m, i) => {
//                           const selected = pickerYear === year && i === month
//                           return (
//                             <button
//                               key={m}
//                               type="button"
//                               onClick={() => pickMonth(i)}
//                               title={`${MONTH_NAMES[i]} ${pickerYear}`}
//                               className={`py-1.5 text-xs rounded cursor-pointer transition-colors border
//                                 ${selected
//                                   ? 'bg-accent text-white border-accent'
//                                   : 'bg-surface border-border2 text-text1 hover:bg-surface2 hover:border-accent'}`}
//                             >
//                               {m}
//                             </button>
//                           )
//                         })}
//                       </div>
//                     </div>
//                   )}
//                 </div>

//                 <Btn size="sm" onClick={goNext} title="Next month" aria-label="Next month">›</Btn>
//               </div>
//               <Btn size="sm" onClick={goToday} title="Jump to today">Today</Btn>
//             </div>

//             {/* Weekday header */}
//             <div className="grid grid-cols-7 gap-1 min-w-[280px]">
//               {WEEKDAYS_SHORT.map((d, i) => (
//                 <div key={d + i} className="text-center text-[11px] font-medium text-text2 py-1.5" role="columnheader" aria-label={WEEKDAYS_FULL[i]}>
//                   <span className="hidden md:inline">{d}</span>
//                   <span className="md:hidden">{WEEKDAYS_MIN[i]}</span>
//                 </div>
//               ))}

//               {/* Leading days from previous month (faded) */}
//               {Array.from({ length: leadingCount }, (_, i) => {
//                 const dayNum = prevLastDate - leadingCount + i + 1
//                 return (
//                   <div
//                     key={`lead-${i}`}
//                     role="gridcell"
//                     aria-disabled="true"
//                     className="min-h-[44px] sm:aspect-square sm:min-h-0 rounded flex flex-col items-center justify-center text-[12px] text-text3 opacity-40 select-none"
//                   >
//                     {dayNum}
//                   </div>
//                 )
//               })}

//               {/* Days of the current month */}
//               {Array.from({ length: daysInMonth }, (_, i) => {
//                 const day = i + 1
//                 const evs = eventMap[day] || []
//                 const isToday = isCurrentMonth && day === today.getDate()
//                 const date = new Date(year, month, day)
//                 const tooltip = evs.length
//                   ? `${evs.length} occasion${evs.length > 1 ? 's' : ''} on ${isoYMD(date)}`
//                   : `Add occasion on ${isoYMD(date)}`

//                 return (
//                   <button
//                     key={day}
//                     type="button"
//                     role="gridcell"
//                     onClick={() => setShowAdd(true)}
//                     title={tooltip}
//                     aria-label={tooltip}
//                     className={`relative min-h-[44px] sm:aspect-square sm:min-h-0 rounded flex flex-col items-center justify-center cursor-pointer text-[12px] border transition-all outline-none
//                       focus:ring-1 focus:ring-accent focus:z-10
//                       ${isToday
//                         ? 'bg-accent-light text-accent font-semibold border-accent'
//                         : 'border-transparent hover:bg-surface2 hover:border-border2'}`}
//                   >
//                     <span>{day}</span>
//                     {evs.length > 0 && (
//                       <span className="mt-0.5 flex items-center gap-0.5" aria-hidden="true">
//                         {evs.slice(0, 3).map((_, j) => (
//                           <span key={j} className="w-1 h-1 rounded-full bg-accent" />
//                         ))}
//                         {evs.length > 3 && <span className="text-[9px] text-accent leading-none">+</span>}
//                       </span>
//                     )}
//                   </button>
//                 )
//               })}

//               {/* Trailing days from next month (faded) */}
//               {Array.from({ length: trailingCount }, (_, i) => (
//                 <div
//                   key={`trail-${i}`}
//                   role="gridcell"
//                   aria-disabled="true"
//                   className="min-h-[44px] sm:aspect-square sm:min-h-0 rounded flex flex-col items-center justify-center text-[12px] text-text3 opacity-40 select-none"
//                 >
//                   {i + 1}
//                 </div>
//               ))}
//             </div>

//             {loading && <div className="text-[11px] text-text3 mt-3 text-center">Loading…</div>}
//           </div>
//         </Card>

//         <Card>
//           <CardHeader title="Upcoming Occasions" />
//           {upcoming.length === 0 ? (
//             <div className="text-text2 text-sm py-6 text-center">No records found.</div>
//           ) : (
//             <div className="flex flex-col gap-0">
//               {upcoming.map((e, i, arr) => {
//                 const d = new Date(e.date)
//                 return (
//                   <div key={e._id || i} className="flex items-start gap-3 pb-4 relative">
//                     {i < arr.length - 1 && <div className="absolute left-[14px] top-7 bottom-0 w-px bg-border" />}
//                     <div className="w-7 h-7 rounded-full bg-accent-light border-2 border-accent flex items-center justify-center text-[11px] z-10">
//                       {EVENT_EMOJI[e.type] || '📅'}
//                     </div>
//                     <div className="flex-1 pt-0.5 min-w-0">
//                       <div className="text-[13px] font-medium truncate">{e.title}</div>
//                       <div className="text-[11px] text-text2 mt-0.5">
//                         {MONTH_NAMES[d.getMonth()]} {d.getDate()}, {d.getFullYear()}
//                         {e.corporate?.companyName ? ` · ${e.corporate.companyName}` : ''}
//                       </div>
//                       <GoogleSyncRowAction
//                         occasion={e}
//                         basePath="/admin/occasions"
//                         onSynced={(patch) => setOccasions(list => list.map(o => o._id === e._id ? { ...o, ...patch } : o))}
//                       />
//                     </div>
//                     <Badge status={e.type === 'birthday' ? 'assigned' : e.type === 'anniversary' ? 'processing' : 'new'} />
//                   </div>
//                 )
//               })}
//             </div>
//           )}
//         </Card>
//       </div>

//       {showAdd && (
//         <Modal
//           title="Add Occasion"
//           onClose={() => { setShowAdd(false); setOccForm(EMPTY_OCC_FORM); setOccFormError('') }}
//           actions={[
//             {
//               label: occSaving ? 'Adding…' : 'Add',
//               primary: true,
//               disabled: occSaving,
//               onClick: async () => {
//                 if (!occForm.type) { setOccFormError('Type is required.'); return }
//                 if (!occForm.title) { setOccFormError('Title is required.'); return }
//                 if (!occForm.corporate) { setOccFormError('Corporate is required.'); return }
//                 if (!occForm.date) { setOccFormError('Date is required.'); return }
//                 setOccSaving(true); setOccFormError('')
//                 try {
//                   await apiFetch('POST', '/admin/occasions', {
//                     type: occForm.type,
//                     title: occForm.title,
//                     corporate: occForm.corporate || undefined,
//                     date: occForm.date,
//                     notes: occForm.notes || undefined,
//                     business: undefined,
//                   })
//                   showToast('Occasion added.')
//                   setShowAdd(false)
//                   setOccForm(EMPTY_OCC_FORM)
//                   setOccFormError('')
//                   // Immediately reload so upcoming panel reflects the new entry
//                   const ctrl = { aborted: false }
//                   await loadOccasions(ctrl)
//                 } catch (err) {
//                   setOccFormError(err.message || 'Could not add occasion.')
//                 } finally {
//                   setOccSaving(false)
//                 }
//               },
//             },
//             { label: 'Cancel', onClick: () => { setShowAdd(false); setOccForm(EMPTY_OCC_FORM); setOccFormError('') } },
//           ]}
//         >
//           {occFormError && (
//             <div className="mb-3 p-2.5 rounded border border-red-200 bg-red-50 text-red-700 text-[12px]">{occFormError}</div>
//           )}
//           <FormGroup label="Occasion Type">
//             <Select value={occForm.type} onChange={e => setOccForm(f => ({ ...f, type: e.target.value }))}>
//               <option value="birthday">Birthday</option>
//               <option value="anniversary">Anniversary</option>
//               <option value="holiday">Holiday</option>
//               <option value="custom">Other</option>
//             </Select>
//           </FormGroup>
//           <FormGroup label="Title">
//             <Input
//               placeholder="e.g. Ram's Birthday"
//               value={occForm.title}
//               onChange={e => setOccForm(f => ({ ...f, title: e.target.value }))}
//             />
//           </FormGroup>
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             <FormGroup label="Corporate">
//               <Select value={occForm.corporate} onChange={e => setOccForm(f => ({ ...f, corporate: e.target.value }))}>
//                 <option value="">— Select corporate —</option>
//                 {corpList.map(c => (
//                   <option key={c._id} value={c._id}>{c.companyName}</option>
//                 ))}
//               </Select>
//             </FormGroup>
//             <FormGroup label="Date">
//               <Input
//                 type="date"
//                 value={occForm.date}
//                 onChange={e => setOccForm(f => ({ ...f, date: e.target.value }))}
//               />
//             </FormGroup>
//           </div>
//           <FormGroup label="Notes">
//             <Textarea
//               placeholder="Optional notes…"
//               value={occForm.notes}
//               onChange={e => setOccForm(f => ({ ...f, notes: e.target.value }))}
//             />
//           </FormGroup>
//         </Modal>
//       )}
//     </div>
//   )
// }

// // ─── FEEDBACK ──────────────────────────────────────────────────────────────────
// export function FeedbackPage() {
//   const [feedbacks, setFeedbacks] = useState([])
//   const [loading, setLoading]     = useState(true)

//   useEffect(() => {
//     apiFetch('GET', '/admin/feedback').then(res => {
//       setFeedbacks(res.data?.feedbacks || [])
//       setLoading(false)
//     })
//   }, [])

//   const avg = feedbacks.length ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1) : '0.0'

//   if (loading) return <Loading />
//   return (
//     <div>
//       <PageHeader title="Feedback & Ratings" />
//       <div className="grid grid-cols-3 gap-4 mb-5">
//         <div className="bg-surface border border-border rounded-lg p-4"><div className="text-xs text-text2 mb-1.5">Average Rating</div><div className="text-[22px] font-semibold">⭐ {avg}/5</div></div>
//         <div className="bg-surface border border-border rounded-lg p-4"><div className="text-xs text-text2 mb-1.5">Total Reviews</div><div className="text-[22px] font-semibold">{feedbacks.length}</div></div>
//         <div className="bg-surface border border-border rounded-lg p-4"><div className="text-xs text-text2 mb-1.5">5-Star Reviews</div><div className="text-[22px] font-semibold">{feedbacks.filter(f => f.rating === 5).length}</div></div>
//       </div>
//       <div className="flex flex-col gap-3">
//         {feedbacks.map(f => (
//           <Card key={f._id} className="py-3 px-4">
//             <div className="flex items-start justify-between mb-2">
//               <div>
//                 <div className="font-medium text-[14px]">{f.corporate?.companyName || f.createdBy?.name || 'Anonymous'}</div>
//                 <div className="text-[11px] text-text2">Order: {f.order?.orderNumber || '—'} · {formatDate(f.createdAt)}</div>
//               </div>
//               <div className="text-lg">{'⭐'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</div>
//             </div>
//             <div className="text-[13px] text-text2">{f.comment}</div>
//           </Card>
//         ))}
//       </div>
//     </div>
//   )
// }

// // ─── DISCOUNTS ─────────────────────────────────────────────────────────────────
// const EMPTY_DISCOUNT_FORM = {
//   code: '', description: '', type: 'percentage', value: '',
//   minOrderAmount: '', usageLimit: '', validUntil: '',
// }

// function toDateInputValue(iso) {
//   if (!iso) return ''
//   const d = new Date(iso)
//   if (Number.isNaN(d.getTime())) return ''
//   const y  = d.getFullYear()
//   const mo = String(d.getMonth() + 1).padStart(2, '0')
//   const da = String(d.getDate()).padStart(2, '0')
//   return `${y}-${mo}-${da}`
// }

// function discountDisplayStatus(d) {
//   if (d.isActive === false) return 'inactive'
//   if (d.validUntil && new Date(d.validUntil) < new Date()) return 'expired'
//   return 'active'
// }

// export function DiscountsPage() {
//   const [discounts, setDiscounts] = useState([])
//   const [loading, setLoading]     = useState(true)
//   const [editing, setEditing]     = useState(null)   // null | discount object being edited
//   const [showForm, setShowForm]   = useState(false)
//   const [form, setForm]           = useState(EMPTY_DISCOUNT_FORM)
//   const [formError, setFormError] = useState('')
//   const [saving, setSaving]       = useState(false)
//   const [confirmDel, setConfirmDel] = useState(null) // null | discount to delete
//   const [deleting, setDeleting]   = useState(false)

//   async function loadDiscounts() {
//     try {
//       const res = await apiFetch('GET', '/admin/discounts')
//       setDiscounts(res.data?.discounts || [])
//     } catch (err) {
//       showToast(err.message || 'Failed to load discounts.', 'error')
//       setDiscounts([])
//     } finally {
//       setLoading(false)
//     }
//   }

//   useEffect(() => { loadDiscounts() }, [])

//   function openCreate() {
//     setEditing(null)
//     setForm(EMPTY_DISCOUNT_FORM)
//     setFormError('')
//     setShowForm(true)
//   }
//   function openEdit(d) {
//     setEditing(d)
//     setForm({
//       code: d.code || '',
//       description: d.description || '',
//       type: d.type || 'percentage',
//       value: d.value ?? '',
//       minOrderAmount: d.minOrderAmount ?? '',
//       usageLimit: d.usageLimit ?? '',
//       validUntil: toDateInputValue(d.validUntil),
//     })
//     setFormError('')
//     setShowForm(true)
//   }

//   // Flip the coupon between active and inactive without opening the modal.
//   // The table status column will re-derive via discountDisplayStatus — so an
//   // expired coupon's pill stays "expired" even after activating.
//   async function toggleActive(d) {
//     const nextIsActive = !(d.isActive !== false)   // treat undefined as active
//     try {
//       await apiFetch('PUT', `/admin/discounts/${d._id}`, { isActive: nextIsActive })
//       setDiscounts(ds => ds.map(x => x._id === d._id ? { ...x, isActive: nextIsActive } : x))
//       showToast(nextIsActive ? 'Coupon activated.' : 'Coupon deactivated.')
//     } catch (err) {
//       showToast(err.message || 'Could not update coupon.', 'error')
//     }
//   }
//   function closeForm() {
//     setShowForm(false)
//     setEditing(null)
//     setForm(EMPTY_DISCOUNT_FORM)
//     setFormError('')
//     setSaving(false)
//   }

//   async function submitForm() {
//     if (!form.code.trim())       { setFormError('Coupon code is required.'); return }
//     if (!form.type)              { setFormError('Type is required.'); return }
//     if (form.value === '' || Number.isNaN(Number(form.value)) || Number(form.value) <= 0) {
//       setFormError('Discount value must be a positive number.'); return
//     }
//     if (!form.validUntil)        { setFormError('Expiry date is required.'); return }

//     const payload = {
//       code: form.code.trim().toUpperCase(),
//       description: form.description.trim() || undefined,
//       type: form.type,
//       value: Number(form.value),
//       minOrderAmount: form.minOrderAmount === '' ? 0 : Number(form.minOrderAmount),
//       usageLimit: form.usageLimit === '' ? undefined : Number(form.usageLimit),
//       validUntil: new Date(form.validUntil).toISOString(),
//     }
//     if (!editing) payload.validFrom = new Date().toISOString()

//     setSaving(true)
//     setFormError('')
//     try {
//       if (editing) {
//         await apiFetch('PUT', `/admin/discounts/${editing._id}`, payload)
//         showToast('Discount updated.')
//       } else {
//         await apiFetch('POST', '/admin/discounts', payload)
//         showToast('Discount created.')
//       }
//       await loadDiscounts()
//       closeForm()
//     } catch (err) {
//       setFormError(err.message || 'Could not save discount.')
//       setSaving(false)
//     }
//   }

//   async function confirmDelete() {
//     if (!confirmDel) return
//     setDeleting(true)
//     try {
//       await apiFetch('DELETE', `/admin/discounts/${confirmDel._id}`)
//       setDiscounts(prev => prev.filter(d => d._id !== confirmDel._id))
//       showToast('Discount deleted.')
//       setConfirmDel(null)
//     } catch (err) {
//       showToast(err.message || 'Could not delete discount.', 'error')
//     } finally {
//       setDeleting(false)
//     }
//   }

//   if (loading) return <Loading />

//   return (
//     <div>
//       <PageHeader title="Discounts & Promotions">
//         <Btn variant="primary" onClick={openCreate}>+ Create Discount</Btn>
//       </PageHeader>
//       <Card noPad>
//         <TableWrap>
//           <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Min Order</th><th>Usage</th><th>Expiry</th><th>Status</th><th>Actions</th></tr></thead>
//           <tbody>
//             {discounts.length === 0 ? (
//               <tr><td colSpan={8} className="text-center py-10 text-text2 text-sm">No discounts yet. Create one to get started.</td></tr>
//             ) : discounts.map(d => {
//               const displayStatus = discountDisplayStatus(d)
//               const isInactive = d.isActive === false
//               const isExpired = displayStatus === 'expired'
//               return (
//                 <tr key={d._id} className={isInactive || isExpired ? 'opacity-60' : ''}>
//                   <td>
//                     <span className="bg-accent-light text-accent font-mono font-semibold px-2 py-0.5 rounded text-[12px]">{d.code}</span>
//                     {d.description && <div className="text-[11px] text-text2 mt-0.5 max-w-[220px] truncate">{d.description}</div>}
//                   </td>
//                   <td>{d.type}</td>
//                   <td>{d.type === 'percentage' ? `${d.value}%` : formatCurrency(d.value)}</td>
//                   <td>{formatCurrency(d.minOrderAmount || 0)}</td>
//                   <td>{(d.usedCount || 0)}/{d.usageLimit ?? '∞'}</td>
//                   <td>{formatDate(d.validUntil)}</td>
//                   <td><Badge status={displayStatus} /></td>
//                   <td>
//                     <div className="flex gap-1.5">
//                       <TblAction onClick={() => openEdit(d)}>Edit</TblAction>
//                       <TblAction
//                         onClick={() => toggleActive(d)}
//                         title={isExpired && isInactive ? 'Coupon is also past its expiry date — edit the expiry before use.' : undefined}
//                       >
//                         {isInactive ? 'Activate' : 'Deactivate'}
//                       </TblAction>
//                       <TblAction variant="danger" onClick={() => setConfirmDel(d)}>Delete</TblAction>
//                     </div>
//                   </td>
//                 </tr>
//               )
//             })}
//           </tbody>
//         </TableWrap>
//       </Card>

//       {showForm && (
//         <Modal
//           title={editing ? 'Edit Discount' : 'Create Discount'}
//           onClose={closeForm}
//           actions={[
//             { label: saving ? 'Saving…' : (editing ? 'Save' : 'Create'), primary: true, onClick: submitForm, disabled: saving },
//             { label: 'Cancel', onClick: closeForm },
//           ]}
//         >
//           {formError && (
//             <div className="mb-3 p-2.5 rounded border border-red-200 bg-red-50 text-red-700 text-[12px]">{formError}</div>
//           )}
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             <FormGroup label="Coupon Code">
//               <Input placeholder="SAVE20" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
//             </FormGroup>
//             <FormGroup label="Type">
//               <Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
//                 <option value="percentage">Percentage</option>
//                 <option value="fixed">Fixed Amount</option>
//               </Select>
//             </FormGroup>
//             <FormGroup label="Discount Value">
//               <Input type="number" placeholder="20" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
//             </FormGroup>
//             <FormGroup label="Minimum Order">
//               <Input type="number" placeholder="0" value={form.minOrderAmount} onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))} />
//             </FormGroup>
//             <FormGroup label="Max Uses" hint="Leave blank for unlimited.">
//               <Input type="number" placeholder="100" value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))} />
//             </FormGroup>
//             <FormGroup label="Expiry Date">
//               <Input type="date" value={form.validUntil} onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))} />
//             </FormGroup>
//           </div>
//           <FormGroup label="Description" hint="Shown to corporate users when they view available coupons.">
//             <Input
//               placeholder="e.g. 20% off for Diwali orders"
//               value={form.description}
//               onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
//             />
//           </FormGroup>
//         </Modal>
//       )}

//       {confirmDel && (
//         <Modal
//           title="Delete Discount"
//           onClose={() => !deleting && setConfirmDel(null)}
//           actions={[
//             { label: deleting ? 'Deleting…' : 'Delete', primary: true, onClick: confirmDelete, disabled: deleting },
//             { label: 'Cancel', onClick: () => setConfirmDel(null) },
//           ]}
//         >
//           <div className="text-[13px] text-text1">
//             Delete discount <span className="font-mono font-semibold">{confirmDel.code}</span>? This cannot be undone.
//           </div>
//         </Modal>
//       )}
//     </div>
//   )
// }

// // ─── TICKETS ──────────────────────────────────────────────────────────────────
// const ADMIN_TKT_STATUS_OPTIONS = [
//   { value: 'open',        label: 'Open' },
//   { value: 'in_progress', label: 'In Progress' },
//   { value: 'resolved',    label: 'Resolved' },
//   { value: 'closed',      label: 'Closed' },
// ]
// const ADMIN_TKT_PRIORITY_BADGE = { low: 'new', medium: 'processing', high: 'overdue', urgent: 'failed' }

// export function TicketsPage() {
//   const [tickets, setTickets] = useState([])
//   const [loading, setLoading] = useState(true)
//   const [detail, setDetail]   = useState(null)          // { ticket, comments } | null
//   const [detailLoading, setDetailLoading] = useState(false)
//   const [statusDraft, setStatusDraft] = useState('')
//   const [savingStatus, setSavingStatus] = useState(false)
//   const [replyText, setReplyText] = useState('')
//   const [replyInternal, setReplyInternal] = useState(false)
//   const [posting, setPosting] = useState(false)
//   const [replyError, setReplyError] = useState('')

//   async function loadTickets() {
//     try {
//       const res = await apiFetch('GET', '/admin/tickets')
//       setTickets(res.data?.tickets || [])
//     } catch (err) {
//       showToast(err.message || 'Failed to load tickets.', 'error')
//       setTickets([])
//     } finally {
//       setLoading(false)
//     }
//   }
//   useEffect(() => { loadTickets() }, [])

//   const counts = {
//     open:       tickets.filter(t => t.status === 'open').length,
//     inProgress: tickets.filter(t => t.status === 'in_progress').length,
//     resolved:   tickets.filter(t => t.status === 'resolved').length,
//   }

//   async function openDetail(t) {
//     setDetail({ ticket: t, comments: [] })
//     setStatusDraft(t.status)
//     setReplyText('')
//     setReplyInternal(false)
//     setReplyError('')
//     setDetailLoading(true)
//     try {
//       const res = await apiFetch('GET', `/admin/tickets/${t._id}`)
//       setDetail({ ticket: res.data?.ticket || t, comments: res.data?.comments || [] })
//     } catch (err) {
//       showToast(err.message || 'Could not load ticket.', 'error')
//       setDetail(null)
//     } finally {
//       setDetailLoading(false)
//     }
//   }
//   function closeDetail() {
//     setDetail(null)
//     setStatusDraft('')
//     setReplyText('')
//     setReplyInternal(false)
//     setReplyError('')
//     setPosting(false)
//     setSavingStatus(false)
//   }

//   async function saveStatus() {
//     if (!detail || statusDraft === detail.ticket.status) return
//     setSavingStatus(true)
//     try {
//       const res = await apiFetch('PATCH', `/admin/tickets/${detail.ticket._id}/status`, { status: statusDraft })
//       const updated = res.data?.ticket
//       setDetail(d => ({ ...d, ticket: updated || { ...d.ticket, status: statusDraft } }))
//       setTickets(prev => prev.map(t => t._id === detail.ticket._id ? { ...t, status: statusDraft } : t))
//       showToast('Status updated.')
//     } catch (err) {
//       showToast(err.message || 'Could not update status.', 'error')
//       setStatusDraft(detail.ticket.status)
//     } finally {
//       setSavingStatus(false)
//     }
//   }

//   async function postReply() {
//     if (!replyText.trim()) { setReplyError('Message is required.'); return }
//     if (!detail) return
//     setPosting(true)
//     setReplyError('')
//     try {
//       const res = await apiFetch('POST', `/admin/tickets/${detail.ticket._id}/reply`, { message: replyText.trim(), isInternal: replyInternal })
//       setDetail(d => ({ ...d, comments: [...d.comments, res.data.comment] }))
//       setReplyText('')
//       setReplyInternal(false)
//     } catch (err) {
//       setReplyError(err.message || 'Could not post reply.')
//     } finally {
//       setPosting(false)
//     }
//   }

//   if (loading) return <Loading />
//   return (
//     <div>
//       <PageHeader title="Support Tickets" />
//       <div className="grid grid-cols-3 gap-4 mb-5">
//         {[
//           ['Open',        counts.open,       'bg-blue-50 text-blue-800'],
//           ['In Progress', counts.inProgress, 'bg-amber-50 text-amber-800'],
//           ['Resolved',    counts.resolved,   'bg-green-50 text-green-800'],
//         ].map(([label, n, tone]) => (
//           <div key={label} className="bg-surface border border-border rounded-lg p-4">
//             <div className="flex items-center justify-between">
//               <div className="text-xs text-text2">{label}</div>
//               <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${tone}`}>{n}</span>
//             </div>
//             <div className="text-[22px] font-semibold mt-1.5">{n}</div>
//           </div>
//         ))}
//       </div>

//       <Card noPad>
//         <TableWrap>
//           <thead><tr><th>Ticket</th><th>Subject</th><th>Corporate</th><th>Category</th><th>Priority</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
//           <tbody>
//             {tickets.length === 0 ? (
//               <tr><td colSpan={8} className="text-center py-10 text-text2 text-sm">No records found.</td></tr>
//             ) : tickets.map(t => (
//               <tr key={t._id}>
//                 <td data-label="Ticket"><span className="font-mono text-[12px] text-text3">{t.ticketNumber || '—'}</span></td>
//                 <td data-label="Subject" className="font-medium">{t.subject}</td>
//                 <td data-label="Corporate">{t.corporate?.companyName || '—'}</td>
//                 <td data-label="Category">{t.category}</td>
//                 <td data-label="Priority"><Badge status={ADMIN_TKT_PRIORITY_BADGE[t.priority] || 'new'} /></td>
//                 <td data-label="Status"><Badge status={t.status} /></td>
//                 <td data-label="Created">{formatDate(t.createdAt)}</td>
//                 <td data-label="Actions"><TblAction onClick={() => openDetail(t)}>View</TblAction></td>
//               </tr>
//             ))}
//           </tbody>
//         </TableWrap>
//       </Card>

//       {detail && (
//         <Modal
//           title={`${detail.ticket.ticketNumber || 'Ticket'} · ${detail.ticket.subject}`}
//           onClose={closeDetail}
//           size="lg"
//           actions={[{ label: 'Close', onClick: closeDetail }]}
//         >
//           <div className="flex flex-wrap gap-2 mb-3 text-[11px]">
//             <Badge status={detail.ticket.status} />
//             <Badge status={ADMIN_TKT_PRIORITY_BADGE[detail.ticket.priority] || 'new'} />
//             <span className="px-2 py-0.5 rounded-full bg-surface2 border border-border text-text2">{detail.ticket.category}</span>
//             {detail.ticket.corporate?.companyName && <span className="text-text2">· {detail.ticket.corporate.companyName}</span>}
//             <span className="text-text2">· {formatDate(detail.ticket.createdAt)}</span>
//           </div>
//           <div className="mb-4 p-3 rounded border border-border bg-surface2 text-[13px] whitespace-pre-wrap">{detail.ticket.description}</div>

//           <div className="mb-4 flex items-end gap-2">
//             <div className="flex-1">
//               <label className="block text-xs font-medium text-text2 mb-1.5">Status</label>
//               <Select value={statusDraft} onChange={e => setStatusDraft(e.target.value)}>
//                 {ADMIN_TKT_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
//               </Select>
//             </div>
//             <Btn variant="primary" onClick={saveStatus} disabled={savingStatus || statusDraft === detail.ticket.status}>
//               {savingStatus ? 'Saving…' : 'Update'}
//             </Btn>
//           </div>

//           <div className="text-xs font-medium text-text2 uppercase tracking-wider mb-2">Conversation</div>
//           {detailLoading ? (
//             <div className="text-[12px] text-text3 text-center py-4">Loading…</div>
//           ) : detail.comments.length === 0 ? (
//             <div className="text-[12px] text-text2 text-center py-4">No replies yet.</div>
//           ) : (
//             <div className="flex flex-col gap-2 mb-4 max-h-[240px] overflow-y-auto">
//               {detail.comments.map(c => (
//                 <div key={c._id} className={`p-2.5 rounded text-[12px] ${c.isInternal ? 'bg-amber-50 border border-amber-200' : 'bg-surface2'}`}>
//                   <div className="flex items-center justify-between mb-1">
//                     <span className="font-medium">
//                       {c.author?.name || 'Support'}
//                       {c.isInternal && <span className="ml-1.5 text-[10px] text-amber-700">internal</span>}
//                     </span>
//                     <span className="text-text3 text-[11px]">{formatDate(c.createdAt)}</span>
//                   </div>
//                   <div className="whitespace-pre-wrap">{c.message}</div>
//                 </div>
//               ))}
//             </div>
//           )}

//           {replyError && (
//             <div className="mb-2 p-2 rounded border border-red-200 bg-red-50 text-red-700 text-[11px]">{replyError}</div>
//           )}
//           <FormGroup label="Reply">
//             <Textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Type your reply…" />
//           </FormGroup>
//           <div className="flex items-center justify-between">
//             <label className="flex items-center gap-1.5 text-[12px] text-text2 cursor-pointer">
//               <input type="checkbox" checked={replyInternal} onChange={e => setReplyInternal(e.target.checked)} />
//               Internal note (not visible to corporate)
//             </label>
//             <Btn variant="primary" onClick={postReply} disabled={posting}>{posting ? 'Posting…' : 'Post Reply'}</Btn>
//           </div>
//         </Modal>
//       )}
//     </div>
//   )
// }

// // ─── INVENTORY ─────────────────────────────────────────────────────────────────
// export function InventoryPage() {
//   const [items, setItems]       = useState([])
//   const [loading, setLoading]   = useState(true)
//   const [showAdjust, setShowAdjust] = useState(false)

//   async function load() {
//     setLoading(true)
//     try {
//       const res = await apiFetch('GET', '/admin/inventory')
//       setItems(res.data?.items || [])
//     } catch (err) {
//       showToast(err.message || 'Failed to load inventory', 'error')
//     } finally { setLoading(false) }
//   }
//   useEffect(() => { load() }, [])

//   const lowStock   = items.filter(i => i.status === 'low_stock').length
//   const outOfStock = items.filter(i => i.status === 'out_of_stock').length

//   if (loading) return <Loading />

//   return (
//     <div>
//       <PageHeader title="Inventory Management" subtitle="Track stock levels and warehouse movement">
//         <Btn variant="primary" onClick={() => setShowAdjust(true)}>+ Adjust Stock</Btn>
//       </PageHeader>
//       <div className="grid grid-cols-4 gap-4 mb-5">
//         <div className="bg-surface border border-border rounded-lg p-4"><div className="text-xs text-text2 mb-1.5">Total Items</div><div className="text-[22px] font-semibold">{items.length}</div></div>
//         <div className="bg-surface border border-border rounded-lg p-4"><div className="text-xs text-text2 mb-1.5">Low Stock</div><div className="text-[22px] font-semibold text-amber-700">{lowStock}</div></div>
//         <div className="bg-surface border border-border rounded-lg p-4"><div className="text-xs text-text2 mb-1.5">Out of Stock</div><div className="text-[22px] font-semibold text-red-700">{outOfStock}</div></div>
//         <div className="bg-surface border border-border rounded-lg p-4"><div className="text-xs text-text2 mb-1.5">Total Units</div><div className="text-[22px] font-semibold">{items.reduce((s, i) => s + (i.stock || 0), 0)}</div></div>
//       </div>
//       {lowStock > 0 && (
//         <div className="bg-amber-50 border border-amber-200 rounded px-3.5 py-2.5 mb-4 text-[13px] text-amber-800">
//           ⚠️ {lowStock} products are running low on stock
//         </div>
//       )}
//       <Card noPad>
//         <TableWrap>
//           <thead><tr><th>Product</th><th>SKU</th><th>Stock</th><th>Alert Level</th><th>Warehouse</th><th>Status</th></tr></thead>
//           <tbody>
//             {items.map(item => (
//               <tr key={item._id}>
//                 <td className="font-medium">{item.name}</td>
//                 <td><span className="font-mono text-[12px]">{item.sku}</span></td>
//                 <td>
//                   <div className="flex items-center gap-2">
//                     <span className={`font-semibold ${item.stock === 0 ? 'text-red-700' : item.stock < (item.alertThreshold || 20) ? 'text-amber-700' : 'text-text1'}`}>{item.stock}</span>
//                     <div className="w-14 h-1.5 bg-surface2 rounded overflow-hidden">
//                       <div className={`h-full rounded ${item.stock < (item.alertThreshold || 20) ? 'bg-amber-400' : 'bg-accent'}`} style={{ width: `${Math.min(item.stock, 100)}%` }} />
//                     </div>
//                   </div>
//                 </td>
//                 <td>{item.alertThreshold}</td>
//                 <td>{item.warehouse}</td>
//                 <td><Badge status={item.status} /></td>
//               </tr>
//             ))}
//           </tbody>
//         </TableWrap>
//       </Card>
//       {showAdjust && (
//         <AdjustStockModal items={items} onClose={() => setShowAdjust(false)} onSave={() => { setShowAdjust(false); load() }} />
//       )}
//     </div>
//   )
// }

// function AdjustStockModal({ items, onClose, onSave }) {
//   const [form, setForm] = useState({ productId: items[0]?._id || '', type: 'in', quantity: 0, reason: '' })
//   const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
//   async function save() {
//     try {
//       await apiFetch('PATCH', `/admin/inventory/${form.productId}/adjust`, {
//         quantity: Number(form.quantity), type: form.type, reason: form.reason,
//       })
//       showToast('Inventory adjusted')
//       onSave()
//     } catch (err) { showToast(err.message || 'Adjust failed', 'error') }
//   }
//   return (
//     <Modal title="Adjust Stock" onClose={onClose}
//       actions={[{ label: 'Adjust', primary: true, onClick: save }, { label: 'Cancel', onClick: onClose }]}>
//       <FormGroup label="Product">
//         <Select value={form.productId} onChange={set('productId')}>
//           {items.map(i => <option key={i._id} value={i._id}>{i.name} (stock: {i.stock})</option>)}
//         </Select>
//       </FormGroup>
//       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//         <FormGroup label="Adjustment Type">
//           <Select value={form.type} onChange={set('type')}>
//             <option value="in">Add Stock</option>
//             <option value="out">Remove Stock</option>
//             <option value="adjustment">Set Exact (signed delta)</option>
//           </Select>
//         </FormGroup>
//         <FormGroup label="Quantity"><Input type="number" value={form.quantity} onChange={set('quantity')} /></FormGroup>
//       </div>
//       <FormGroup label="Reason"><Textarea value={form.reason} onChange={set('reason')} placeholder="e.g. Purchase, Return, Damaged, Audit Correction" /></FormGroup>
//     </Modal>
//   )
// }

// // ─── NOTIFICATION PREFERENCES ─────────────────────────────────────────────────
// const NOTIF_PREF_ROWS = [
//   { key: 'newOrderPlaced',         label: 'New order placed' },
//   { key: 'orderCancelled',         label: 'Order cancelled' },
//   { key: 'lowStockAlert',          label: 'Low stock alert' },
//   { key: 'paymentReceived',        label: 'Payment received' },
//   { key: 'deliveryCompleted',      label: 'Delivery completed' },
//   { key: 'newCorporateRegistered', label: 'New corporate registered' },
//   { key: 'newTicket',              label: 'New support ticket' },
//   { key: 'upcomingOccasion',       label: 'Upcoming occasion reminder' },
// ]

// function notifPrefsPath(role) {
//   return role === 'corporate_user' ? '/corporate/notifications' : '/admin/notifications'
// }

// function normalisePref(entry) {
//   if (entry === undefined || entry === null) return { email: true, inApp: true }
//   if (typeof entry === 'boolean') return { email: entry, inApp: entry }
//   return { email: entry.email !== false, inApp: entry.inApp !== false }
// }

// export function NotifPrefsPage() {
//   const { role } = useApp()
//   const [prefs, setPrefs]     = useState({})
//   const [loading, setLoading] = useState(true)
//   const [saving, setSaving]   = useState(false)

//   useEffect(() => {
//     async function load() {
//       try {
//         const res = await apiFetch('GET', `${notifPrefsPath(role)}/preferences`)
//         const raw = res.data?.preferences || {}
//         const out = {}
//         for (const row of NOTIF_PREF_ROWS) out[row.key] = normalisePref(raw[row.key])
//         setPrefs(out)
//       } catch (err) {
//         showToast(err.message || 'Failed to load preferences.', 'error')
//       } finally {
//         setLoading(false)
//       }
//     }
//     load()
//   }, [role])

//   function toggle(key, channel) {
//     setPrefs(p => ({ ...p, [key]: { ...p[key], [channel]: !p[key][channel] } }))
//   }

//   async function save() {
//     setSaving(true)
//     try {
//       await apiFetch('PUT', `${notifPrefsPath(role)}/preferences`, prefs)
//       showToast('Preferences saved.')
//     } catch (err) {
//       showToast(err.message || 'Could not save preferences.', 'error')
//     } finally {
//       setSaving(false)
//     }
//   }

//   if (loading) return <Loading />
//   return (
//     <div>
//       <PageHeader title="Notification Preferences" subtitle="Choose what alerts you receive and how" />
//       <Card>
//         <div className="text-[11px] text-text2 mb-3">In-app prefs control the bell dropdown. Email prefs are saved for future use; email sending is not gated yet.</div>
//         <TableWrap>
//           <thead><tr><th>Event</th><th className="text-center">In-App</th><th className="text-center">Email</th></tr></thead>
//           <tbody>
//             {NOTIF_PREF_ROWS.map(row => (
//               <tr key={row.key}>
//                 <td className="text-[13px]">{row.label}</td>
//                 <td className="text-center">
//                   <input type="checkbox" className="accent-accent" checked={!!prefs[row.key]?.inApp} onChange={() => toggle(row.key, 'inApp')} />
//                 </td>
//                 <td className="text-center">
//                   <input type="checkbox" className="accent-accent" checked={!!prefs[row.key]?.email} onChange={() => toggle(row.key, 'email')} />
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </TableWrap>
//         <div className="mt-4">
//           <Btn variant="primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Preferences'}</Btn>
//         </div>
//       </Card>
//     </div>
//   )
// }



import React, { useEffect, useRef, useState } from 'react'
import { apiFetch, formatDate, formatCurrency } from '../../../utils/api.js'
import { Badge, Card, CardHeader, PageHeader, FilterBar, TableWrap, TblAction, Btn, Loading, Modal, FormGroup, Input, Select, Textarea } from '../../ui/index.jsx'
import { showToast } from '../../ui/index.jsx'
import GoogleSyncRowAction from '../../ui/GoogleSyncRowAction.jsx'
import { useApp } from '../../../AppContext.jsx'

// ─── OCCASIONS ─────────────────────────────────────────────────────────────────
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const WEEKDAYS_FULL  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const WEEKDAYS_SHORT = ['Su','Mo','Tu','We','Th','Fr','Sa']
const WEEKDAYS_MIN   = ['S','M','T','W','T','F','S']

const EVENT_EMOJI = { birthday: '🎂', anniversary: '🎊', holiday: '🎉', custom: '📅' }

function isoYMD(d) {
  const y  = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const da = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${da}`
}

const EMPTY_OCC_FORM = { type: 'birthday', title: '', corporate: '', date: '', notes: '' }

export function OccasionsPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [occasions, setOccasions]       = useState([])
  const [loading, setLoading]           = useState(false)
  const [showAdd, setShowAdd]           = useState(false)
  const [occForm, setOccForm]           = useState(EMPTY_OCC_FORM)
  const [occFormError, setOccFormError] = useState('')
  const [occSaving, setOccSaving]       = useState(false)
  const [corpList, setCorpList]         = useState([])
  const [pickerOpen, setPickerOpen]     = useState(false)
  const [pickerYear, setPickerYear]     = useState(new Date().getFullYear())
  const pickerRef = useRef(null)
  const calendarRef = useRef(null)

  const year         = currentMonth.getFullYear()
  const month        = currentMonth.getMonth()
  const firstDay     = new Date(year, month, 1).getDay()
  const daysInMonth  = new Date(year, month + 1, 0).getDate()
  const prevLastDate = new Date(year, month, 0).getDate()
  const leadingCount  = firstDay
  const trailingCount = (7 - ((leadingCount + daysInMonth) % 7)) % 7

  const today = new Date()
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth()

  // ── Data fetch on month change ───────────────────────────────────────────
  async function loadOccasions(signal) {
    setLoading(true)
    const from = isoYMD(new Date(year, month, 1))
    const to   = isoYMD(new Date(year, month + 1, 0))
    try {
      const res = await apiFetch('GET', `/admin/occasions?from=${from}&to=${to}&limit=200`)
      if (!signal?.aborted) setOccasions(res.data?.occasions || [])
    } catch (err) {
      if (!signal?.aborted) {
        setOccasions([])
        showToast(err.message || 'Failed to load occasions.', 'error')
      }
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }

  useEffect(() => {
    const ctrl = { aborted: false }
    loadOccasions(ctrl)
    return () => { ctrl.aborted = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month])

  // Load corporate list once for the Add Occasion form dropdown
  useEffect(() => {
    apiFetch('GET', '/admin/corporates?limit=200')
      .then(res => setCorpList(res.data?.corporates || []))
      .catch(() => setCorpList([]))
  }, [])

  // ── Map occasions by day-of-month ────────────────────────────────────────
  const eventMap = {}
  for (const occ of occasions) {
    const d = new Date(occ.date)
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate()
      ;(eventMap[day] = eventMap[day] || []).push(occ)
    }
  }

  // ── Upcoming list: occasions on or after today, sorted ──────────────────
  const upcoming = [...occasions]
    .filter(o => new Date(o.date) >= new Date(today.toDateString()))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 6)

  // ── Navigation helpers ──────────────────────────────────────────────────
  const goPrev  = () => setCurrentMonth(new Date(year, month - 1, 1))
  const goNext  = () => setCurrentMonth(new Date(year, month + 1, 1))
  const goToday = () => setCurrentMonth(new Date())

  // ── Keyboard: Left/Right/T on the focused calendar wrapper ──────────────
  function handleKeyDown(e) {
    if (showAdd || pickerOpen) return
    if (e.target && e.target.tagName === 'INPUT') return
    if (e.key === 'ArrowLeft')       { e.preventDefault(); goPrev() }
    else if (e.key === 'ArrowRight') { e.preventDefault(); goNext() }
    else if (e.key === 't' || e.key === 'T') { e.preventDefault(); goToday() }
  }

  // ── Month/year picker: open via title click, close on outside click ─────
  function openPicker() {
    setPickerYear(year)
    setPickerOpen(true)
  }
  useEffect(() => {
    if (!pickerOpen) return
    function onDocMouseDown(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false)
    }
    function onEsc(e) { if (e.key === 'Escape') setPickerOpen(false) }
    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onEsc)
    }
  }, [pickerOpen])

  function pickMonth(idx) {
    setCurrentMonth(new Date(pickerYear, idx, 1))
    setPickerOpen(false)
  }

  return (
    <div>
      <PageHeader title="Occasions & Calendar" subtitle="Track birthdays, anniversaries, and events">
        <Btn variant="primary" onClick={() => setShowAdd(true)}>+ Add Occasion</Btn>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
        <Card>
          <div
            ref={calendarRef}
            tabIndex={0}
            role="grid"
            aria-label={`Calendar for ${MONTH_NAMES[month]} ${year}`}
            onKeyDown={handleKeyDown}
            className="outline-none focus:ring-1 focus:ring-accent rounded"
          >
            {/* Header row: prev / title-picker / next / today */}
            <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Btn size="sm" onClick={goPrev} title="Previous month" aria-label="Previous month">‹</Btn>

                <div className="relative" ref={pickerRef}>
                  <button
                    type="button"
                    onClick={() => (pickerOpen ? setPickerOpen(false) : openPicker())}
                    aria-haspopup="dialog"
                    aria-expanded={pickerOpen}
                    title="Pick a month or year"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-border2 bg-surface text-text1 font-semibold text-sm cursor-pointer hover:bg-surface2 hover:text-accent transition-colors"
                  >
                    <span>{MONTH_NAMES[month]} {year}</span>
                    <span className="text-[10px] text-text3">▾</span>
                  </button>
                  {pickerOpen && (
                    <div className="absolute left-0 top-full mt-1 z-30 bg-surface border border-border rounded-lg shadow-lg p-3 w-64" role="dialog" aria-label="Month and year picker">
                      <div className="flex items-center justify-between mb-2">
                        <button
                          type="button"
                          onClick={() => setPickerYear(y => y - 1)}
                          title="Previous year"
                          aria-label="Previous year"
                          className="w-7 h-7 rounded border border-border2 bg-surface text-text2 hover:bg-surface2 hover:text-text1 cursor-pointer text-xs flex items-center justify-center"
                        >◂</button>
                        <span className="font-semibold text-sm">{pickerYear}</span>
                        <button
                          type="button"
                          onClick={() => setPickerYear(y => y + 1)}
                          title="Next year"
                          aria-label="Next year"
                          className="w-7 h-7 rounded border border-border2 bg-surface text-text2 hover:bg-surface2 hover:text-text1 cursor-pointer text-xs flex items-center justify-center"
                        >▸</button>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {MONTH_SHORT.map((m, i) => {
                          const selected = pickerYear === year && i === month
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => pickMonth(i)}
                              title={`${MONTH_NAMES[i]} ${pickerYear}`}
                              className={`py-1.5 text-xs rounded cursor-pointer transition-colors border
                                ${selected
                                  ? 'bg-accent text-white border-accent'
                                  : 'bg-surface border-border2 text-text1 hover:bg-surface2 hover:border-accent'}`}
                            >
                              {m}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <Btn size="sm" onClick={goNext} title="Next month" aria-label="Next month">›</Btn>
              </div>
              <Btn size="sm" onClick={goToday} title="Jump to today">Today</Btn>
            </div>

            {/* Weekday header */}
            <div className="grid grid-cols-7 gap-1 min-w-[280px]">
              {WEEKDAYS_SHORT.map((d, i) => (
                <div key={d + i} className="text-center text-[11px] font-medium text-text2 py-1.5" role="columnheader" aria-label={WEEKDAYS_FULL[i]}>
                  <span className="hidden md:inline">{d}</span>
                  <span className="md:hidden">{WEEKDAYS_MIN[i]}</span>
                </div>
              ))}

              {/* Leading days from previous month (faded) */}
              {Array.from({ length: leadingCount }, (_, i) => {
                const dayNum = prevLastDate - leadingCount + i + 1
                return (
                  <div
                    key={`lead-${i}`}
                    role="gridcell"
                    aria-disabled="true"
                    className="min-h-[44px] sm:aspect-square sm:min-h-0 rounded flex flex-col items-center justify-center text-[12px] text-text3 opacity-40 select-none"
                  >
                    {dayNum}
                  </div>
                )
              })}

              {/* Days of the current month */}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1
                const evs = eventMap[day] || []
                const isToday = isCurrentMonth && day === today.getDate()
                const date = new Date(year, month, day)
                const tooltip = evs.length
                  ? `${evs.length} occasion${evs.length > 1 ? 's' : ''} on ${isoYMD(date)}`
                  : `Add occasion on ${isoYMD(date)}`

                return (
                  <button
                    key={day}
                    type="button"
                    role="gridcell"
                    onClick={() => setShowAdd(true)}
                    title={tooltip}
                    aria-label={tooltip}
                    className={`relative min-h-[44px] sm:aspect-square sm:min-h-0 rounded flex flex-col items-center justify-center cursor-pointer text-[12px] border transition-all outline-none
                      focus:ring-1 focus:ring-accent focus:z-10
                      ${isToday
                        ? 'bg-accent-light text-accent font-semibold border-accent'
                        : 'border-transparent hover:bg-surface2 hover:border-border2'}`}
                  >
                    <span>{day}</span>
                    {evs.length > 0 && (
                      <span className="mt-0.5 flex items-center gap-0.5" aria-hidden="true">
                        {evs.slice(0, 3).map((_, j) => (
                          <span key={j} className="w-1 h-1 rounded-full bg-accent" />
                        ))}
                        {evs.length > 3 && <span className="text-[9px] text-accent leading-none">+</span>}
                      </span>
                    )}
                  </button>
                )
              })}

              {/* Trailing days from next month (faded) */}
              {Array.from({ length: trailingCount }, (_, i) => (
                <div
                  key={`trail-${i}`}
                  role="gridcell"
                  aria-disabled="true"
                  className="min-h-[44px] sm:aspect-square sm:min-h-0 rounded flex flex-col items-center justify-center text-[12px] text-text3 opacity-40 select-none"
                >
                  {i + 1}
                </div>
              ))}
            </div>

            {loading && <div className="text-[11px] text-text3 mt-3 text-center">Loading…</div>}
          </div>
        </Card>

        <Card>
          <CardHeader title="Upcoming Occasions" />
          {upcoming.length === 0 ? (
            <div className="text-text2 text-sm py-6 text-center">No records found.</div>
          ) : (
            <div className="flex flex-col gap-0">
              {upcoming.map((e, i, arr) => {
                const d = new Date(e.date)
                return (
                  <div key={e._id || i} className="flex items-start gap-3 pb-4 relative">
                    {i < arr.length - 1 && <div className="absolute left-[14px] top-7 bottom-0 w-px bg-border" />}
                    <div className="w-7 h-7 rounded-full bg-accent-light border-2 border-accent flex items-center justify-center text-[11px] z-10">
                      {EVENT_EMOJI[e.type] || '📅'}
                    </div>
                    <div className="flex-1 pt-0.5 min-w-0">
                      <div className="text-[13px] font-medium truncate">{e.title}</div>
                      <div className="text-[11px] text-text2 mt-0.5">
                        {MONTH_NAMES[d.getMonth()]} {d.getDate()}, {d.getFullYear()}
                        {e.corporate?.companyName ? ` · ${e.corporate.companyName}` : ''}
                      </div>
                      <GoogleSyncRowAction
                        occasion={e}
                        basePath="/admin/occasions"
                        onSynced={(patch) => setOccasions(list => list.map(o => o._id === e._id ? { ...o, ...patch } : o))}
                      />
                    </div>
                    <Badge status={e.type === 'birthday' ? 'assigned' : e.type === 'anniversary' ? 'processing' : 'new'} />
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {showAdd && (
        <Modal
          title="Add Occasion"
          onClose={() => { setShowAdd(false); setOccForm(EMPTY_OCC_FORM); setOccFormError('') }}
          actions={[
            {
              label: occSaving ? 'Adding…' : 'Add',
              primary: true,
              disabled: occSaving,
              onClick: async () => {
                if (!occForm.type) { setOccFormError('Type is required.'); return }
                if (!occForm.title) { setOccFormError('Title is required.'); return }
                if (!occForm.corporate) { setOccFormError('Corporate is required.'); return }
                if (!occForm.date) { setOccFormError('Date is required.'); return }
                setOccSaving(true); setOccFormError('')
                try {
                  await apiFetch('POST', '/admin/occasions', {
                    type: occForm.type,
                    title: occForm.title,
                    corporate: occForm.corporate || undefined,
                    date: occForm.date,
                    notes: occForm.notes || undefined,
                    business: undefined,
                  })
                  showToast('Occasion added.')
                  setShowAdd(false)
                  setOccForm(EMPTY_OCC_FORM)
                  setOccFormError('')
                  // Immediately reload so upcoming panel reflects the new entry
                  const ctrl = { aborted: false }
                  await loadOccasions(ctrl)
                } catch (err) {
                  setOccFormError(err.message || 'Could not add occasion.')
                } finally {
                  setOccSaving(false)
                }
              },
            },
            { label: 'Cancel', onClick: () => { setShowAdd(false); setOccForm(EMPTY_OCC_FORM); setOccFormError('') } },
          ]}
        >
          {occFormError && (
            <div className="mb-3 p-2.5 rounded border border-red-200 bg-red-50 text-red-700 text-[12px]">{occFormError}</div>
          )}
          <FormGroup label="Occasion Type">
            <Select value={occForm.type} onChange={e => setOccForm(f => ({ ...f, type: e.target.value }))}>
              <option value="birthday">Birthday</option>
              <option value="anniversary">Anniversary</option>
              <option value="holiday">Holiday</option>
              <option value="custom">Other</option>
            </Select>
          </FormGroup>
          <FormGroup label="Title">
            <Input
              placeholder="e.g. Ram's Birthday"
              value={occForm.title}
              onChange={e => setOccForm(f => ({ ...f, title: e.target.value }))}
            />
          </FormGroup>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormGroup label="Corporate">
              <Select value={occForm.corporate} onChange={e => setOccForm(f => ({ ...f, corporate: e.target.value }))}>
                <option value="">— Select corporate —</option>
                {corpList.map(c => (
                  <option key={c._id} value={c._id}>{c.companyName}</option>
                ))}
              </Select>
            </FormGroup>
            <FormGroup label="Date">
              <Input
                type="date"
                value={occForm.date}
                onChange={e => setOccForm(f => ({ ...f, date: e.target.value }))}
              />
            </FormGroup>
          </div>
          <FormGroup label="Notes">
            <Textarea
              placeholder="Optional notes…"
              value={occForm.notes}
              onChange={e => setOccForm(f => ({ ...f, notes: e.target.value }))}
            />
          </FormGroup>
        </Modal>
      )}
    </div>
  )
}

// ─── FEEDBACK ──────────────────────────────────────────────────────────────────
export function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    apiFetch('GET', '/admin/feedback').then(res => {
      setFeedbacks(res.data?.feedbacks || [])
      setLoading(false)
    })
  }, [])

  const avg = feedbacks.length ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1) : '0.0'

  if (loading) return <Loading />
  return (
    <div>
      <PageHeader title="Feedback & Ratings" />
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-surface border border-border rounded-lg p-4"><div className="text-xs text-text2 mb-1.5">Average Rating</div><div className="text-[22px] font-semibold">⭐ {avg}/5</div></div>
        <div className="bg-surface border border-border rounded-lg p-4"><div className="text-xs text-text2 mb-1.5">Total Reviews</div><div className="text-[22px] font-semibold">{feedbacks.length}</div></div>
        <div className="bg-surface border border-border rounded-lg p-4"><div className="text-xs text-text2 mb-1.5">5-Star Reviews</div><div className="text-[22px] font-semibold">{feedbacks.filter(f => f.rating === 5).length}</div></div>
      </div>
      <div className="flex flex-col gap-3">
        {feedbacks.map(f => (
          <Card key={f._id} className="py-3 px-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-medium text-[14px]">{f.corporate?.companyName || f.createdBy?.name || 'Anonymous'}</div>
                <div className="text-[11px] text-text2">Order: {f.order?.orderNumber || '—'} · {formatDate(f.createdAt)}</div>
              </div>
              <div className="text-lg">{'⭐'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</div>
            </div>
            <div className="text-[13px] text-text2">{f.comment}</div>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ─── DISCOUNTS ─────────────────────────────────────────────────────────────────
const EMPTY_DISCOUNT_FORM = {
  code: '', description: '', type: 'percentage', value: '',
  minOrderAmount: '', usageLimit: '', validUntil: '',
}

function toDateInputValue(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const y  = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const da = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${da}`
}

function discountDisplayStatus(d) {
  if (d.isActive === false) return 'inactive'
  if (d.validUntil && new Date(d.validUntil) < new Date()) return 'expired'
  return 'active'
}

export function DiscountsPage() {
  const [discounts, setDiscounts] = useState([])
  const [loading, setLoading]     = useState(true)
  const [editing, setEditing]     = useState(null)   // null | discount object being edited
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState(EMPTY_DISCOUNT_FORM)
  const [formError, setFormError] = useState('')
  const [saving, setSaving]       = useState(false)
  const [confirmDel, setConfirmDel] = useState(null) // null | discount to delete
  const [deleting, setDeleting]   = useState(false)

  async function loadDiscounts() {
    try {
      const res = await apiFetch('GET', '/admin/discounts')
      setDiscounts(res.data?.discounts || [])
    } catch (err) {
      showToast(err.message || 'Failed to load discounts.', 'error')
      setDiscounts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadDiscounts() }, [])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_DISCOUNT_FORM)
    setFormError('')
    setShowForm(true)
  }
  function openEdit(d) {
    setEditing(d)
    setForm({
      code: d.code || '',
      description: d.description || '',
      type: d.type || 'percentage',
      value: d.value ?? '',
      minOrderAmount: d.minOrderAmount ?? '',
      usageLimit: d.usageLimit ?? '',
      validUntil: toDateInputValue(d.validUntil),
    })
    setFormError('')
    setShowForm(true)
  }

  // Flip the coupon between active and inactive without opening the modal.
  // The table status column will re-derive via discountDisplayStatus — so an
  // expired coupon's pill stays "expired" even after activating.
  async function toggleActive(d) {
    const nextIsActive = !(d.isActive !== false)   // treat undefined as active
    try {
      await apiFetch('PUT', `/admin/discounts/${d._id}`, { isActive: nextIsActive })
      setDiscounts(ds => ds.map(x => x._id === d._id ? { ...x, isActive: nextIsActive } : x))
      showToast(nextIsActive ? 'Coupon activated.' : 'Coupon deactivated.')
    } catch (err) {
      showToast(err.message || 'Could not update coupon.', 'error')
    }
  }
  function closeForm() {
    setShowForm(false)
    setEditing(null)
    setForm(EMPTY_DISCOUNT_FORM)
    setFormError('')
    setSaving(false)
  }

  async function submitForm() {
    if (!form.code.trim())       { setFormError('Coupon code is required.'); return }
    if (!form.type)              { setFormError('Type is required.'); return }
    if (form.value === '' || Number.isNaN(Number(form.value)) || Number(form.value) <= 0) {
      setFormError('Discount value must be a positive number.'); return
    }
    if (!form.validUntil)        { setFormError('Expiry date is required.'); return }

    const payload = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || undefined,
      type: form.type,
      value: Number(form.value),
      minOrderAmount: form.minOrderAmount === '' ? 0 : Number(form.minOrderAmount),
      usageLimit: form.usageLimit === '' ? undefined : Number(form.usageLimit),
      validUntil: new Date(form.validUntil).toISOString(),
    }
    if (!editing) payload.validFrom = new Date().toISOString()

    setSaving(true)
    setFormError('')
    try {
      if (editing) {
        await apiFetch('PUT', `/admin/discounts/${editing._id}`, payload)
        showToast('Discount updated.')
      } else {
        await apiFetch('POST', '/admin/discounts', payload)
        showToast('Discount created.')
      }
      await loadDiscounts()
      closeForm()
    } catch (err) {
      setFormError(err.message || 'Could not save discount.')
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!confirmDel) return
    setDeleting(true)
    try {
      await apiFetch('DELETE', `/admin/discounts/${confirmDel._id}`)
      setDiscounts(prev => prev.filter(d => d._id !== confirmDel._id))
      showToast('Discount deleted.')
      setConfirmDel(null)
    } catch (err) {
      showToast(err.message || 'Could not delete discount.', 'error')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <Loading />

  return (
    <div>
      <PageHeader title="Discounts & Promotions">
        <Btn variant="primary" onClick={openCreate}>+ Create Discount</Btn>
      </PageHeader>
      <Card noPad>
        <TableWrap>
          <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Min Order</th><th>Usage</th><th>Expiry</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {discounts.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-text2 text-sm">No discounts yet. Create one to get started.</td></tr>
            ) : discounts.map(d => {
              const displayStatus = discountDisplayStatus(d)
              const isInactive = d.isActive === false
              const isExpired = displayStatus === 'expired'
              return (
                <tr key={d._id} className={isInactive || isExpired ? 'opacity-60' : ''}>
                  <td>
                    <span className="bg-accent-light text-accent font-mono font-semibold px-2 py-0.5 rounded text-[12px]">{d.code}</span>
                    {d.description && <div className="text-[11px] text-text2 mt-0.5 max-w-[220px] truncate">{d.description}</div>}
                  </td>
                  <td>{d.type}</td>
                  <td>{d.type === 'percentage' ? `${d.value}%` : formatCurrency(d.value)}</td>
                  <td>{formatCurrency(d.minOrderAmount || 0)}</td>
                  <td>{(d.usedCount || 0)}/{d.usageLimit ?? '∞'}</td>
                  <td>{formatDate(d.validUntil)}</td>
                  <td><Badge status={displayStatus} /></td>
                  <td>
                    <div className="flex gap-1.5">
                      <TblAction onClick={() => openEdit(d)}>Edit</TblAction>
                      <TblAction
                        onClick={() => toggleActive(d)}
                        title={isExpired && isInactive ? 'Coupon is also past its expiry date — edit the expiry before use.' : undefined}
                      >
                        {isInactive ? 'Activate' : 'Deactivate'}
                      </TblAction>
                      <TblAction variant="danger" onClick={() => setConfirmDel(d)}>Delete</TblAction>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </TableWrap>
      </Card>

      {showForm && (
        <Modal
          title={editing ? 'Edit Discount' : 'Create Discount'}
          onClose={closeForm}
          actions={[
            { label: saving ? 'Saving…' : (editing ? 'Save' : 'Create'), primary: true, onClick: submitForm, disabled: saving },
            { label: 'Cancel', onClick: closeForm },
          ]}
        >
          {formError && (
            <div className="mb-3 p-2.5 rounded border border-red-200 bg-red-50 text-red-700 text-[12px]">{formError}</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormGroup label="Coupon Code">
              <Input placeholder="SAVE20" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
            </FormGroup>
            <FormGroup label="Type">
              <Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </Select>
            </FormGroup>
            <FormGroup label="Discount Value">
              <Input type="number" placeholder="20" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
            </FormGroup>
            <FormGroup label="Minimum Order">
              <Input type="number" placeholder="0" value={form.minOrderAmount} onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))} />
            </FormGroup>
            <FormGroup label="Max Uses" hint="Leave blank for unlimited.">
              <Input type="number" placeholder="100" value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))} />
            </FormGroup>
            <FormGroup label="Expiry Date">
              <Input type="date" value={form.validUntil} onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))} />
            </FormGroup>
          </div>
          <FormGroup label="Description" hint="Shown to corporate users when they view available coupons.">
            <Input
              placeholder="e.g. 20% off for Diwali orders"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </FormGroup>
        </Modal>
      )}

      {confirmDel && (
        <Modal
          title="Delete Discount"
          onClose={() => !deleting && setConfirmDel(null)}
          actions={[
            { label: deleting ? 'Deleting…' : 'Delete', primary: true, onClick: confirmDelete, disabled: deleting },
            { label: 'Cancel', onClick: () => setConfirmDel(null) },
          ]}
        >
          <div className="text-[13px] text-text1">
            Delete discount <span className="font-mono font-semibold">{confirmDel.code}</span>? This cannot be undone.
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── TICKETS ──────────────────────────────────────────────────────────────────
const ADMIN_TKT_STATUS_OPTIONS = [
  { value: 'open',        label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved',    label: 'Resolved' },
  { value: 'closed',      label: 'Closed' },
]
const ADMIN_TKT_PRIORITY_BADGE = { low: 'new', medium: 'processing', high: 'overdue', urgent: 'failed' }

export function TicketsPage() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail]   = useState(null)          // { ticket, comments } | null
  const [detailLoading, setDetailLoading] = useState(false)
  const [statusDraft, setStatusDraft] = useState('')
  const [savingStatus, setSavingStatus] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replyInternal, setReplyInternal] = useState(false)
  const [posting, setPosting] = useState(false)
  const [replyError, setReplyError] = useState('')

  const [filters, setFilters] = useState({ status: '', priority: '' })

  async function loadTickets(silent = false) {
    if (!silent) setLoading(true)
    try {
      const qp = new URLSearchParams()
      if (filters.status)   qp.set('status', filters.status)
      if (filters.priority) qp.set('priority', filters.priority)
      const res = await apiFetch('GET', '/admin/tickets?' + qp.toString())
      setTickets(res.data?.tickets || [])
    } catch (err) {
      if (!silent) showToast(err.message || 'Failed to load tickets.', 'error')
      if (!silent) setTickets([])
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => { loadTickets() }, [filters.status, filters.priority])

  // Auto-refresh every 30 seconds to catch new tickets from corporates
  useEffect(() => {
    const interval = setInterval(() => loadTickets(true), 30000)
    return () => clearInterval(interval)
  }, [filters.status, filters.priority])

  const counts = {
    open:       tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved:   tickets.filter(t => t.status === 'resolved').length,
  }

  async function openDetail(t) {
    setDetail({ ticket: t, comments: [] })
    setStatusDraft(t.status)
    setReplyText('')
    setReplyInternal(false)
    setReplyError('')
    setDetailLoading(true)
    try {
      const res = await apiFetch('GET', `/admin/tickets/${t._id}`)
      setDetail({ ticket: res.data?.ticket || t, comments: res.data?.comments || [] })
    } catch (err) {
      showToast(err.message || 'Could not load ticket.', 'error')
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }
  function closeDetail() {
    setDetail(null)
    setStatusDraft('')
    setReplyText('')
    setReplyInternal(false)
    setReplyError('')
    setPosting(false)
    setSavingStatus(false)
  }

  async function saveStatus() {
    if (!detail || statusDraft === detail.ticket.status) return
    setSavingStatus(true)
    try {
      const res = await apiFetch('PATCH', `/admin/tickets/${detail.ticket._id}/status`, { status: statusDraft })
      const updated = res.data?.ticket
      setDetail(d => ({ ...d, ticket: updated || { ...d.ticket, status: statusDraft } }))
      setTickets(prev => prev.map(t => t._id === detail.ticket._id ? { ...t, status: statusDraft } : t))
      showToast('Status updated.')
    } catch (err) {
      showToast(err.message || 'Could not update status.', 'error')
      setStatusDraft(detail.ticket.status)
    } finally {
      setSavingStatus(false)
    }
  }

  async function postReply() {
    if (!replyText.trim()) { setReplyError('Message is required.'); return }
    if (!detail) return
    setPosting(true)
    setReplyError('')
    try {
      const res = await apiFetch('POST', `/admin/tickets/${detail.ticket._id}/reply`, { message: replyText.trim(), isInternal: replyInternal })
      setDetail(d => ({ ...d, comments: [...d.comments, res.data.comment] }))
      setReplyText('')
      setReplyInternal(false)
    } catch (err) {
      setReplyError(err.message || 'Could not post reply.')
    } finally {
      setPosting(false)
    }
  }

  if (loading) return <Loading />
  return (
    <div>
      <PageHeader title="Support Tickets">
        <Btn size="sm" onClick={() => loadTickets()} title="Refresh tickets">↻ Refresh</Btn>
      </PageHeader>

      <div className="flex gap-3 mb-4 flex-wrap">
        <select
          value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          className="px-3 py-2 border border-border2 rounded bg-surface text-text1 text-[13px] outline-none focus:border-accent"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select
          value={filters.priority}
          onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}
          className="px-3 py-2 border border-border2 rounded bg-surface text-text1 text-[13px] outline-none focus:border-accent"
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        {(filters.status || filters.priority) && (
          <button
            onClick={() => setFilters({ status: '', priority: '' })}
            className="px-3 py-1.5 text-[12px] text-text2 border border-border rounded hover:bg-surface2 transition-colors"
          >Clear</button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          ['Open',        counts.open,       'bg-blue-50 text-blue-800'],
          ['In Progress', counts.inProgress, 'bg-amber-50 text-amber-800'],
          ['Resolved',    counts.resolved,   'bg-green-50 text-green-800'],
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
          <thead><tr><th>Ticket</th><th>Subject</th><th>Corporate</th><th>Category</th><th>Priority</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>
            {tickets.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-text2 text-sm">No records found.</td></tr>
            ) : tickets.map(t => (
              <tr key={t._id}>
                <td data-label="Ticket"><span className="font-mono text-[12px] text-text3">{t.ticketNumber || '—'}</span></td>
                <td data-label="Subject" className="font-medium">{t.subject}</td>
                <td data-label="Corporate">{t.corporate?.companyName || '—'}</td>
                <td data-label="Category">{t.category}</td>
                <td data-label="Priority"><Badge status={ADMIN_TKT_PRIORITY_BADGE[t.priority] || 'new'} /></td>
                <td data-label="Status"><Badge status={t.status} /></td>
                <td data-label="Created">{formatDate(t.createdAt)}</td>
                <td data-label="Actions"><TblAction onClick={() => openDetail(t)}>View</TblAction></td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>

      {detail && (
        <Modal
          title={`${detail.ticket.ticketNumber || 'Ticket'} · ${detail.ticket.subject}`}
          onClose={closeDetail}
          size="lg"
          actions={[{ label: 'Close', onClick: closeDetail }]}
        >
          <div className="flex flex-wrap gap-2 mb-3 text-[11px]">
            <Badge status={detail.ticket.status} />
            <Badge status={ADMIN_TKT_PRIORITY_BADGE[detail.ticket.priority] || 'new'} />
            <span className="px-2 py-0.5 rounded-full bg-surface2 border border-border text-text2">{detail.ticket.category}</span>
            {detail.ticket.corporate?.companyName && <span className="text-text2">· {detail.ticket.corporate.companyName}</span>}
            <span className="text-text2">· {formatDate(detail.ticket.createdAt)}</span>
          </div>
          <div className="mb-4 p-3 rounded border border-border bg-surface2 text-[13px] whitespace-pre-wrap">{detail.ticket.description}</div>

          <div className="mb-4 flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-xs font-medium text-text2 mb-1.5">Status</label>
              <Select value={statusDraft} onChange={e => setStatusDraft(e.target.value)}>
                {ADMIN_TKT_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </div>
            <Btn variant="primary" onClick={saveStatus} disabled={savingStatus || statusDraft === detail.ticket.status}>
              {savingStatus ? 'Saving…' : 'Update'}
            </Btn>
          </div>

          <div className="text-xs font-medium text-text2 uppercase tracking-wider mb-2">Conversation</div>
          {detailLoading ? (
            <div className="text-[12px] text-text3 text-center py-4">Loading…</div>
          ) : detail.comments.length === 0 ? (
            <div className="text-[12px] text-text2 text-center py-4">No replies yet.</div>
          ) : (
            <div className="flex flex-col gap-2 mb-4 max-h-[240px] overflow-y-auto">
              {detail.comments.map(c => (
                <div key={c._id} className={`p-2.5 rounded text-[12px] ${c.isInternal ? 'bg-amber-50 border border-amber-200' : 'bg-surface2'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">
                      {c.author?.name || 'Support'}
                      {c.isInternal && <span className="ml-1.5 text-[10px] text-amber-700">internal</span>}
                    </span>
                    <span className="text-text3 text-[11px]">{formatDate(c.createdAt)}</span>
                  </div>
                  <div className="whitespace-pre-wrap">{c.message}</div>
                </div>
              ))}
            </div>
          )}

          {replyError && (
            <div className="mb-2 p-2 rounded border border-red-200 bg-red-50 text-red-700 text-[11px]">{replyError}</div>
          )}
          <FormGroup label="Reply">
            <Textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Type your reply…" />
          </FormGroup>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-[12px] text-text2 cursor-pointer">
              <input type="checkbox" checked={replyInternal} onChange={e => setReplyInternal(e.target.checked)} />
              Internal note (not visible to corporate)
            </label>
            <Btn variant="primary" onClick={postReply} disabled={posting}>{posting ? 'Posting…' : 'Post Reply'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── INVENTORY ─────────────────────────────────────────────────────────────────
export function InventoryPage() {
  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [showAdjust, setShowAdjust] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await apiFetch('GET', '/admin/inventory')
      setItems(res.data?.items || [])
    } catch (err) {
      showToast(err.message || 'Failed to load inventory', 'error')
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const lowStock   = items.filter(i => i.status === 'low_stock').length
  const outOfStock = items.filter(i => i.status === 'out_of_stock').length

  if (loading) return <Loading />

  return (
    <div>
      <PageHeader title="Inventory Management" subtitle="Track stock levels and warehouse movement">
        <Btn variant="primary" onClick={() => setShowAdjust(true)}>+ Adjust Stock</Btn>
      </PageHeader>
      <div className="grid grid-cols-4 gap-4 mb-5">
        <div className="bg-surface border border-border rounded-lg p-4"><div className="text-xs text-text2 mb-1.5">Total Items</div><div className="text-[22px] font-semibold">{items.length}</div></div>
        <div className="bg-surface border border-border rounded-lg p-4"><div className="text-xs text-text2 mb-1.5">Low Stock</div><div className="text-[22px] font-semibold text-amber-700">{lowStock}</div></div>
        <div className="bg-surface border border-border rounded-lg p-4"><div className="text-xs text-text2 mb-1.5">Out of Stock</div><div className="text-[22px] font-semibold text-red-700">{outOfStock}</div></div>
        <div className="bg-surface border border-border rounded-lg p-4"><div className="text-xs text-text2 mb-1.5">Total Units</div><div className="text-[22px] font-semibold">{items.reduce((s, i) => s + (i.stock || 0), 0)}</div></div>
      </div>
      {lowStock > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded px-3.5 py-2.5 mb-4 text-[13px] text-amber-800">
          ⚠️ {lowStock} products are running low on stock
        </div>
      )}
      <Card noPad>
        <TableWrap>
          <thead><tr><th>Product</th><th>SKU</th><th>Stock</th><th>Alert Level</th><th>Warehouse</th><th>Status</th></tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item._id}>
                <td className="font-medium">{item.name}</td>
                <td><span className="font-mono text-[12px]">{item.sku}</span></td>
                <td>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${item.stock === 0 ? 'text-red-700' : item.stock < (item.alertThreshold || 20) ? 'text-amber-700' : 'text-text1'}`}>{item.stock}</span>
                    <div className="w-14 h-1.5 bg-surface2 rounded overflow-hidden">
                      <div className={`h-full rounded ${item.stock < (item.alertThreshold || 20) ? 'bg-amber-400' : 'bg-accent'}`} style={{ width: `${Math.min(item.stock, 100)}%` }} />
                    </div>
                  </div>
                </td>
                <td>{item.alertThreshold}</td>
                <td>{item.warehouse}</td>
                <td><Badge status={item.status} /></td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>
      {showAdjust && (
        <AdjustStockModal items={items} onClose={() => setShowAdjust(false)} onSave={() => { setShowAdjust(false); load() }} />
      )}
    </div>
  )
}

function AdjustStockModal({ items, onClose, onSave }) {
  const [form, setForm] = useState({ productId: items[0]?._id || '', type: 'in', quantity: 0, reason: '' })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  async function save() {
    try {
      await apiFetch('PATCH', `/admin/inventory/${form.productId}/adjust`, {
        quantity: Number(form.quantity), type: form.type, reason: form.reason,
      })
      showToast('Inventory adjusted')
      onSave()
    } catch (err) { showToast(err.message || 'Adjust failed', 'error') }
  }
  return (
    <Modal title="Adjust Stock" onClose={onClose}
      actions={[{ label: 'Adjust', primary: true, onClick: save }, { label: 'Cancel', onClick: onClose }]}>
      <FormGroup label="Product">
        <Select value={form.productId} onChange={set('productId')}>
          {items.map(i => <option key={i._id} value={i._id}>{i.name} (stock: {i.stock})</option>)}
        </Select>
      </FormGroup>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormGroup label="Adjustment Type">
          <Select value={form.type} onChange={set('type')}>
            <option value="in">Add Stock</option>
            <option value="out">Remove Stock</option>
            <option value="adjustment">Set Exact (signed delta)</option>
          </Select>
        </FormGroup>
        <FormGroup label="Quantity"><Input type="number" value={form.quantity} onChange={set('quantity')} /></FormGroup>
      </div>
      <FormGroup label="Reason"><Textarea value={form.reason} onChange={set('reason')} placeholder="e.g. Purchase, Return, Damaged, Audit Correction" /></FormGroup>
    </Modal>
  )
}

// ─── NOTIFICATION PREFERENCES ─────────────────────────────────────────────────
const NOTIF_PREF_ROWS = [
  { key: 'newOrderPlaced',         label: 'New order placed' },
  { key: 'orderCancelled',         label: 'Order cancelled' },
  { key: 'lowStockAlert',          label: 'Low stock alert' },
  { key: 'paymentReceived',        label: 'Payment received' },
  { key: 'deliveryCompleted',      label: 'Delivery completed' },
  { key: 'newCorporateRegistered', label: 'New corporate registered' },
  { key: 'newTicket',              label: 'New support ticket' },
  { key: 'upcomingOccasion',       label: 'Upcoming occasion reminder' },
]

function notifPrefsPath(role) {
  return role === 'corporate_user' ? '/corporate/notifications' : '/admin/notifications'
}

function normalisePref(entry) {
  if (entry === undefined || entry === null) return { email: true, inApp: true }
  if (typeof entry === 'boolean') return { email: entry, inApp: entry }
  return { email: entry.email !== false, inApp: entry.inApp !== false }
}

export function NotifPrefsPage() {
  const { role } = useApp()
  const [prefs, setPrefs]     = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch('GET', `${notifPrefsPath(role)}/preferences`)
        const raw = res.data?.preferences || {}
        const out = {}
        for (const row of NOTIF_PREF_ROWS) out[row.key] = normalisePref(raw[row.key])
        setPrefs(out)
      } catch (err) {
        showToast(err.message || 'Failed to load preferences.', 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [role])

  function toggle(key, channel) {
    setPrefs(p => ({ ...p, [key]: { ...p[key], [channel]: !p[key][channel] } }))
  }

  async function save() {
    setSaving(true)
    try {
      await apiFetch('PUT', `${notifPrefsPath(role)}/preferences`, prefs)
      showToast('Preferences saved.')
    } catch (err) {
      showToast(err.message || 'Could not save preferences.', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading />
  return (
    <div>
      <PageHeader title="Notification Preferences" subtitle="Choose what alerts you receive and how" />
      <Card>
        <div className="text-[11px] text-text2 mb-3">In-app prefs control the bell dropdown. Email prefs are saved for future use; email sending is not gated yet.</div>
        <TableWrap>
          <thead><tr><th>Event</th><th className="text-center">In-App</th><th className="text-center">Email</th></tr></thead>
          <tbody>
            {NOTIF_PREF_ROWS.map(row => (
              <tr key={row.key}>
                <td className="text-[13px]">{row.label}</td>
                <td className="text-center">
                  <input type="checkbox" className="accent-accent" checked={!!prefs[row.key]?.inApp} onChange={() => toggle(row.key, 'inApp')} />
                </td>
                <td className="text-center">
                  <input type="checkbox" className="accent-accent" checked={!!prefs[row.key]?.email} onChange={() => toggle(row.key, 'email')} />
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
        <div className="mt-4">
          <Btn variant="primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Preferences'}</Btn>
        </div>
      </Card>
    </div>
  )
}